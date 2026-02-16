# Expense Workflow Simplification

**Status:** Complete
**Date:** 2026-02-01
**Updated:** 2026-02-15
**Priority:** High

## Overview

Simplify the expense management workflow by removing the approval step. Expenses will go straight from creation to payment confirmation, with owner-only permissions for all actions.

## Implementation Note

> The approval workflow described below was **never implemented in the database schema**. The Expense model has always used only `paymentStatus` (Unpaid, PartiallyPaid, Paid) with no separate approval status field. This document was created to formalize the decision and ensure no approval workflow is ever added.

## Workflow

```
Create Expense → Payment Status: Unpaid
     ↓
Confirm Payment → Payment Status: PartiallyPaid → Paid
```

**Design principles:**
- Single status field (payment status only)
- Immediate payment processing
- Clearer UI and permissions
- Owner has full control over payments, edits, and deletions

## Database Schema

**Expense Model** (current — no changes needed):
- `paymentStatus` enum: `Unpaid`, `PartiallyPaid`, `Paid`
- No approval status field exists (never was implemented)
- No migration needed

## API Endpoints (Current Implementation)

| Endpoint | Method | Permission | Notes |
|----------|--------|-----------|-------|
| `/api/expenses` | POST | `canRecordExpenses` | Creates with `paymentStatus: Unpaid` |
| `/api/expenses/[id]` | PUT | `canRecordExpenses` | Cannot edit if fully paid |
| `/api/expenses/[id]` | DELETE | `canAccessBank` (Owner) | Owner-only |
| `/api/expenses/[id]/payments` | POST | `canAccessBank` (Owner) | Creates auto-confirmed bank withdrawal |
| `/api/expenses/[id]/payments` | GET | Authenticated | Lists payment history |

All endpoints use `authorizeRestaurantAccess()` for restaurant-scoped access control. No approval endpoint exists.

## Frontend Changes

### Files to Update

#### 1. `components/expenses/ExpensesTable.tsx`

**Remove:**
- Approval status column
- Approve/Reject action buttons
- Status filter dropdown
- Status badge display

**Update:**
- Show payment button for ALL expenses (not just approved ones)
- Payment button visible only to owner
- Edit/Delete buttons visible only to owner
- Remove `isManager` prop, add `isOwner` prop

**Changes:**
```typescript
// Old
{isManager && expense.status === 'Approved' && expense.paymentStatus !== 'Paid' && (
  <button onClick={() => onRecordPayment(expense)}>...</button>
)}

// New
{isOwner && expense.paymentStatus !== 'Paid' && (
  <button onClick={() => onRecordPayment(expense)}>...</button>
)}
```

#### 2. `app/finances/expenses/page.tsx`

**Remove:**
- Status filter state and dropdown
- Approval handlers (`handleApprove`, `handleReject`)
- Pending approvals summary card
- `canApprove` permission check

**Update:**
- Replace `isManager={canApproveItems}` with `isOwner={currentRole === 'Owner'}`
- Simplify summary cards (remove pending count)
- Remove status filter from API query parameters

**Permission logic:**
```typescript
// Old
const canApproveItems = canApprove(currentRole)

// New
const isOwner = currentRole === 'Owner'
```

#### 3. `components/expenses/AddEditExpenseModal.tsx`

**Update:**
- Remove status field from form
- Set default paymentStatus to 'Unpaid' for new expenses
- Owner-only edit mode
- Disable editing if paymentStatus = 'Paid'

#### 4. Interface Updates

**Expense Interface:**
```typescript
// Remove from all interfaces
status: 'Pending' | 'Approved' | 'Rejected'

// Keep
paymentStatus: 'Unpaid' | 'PartiallyPaid' | 'Paid'
```

**ExpensesSummary Interface:**
```typescript
// Remove
pendingCount: number
approvedCount: number

// Keep
totalExpenses: number
totalAmount: number
todayTotal: number
monthTotal: number
```

### UI/UX Changes

**Expenses Table Columns:**
| Before | After |
|--------|-------|
| Date | Date (wider width) |
| Category | Category |
| Amount | Amount |
| Reference | Reference |
| Supplier | Supplier |
| **Status** (Pending/Approved/Rejected) | ❌ **Removed** |
| Payment Status | Payment Status |
| Actions (View/Edit/Approve/Reject/Pay) | Actions (Edit/Delete/Pay) |

**Summary Cards:**
| Before | After |
|--------|-------|
| Today's Expenses | ✅ Keep |
| This Month | ✅ Keep |
| **Pending Approvals** | ❌ **Remove** |
| Period Total | ✅ Keep |

**Action Buttons (Owner Only):**
- ✏️ Edit (if not paid)
- 🗑️ Delete (if not paid)
- 💰 Record Payment (if not fully paid)

### Translation Updates

**Remove from `public/locales/en.json` and `fr.json`:**
```json
// Remove these keys
"expenses.allStatuses": "...",
"expenses.confirmApprove": "...",
"expenses.rejectReason": "...",
"expenses.pendingApprovals": "...",
"expenses.awaitingReview": "...",
```

**Keep:**
```json
"expenses.payment.unpaid": "Unpaid",
"expenses.payment.partiallyPaid": "Partially Paid",
"expenses.payment.paid": "Paid",
"expenses.payment.recordPayment": "Record Payment"
```

## Permission Matrix

| Action | Owner | RestaurantManager | Cashier | Staff |
|--------|-------|-------------------|---------|-------|
| View expenses | ✅ | ✅ | ✅ | ✅ |
| Create expense | ✅ | ✅ | ✅ | ✅ |
| Edit expense (unpaid) | ✅ | ❌ | ❌ | ❌ |
| Delete expense (unpaid) | ✅ | ❌ | ❌ | ❌ |
| Record payment | ✅ | ❌ | ❌ | ❌ |

## Implementation Status

All phases are complete:

- ✅ **Backend**: No approval fields in schema; API routes use `canRecordExpenses`/`canAccessBank`
- ✅ **Frontend**: ExpensesTable has no approval UI; payment/edit/delete buttons are owner-only
- ✅ **Permissions**: `authorizeRestaurantAccess()` pattern used in all expense endpoints
- ✅ **Bank integration**: Payments auto-create confirmed bank withdrawals

## Testing Checklist

**As Owner:**
- [x] Create new expense → paymentStatus = 'Unpaid'
- [x] Edit unpaid expense → changes saved
- [x] Delete unpaid expense → deleted successfully
- [x] Record payment → paymentStatus updates
- [x] Record partial payment → paymentStatus = 'PartiallyPaid'
- [x] Complete payment → paymentStatus = 'Paid'
- [x] Try to edit paid expense → disabled/blocked
- [x] Try to delete paid expense → disabled/blocked

**As Non-Owner (RestaurantManager, Cashier, Staff):**
- [x] Create new expense → success
- [x] View expense list → visible
- [x] Try to edit expense → blocked (except via canRecordExpenses for unpaid)
- [x] Try to delete expense → blocked
- [x] Try to record payment → blocked

## Notes

- Bank transaction creation remains unchanged (created when payment is recorded)
- Payment history tracking remains unchanged
- Expense items (inventory purchases) remain unchanged
- Supplier linking remains unchanged

## Related Documentation

- [BANK-TRANSACTION-UNIFICATION.md](BANK-TRANSACTION-UNIFICATION.md) - Payment confirmation creates bank transactions
- [ROLE-BASED-ACCESS-CONTROL.md](ROLE-BASED-ACCESS-CONTROL.md) - Permission model
- [CLAUDE.md](../../CLAUDE.md) - Updated with new expense workflow
