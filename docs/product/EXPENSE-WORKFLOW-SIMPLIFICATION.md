# Expense Workflow Simplification

**Status:** Planned
**Date:** 2026-02-01
**Priority:** High

## Overview

Simplify the expense management workflow by removing the approval step. Expenses will go straight from creation to payment confirmation, with owner-only permissions for all actions.

## Current Workflow (To Be Replaced)

```
Create Expense → Status: Pending
     ↓
Owner Approves → Status: Approved
     ↓
Record Payment → Payment Status: Unpaid → PartiallyPaid → Paid
```

**Problems with current flow:**
- Unnecessary approval step delays payment processing
- Confusing dual status system (approval status + payment status)
- Too many permission checks and UI states

## New Workflow (Simplified)

```
Create Expense → Payment Status: Unpaid
     ↓
Confirm Payment → Payment Status: PartiallyPaid → Paid
```

**Benefits:**
- Single status field (payment status only)
- Immediate payment processing
- Clearer UI and permissions
- Owner has full control

## Database Changes

### Schema Updates

**Expense Model:**
- ✅ Keep: `paymentStatus` enum ('Unpaid', 'PartiallyPaid', 'Paid')
- ❌ Remove: `status` enum ('Pending', 'Approved', 'Rejected')
- ✅ Keep: All other fields (date, amount, category, supplier, etc.)

### Migration Steps

1. Create migration to remove `status` field from Expense table
2. Update all existing expenses to remove status (or set a default if keeping for historical data)
3. Remove approval-related fields if any

**Migration file:** `prisma/migrations/YYYYMMDD_remove_expense_approval_status.sql`

## API Changes

### Endpoints to Update

**`POST /api/expenses`** (Create Expense)
- Remove approval workflow logic
- Set initial `paymentStatus` to 'Unpaid'
- Remove status validation

**`PUT /api/expenses/[id]`** (Update Expense)
- Remove status field from update logic
- Owner-only permission check
- Cannot edit if already paid (paymentStatus = 'Paid')

**`DELETE /api/expenses/[id]`** (Delete Expense)
- Add endpoint if not exists
- Owner-only permission check
- Cannot delete if already paid

**`POST /api/expenses/[id]/approve`** (Approval Endpoint)
- ❌ Remove this endpoint entirely

**`POST /api/expenses/[id]/payments`** (Record Payment)
- ✅ Keep this endpoint
- Remove approval status check
- Allow payment for any expense (not just approved ones)
- Owner-only permission

**`GET /api/expenses`** (List Expenses)
- Remove `status` from query parameters
- Remove `pendingCount`, `approvedCount` from summary
- Keep `paymentStatus` filtering

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

## Implementation Order

### Phase 1: Frontend Cleanup (No Breaking Changes)
1. ✅ Update ExpensesTable: Remove view icon, make rows clickable, wider date column
2. Document changes in this file

### Phase 2: Backend Changes
1. Create database migration to remove `status` field
2. Update API routes to remove approval logic
3. Update API route permissions (owner-only)
4. Add DELETE endpoint for expenses

### Phase 3: Frontend Updates
1. Update ExpensesTable to remove approval UI
2. Update expenses page to remove approval features
3. Update AddEditExpenseModal for owner-only editing
4. Remove status-related translations
5. Update summary cards

### Phase 4: Testing & Deployment
1. Test expense creation flow
2. Test payment recording flow
3. Test owner permissions
4. Test non-owner restrictions
5. Deploy changes

## Testing Checklist

**As Owner:**
- [ ] Create new expense → paymentStatus = 'Unpaid'
- [ ] Edit unpaid expense → changes saved
- [ ] Delete unpaid expense → deleted successfully
- [ ] Record payment → paymentStatus updates
- [ ] Record partial payment → paymentStatus = 'PartiallyPaid'
- [ ] Complete payment → paymentStatus = 'Paid'
- [ ] Try to edit paid expense → disabled/blocked
- [ ] Try to delete paid expense → disabled/blocked

**As Non-Owner (RestaurantManager, Cashier, Staff):**
- [ ] Create new expense → success
- [ ] View expense list → visible
- [ ] Try to edit expense → blocked
- [ ] Try to delete expense → blocked
- [ ] Try to record payment → blocked

## Migration Considerations

**Data Migration:**
- Existing expenses with status 'Approved' → already in valid state
- Existing expenses with status 'Pending' → need decision:
  - Option 1: Auto-approve all (set to 'Approved' before removing field)
  - Option 2: Keep as is and let owner process them
  - **Recommended:** Auto-approve all existing expenses before removing status field

**Rollback Plan:**
- Keep a database backup before migration
- Migration should be reversible if needed
- Document the old workflow for reference

## Notes

- Bank transaction creation remains unchanged (created when payment is recorded)
- Payment history tracking remains unchanged
- Expense items (inventory purchases) remain unchanged
- Supplier linking remains unchanged

## Related Documentation

- [BANK-TRANSACTION-UNIFICATION.md](BANK-TRANSACTION-UNIFICATION.md) - Payment confirmation creates bank transactions
- [ROLE-BASED-ACCESS-CONTROL.md](ROLE-BASED-ACCESS-CONTROL.md) - Permission model
- [CLAUDE.md](../../CLAUDE.md) - Updated with new expense workflow
