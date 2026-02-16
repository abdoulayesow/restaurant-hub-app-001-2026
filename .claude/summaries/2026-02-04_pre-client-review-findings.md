# Pre-Client Review Findings - February 4, 2026

## Overview

Comprehensive review of Bakery Hub application across 7 major flows before client presentation. This document organizes all findings into actionable phases.

**Reviewed Flows:**
1. Sales (recording, approval, bank deposit)
2. Expenses (recording, payment, bank withdrawal)
3. Production (logging, inventory deduction, approval)
4. Debts (credit sales, payments, collection)
5. Inventory/Stock (movements, alerts, reconciliation)
6. Bank Transactions (deposits, withdrawals, confirmation)
7. Multi-restaurant & Auth (switching, permissions, roles)

---

## Phase Summary

| Phase | Focus | Issue Count | Status | Effort |
|-------|-------|-------------|--------|--------|
| **Phase 0** | Security - Must fix immediately | 4 | ✅ **COMPLETE** (2026-02-05) | 1-2 hours |
| **Phase 1** | Critical bugs blocking demo | 7 | ✅ **COMPLETE** (2026-02-05) | 4-6 hours |
| **Phase 2** | High priority - Data integrity & permissions | 8 | Not started | 6-8 hours |
| **Phase 3** | Medium - UX & i18n gaps | 12 | Not started | 8-12 hours |
| **Phase 4** | Low - Polish & optimization | 10 | Not started | As time permits |

---

## Phase 0: Security (IMMEDIATE)

These must be fixed before any external access to the application.

### P0-1: Rotate OAuth Credentials
- **Flow:** Auth
- **Location:** `.env` file
- **Issue:** Google Client ID/Secret exposed in version control
- **Fix:**
  1. Go to Google Cloud Console
  2. Regenerate OAuth credentials
  3. Update `.env` (never commit)
  4. Add `.env` to `.gitignore` if not already
- **Effort:** 15 minutes
- [x] **Status: COMPLETE** (2026-02-05) - User confirmed credentials rotated

### P0-2: Add Role Check to Stock Adjust Endpoint
- **Flow:** Inventory
- **Location:** `app/api/inventory/[id]/adjust/route.ts`
- **Issue:** Any authenticated user can modify stock levels
- **Fix:** Add `isManagerRole(auth.role)` or `canRecordProduction(auth.role)` check
- **Effort:** 15 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Added `canAdjustStock()` check + negative stock validation

### P0-3: Add Role Check to Stock Movements Endpoint
- **Flow:** Inventory
- **Location:** `app/api/stock-movements/route.ts`
- **Issue:** Any authenticated user can create stock movements
- **Fix:** Add role check similar to P0-2
- **Effort:** 15 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Added `canAdjustStock()` check + negative stock validation

### P0-4: Add Restaurant Access Check to GET /api/expenses/[id]
- **Flow:** Expenses
- **Location:** `app/api/expenses/[id]/route.ts` (GET method)
- **Issue:** No restaurant access validation - user could fetch another restaurant's expense
- **Fix:** Add `userRestaurant` lookup before returning data
- **Effort:** 20 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Added `authorizeRestaurantAccess()` check

---

## Phase 1: Critical Bugs (Before Demo)

These are blocking issues that could cause visible failures during demo.

### P1-1: Fix ProductionDetail Stub Component
- **Flow:** Production
- **Location:** `components/production/ProductionDetail.tsx`
- **Issue:** Component shows "coming soon" - route `/baking/production/[id]` is broken
- **Fix Options:**
  - A) Implement the component properly
  - B) Remove the route and hide navigation to it
  - C) Redirect to list page with detail modal
- **Effort:** 2-4 hours (option A) or 30 min (option B/C)
- [x] **Status: COMPLETE** (2026-02-05) - Full 420-line implementation with type banner, details grid, costs, delete

### P1-2: Fix Dynamic Tailwind Classes in ProductionLogger
- **Flow:** Production
- **Location:** `components/baking/ProductionLogger.tsx:467-468`
- **Issue:** `border-${PRODUCT_CATEGORY_COLORS.Patisserie.border}` doesn't compile
- **Fix:** Replace dynamic class with static Tailwind classes or use inline styles
- **Effort:** 30 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Created `PRODUCTION_TYPE_BUTTON_CLASSES` with static class strings

### P1-3: Fix Debt Payment Role Permission
- **Flow:** Debts
- **Location:** `app/api/debts/[id]/payments/route.ts:147`
- **Issue:** Only Owner can record debt payments, but RestaurantManager should also be able to
- **Fix:** Change `canAccessBank()` to `canApprove()` or create new `canRecordDebtPayments()` function
- **Effort:** 20 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Created `canCollectDebtPayments()` allowing Owner/RestaurantManager/Cashier

### P1-4: Clarify Dual Role System (User.role vs UserRestaurant.role)
- **Flow:** Auth
- **Location:** `lib/auth.ts` (JWT callback), `components/providers/RestaurantProvider.tsx`
- **Issue:** JWT uses `User.role` (global), API uses `UserRestaurant.role` (per-restaurant) - can conflict
- **Fix Options:**
  - A) Update JWT callback to include per-restaurant role
  - B) Document that User.role is for initial access only, UserRestaurant.role for permissions
  - C) Remove User.role entirely, always use UserRestaurant.role
- **Effort:** 2-3 hours
- [x] **Status: COMPLETE** (2026-02-05) - Chose Option B: Documented in ROLE-BASED-ACCESS-CONTROL.md with API audit

### P1-5: Add Expense Amount Edit Validation
- **Flow:** Expenses
- **Location:** `app/api/expenses/[id]/route.ts` (PUT method)
- **Issue:** Can reduce expense amount below already-paid amount (e.g., 1000→500 when 600 paid)
- **Fix:** Add validation: `if (amountGNF < expense.totalPaidAmount) return error`
- **Effort:** 20 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Added validation preventing amount below totalPaidAmount

### P1-6: Add Transaction ID Uniqueness Constraint
- **Flow:** Debts
- **Location:** `prisma/schema.prisma` (DebtPayment model)
- **Issue:** Could allow duplicate payments with same transactionId
- **Fix:** Add `@@unique([debtId, transactionId])` or validate in API
- **Effort:** 30 minutes + migration
- [x] **Status: COMPLETE** (2026-02-05) - API validation + `@@unique([restaurantId, transactionId])` constraint

### P1-7: Fix Stock Negative Validation
- **Flow:** Inventory
- **Location:** `app/api/inventory/[id]/adjust/route.ts`
- **Issue:** API allows stock to go negative (UI prevents but API doesn't)
- **Fix:** Add server-side validation that resulting stock >= 0
- **Effort:** 20 minutes
- [x] **Status: COMPLETE** (2026-02-05) - Added server-side validation in both adjust and stock-movements APIs

---

## Phase 2: High Priority (Data Integrity & Permissions)

### P2-1: Scope Global Models to Restaurant
- **Flow:** All
- **Locations:** `prisma/schema.prisma` - Category, Supplier, ExpenseGroup models
- **Issue:** These models have no `restaurantId` - changes affect all restaurants
- **Fix:** Add `restaurantId` to each model, create migration, update all queries
- **Effort:** 4-6 hours
- [ ] **Status: Not Started**

### P2-2: Add Write-Off Date/Reason Fields
- **Flow:** Debts
- **Location:** `prisma/schema.prisma` (Debt model)
- **Issue:** Write-off reason appended to notes field - should be separate
- **Fix:** Add `writeOffDate`, `writeOffReason`, `writtenOffBy` fields
- **Effort:** 1 hour + migration
- [ ] **Status: Not Started**

### P2-3: Add Approval Audit Trail to Production
- **Flow:** Production
- **Location:** `prisma/schema.prisma` (ProductionLog model)
- **Issue:** No `approvedBy`, `approvedAt` fields - can't audit who approved
- **Fix:** Add audit fields, update approval API to populate them
- **Effort:** 1-2 hours
- [ ] **Status: Not Started**

### P2-4: Add Bank Transaction Confirmation Audit
- **Flow:** Bank
- **Location:** `prisma/schema.prisma` (BankTransaction model)
- **Issue:** Only `confirmedAt` exists, no `confirmedBy` field
- **Fix:** Add `confirmedBy` and `confirmedByName` fields
- **Effort:** 1 hour
- [ ] **Status: Not Started**

### P2-5: Fix Sales PUT N+1 Query
- **Flow:** Sales
- **Location:** `app/api/sales/[id]/route.ts:147-149`
- **Issue:** Product validation queries 1-by-1 instead of batching
- **Fix:** Use `findMany({ where: { id: { in: productIds } } })` pattern
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

### P2-6: Add reorderPoint < minStock Validation
- **Flow:** Inventory
- **Location:** `app/api/inventory/route.ts` (POST/PUT)
- **Issue:** No validation that reorderPoint should be less than minStock
- **Fix:** Add validation: `if (reorderPoint >= minStock) return error`
- **Effort:** 20 minutes
- [ ] **Status: Not Started**

### P2-7: Add Unit Validation for Inventory Transfers
- **Flow:** Inventory
- **Location:** `app/api/inventory/transfer/route.ts`
- **Issue:** Source and target items could have mismatched units
- **Fix:** Validate `sourceItem.unit === targetItem.unit` before transfer
- **Effort:** 20 minutes
- [ ] **Status: Not Started**

### P2-8: Fix Role Display in Headers
- **Flow:** Auth
- **Location:** `components/layout/DashboardHeader.tsx`, `components/layout/EditorHeader.tsx`
- **Issue:** Shows User's global role, not per-restaurant role
- **Fix:** Use `currentRole` from RestaurantContext instead of session role
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

---

## Phase 3: Medium Priority (UX & i18n)

### P3-1: Replace Gray Palette with Stone in Dark Mode
- **Flows:** Production, Inventory
- **Locations:** Multiple components use `gray-*` instead of `stone-*`
  - `components/baking/ProductionLogger.tsx`
  - `components/inventory/AddEditItemModal.tsx`
  - `components/inventory/StockAdjustmentModal.tsx`
  - `components/inventory/ViewItemModal.tsx`
  - `components/inventory/ReconciliationForm.tsx`
  - `app/baking/production/page.tsx`
- **Issue:** Violates design system (should use warm stone palette)
- **Fix:** Find/replace `gray-` with `stone-` in these files
- **Effort:** 1-2 hours
- [ ] **Status: Not Started**

### P3-2: Add Missing Translation Keys
- **Flows:** All
- **Locations:** `public/locales/en.json`, `public/locales/fr.json`
- **Missing Keys (sample):**
  - `debts.selectCustomer`
  - `debts.transactionIdRequired`
  - `errors.onlyOwnerCanWriteOff`
  - `production.backToProduction`
  - Various API error messages
- **Effort:** 2-3 hours to audit and add all
- [ ] **Status: Not Started**

### P3-3: Translate API Error Messages
- **Flows:** All
- **Issue:** API returns hardcoded English error messages
- **Fix Options:**
  - A) Return error codes, translate on frontend
  - B) Accept locale header, translate on backend
- **Effort:** 4-6 hours
- [ ] **Status: Not Started**

### P3-4: Replace Browser prompt() with Modal
- **Flow:** Sales
- **Location:** `app/finances/sales/page.tsx:255`
- **Issue:** Uses native `prompt()` for rejection reason - poor UX
- **Fix:** Create RejectionReasonModal component
- **Effort:** 1 hour
- [ ] **Status: Not Started**

### P3-5: Add Pagination to Tables
- **Flows:** Sales, Inventory
- **Locations:**
  - `components/sales/SalesTable.tsx`
  - Stock movement history (hardcoded 50 limit)
- **Issue:** Could load hundreds/thousands of rows
- **Fix:** Add cursor-based pagination
- **Effort:** 2-3 hours per table
- [ ] **Status: Not Started**

### P3-6: Add Loading States to Modals
- **Flows:** Sales, Expenses
- **Issue:** No loading indicators when opening modals that fetch data
- **Fix:** Add skeleton loaders while fetching customers/products
- **Effort:** 1-2 hours
- [ ] **Status: Not Started**

### P3-7: Fix Palette Assignment by Restaurant ID
- **Flow:** Auth
- **Location:** `components/providers/RestaurantProvider.tsx`
- **Issue:** Palettes assigned by array index - reordering breaks colors
- **Fix:** Map palettes to restaurant ID or store preference in DB
- **Effort:** 1-2 hours
- [ ] **Status: Not Started**

### P3-8: Validate localStorage Restaurant Selection
- **Flow:** Auth
- **Location:** `components/providers/RestaurantProvider.tsx`
- **Issue:** Stored restaurant ID not validated on page load
- **Fix:** Verify restaurant exists and user has access before using
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

### P3-9: Add Transaction ID Help Text
- **Flow:** Debts
- **Location:** `components/debts/RecordPaymentModal.tsx`
- **Issue:** Users don't know where to find Card/OrangeMoney transaction IDs
- **Fix:** Add contextual help text explaining what to enter
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

### P3-10: Replace alert() with Toast Notifications
- **Flows:** Inventory, Sales
- **Issue:** Error handling uses `alert()` instead of proper toasts
- **Fix:** Use existing toast pattern from other flows
- **Effort:** 1 hour
- [ ] **Status: Not Started**

### P3-11: Remove Emoji Usage in Production
- **Flow:** Production
- **Location:** `components/sales/AddEditSaleModal.tsx:880, 969`
- **Issue:** Uses 🥐🥖 emojis which may not render on all systems
- **Fix:** Replace with text labels or icons from Lucide
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

### P3-12: Add Error Boundaries to Pages
- **Flows:** Debts, Inventory
- **Issue:** API failures silently set error state but don't show UI
- **Fix:** Add error boundary components with retry buttons
- **Effort:** 2-3 hours
- [ ] **Status: Not Started**

---

## Phase 4: Low Priority (Polish & Optimization)

### P4-1: Refactor Hardcoded Reason Arrays in Bank
- **Flow:** Bank
- **Locations:**
  - `app/api/bank/transactions/route.ts:75, 247`
  - `components/bank/TransactionsTable.tsx:47-54`
- **Issue:** Duplicates constants from `lib/types/bank.ts`
- **Fix:** Import from shared constants file
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

### P4-2: Add Rate Limiting to APIs
- **Flows:** All
- **Issue:** No protection against bulk API calls
- **Fix:** Add rate limiting middleware (e.g., using upstash/ratelimit)
- **Effort:** 2-3 hours
- [ ] **Status: Not Started**

### P4-3: Optimize Analytics Query Performance
- **Flow:** Bank
- **Location:** `app/api/bank/analytics/route.ts`
- **Issue:** Fetches ALL historical transactions even for 30-day view
- **Fix:** Add date filter to query
- **Effort:** 30 minutes
- [ ] **Status: Not Started**

### P4-4: Remove Legacy Role Support
- **Flow:** Auth
- **Location:** `lib/roles.ts`
- **Issue:** Still checks for deprecated `Manager` and `Editor` roles
- **Fix:** Remove after confirming no users have these roles
- **Effort:** 1 hour + testing
- [ ] **Status: Not Started**

### P4-5: Add Code Comments for Complex Logic
- **Flows:** Production, Expenses
- **Issue:** Stock movement on first payment only not documented in code
- **Fix:** Add JSDoc comments explaining business logic
- **Effort:** 1-2 hours
- [ ] **Status: Not Started**

### P4-6: Cache Customer/Product Data in Modals
- **Flows:** Sales, Debts
- **Issue:** Fetches customers/products every modal open
- **Fix:** Use React Query or SWR for caching
- **Effort:** 2-3 hours
- [ ] **Status: Not Started**

### P4-7: Add Bulk Operations
- **Flows:** Sales, Production
- **Issue:** Can't approve multiple items at once
- **Fix:** Add bulk action buttons and API endpoints
- **Effort:** 4-6 hours
- [ ] **Status: Not Started**

### P4-8: Add Export/Download Features
- **Flows:** Bank, Sales
- **Issue:** No CSV export or PDF receipts
- **Fix:** Add export buttons with file generation
- **Effort:** 4-6 hours
- [ ] **Status: Not Started**

### P4-9: Implement Credit Sales Flow
- **Flow:** Debts
- **Issue:** Debts can only be created manually, not from sales
- **Fix:** Add "Record as Credit" option in Sales form
- **Effort:** 4-6 hours
- [ ] **Status: Not Started**

### P4-10: Add Database Indexes for Performance
- **Flow:** All
- **Location:** `prisma/schema.prisma`
- **Suggested Indexes:**
  - `@@index([customerId, status])` on Debt (already exists, verify)
  - `@@index([restaurantId, dueDate])` on Debt
- **Effort:** 30 minutes + migration
- [ ] **Status: Not Started**

---

## Missing Features (Not Bugs)

These are gaps between documented requirements and implementation:

| Feature | Flow | Documented In | Status |
|---------|------|---------------|--------|
| Credit sales (debt from sale) | Debts/Sales | CLAUDE.md | Not implemented |
| Sale items don't update inventory | Sales | - | By design |
| Bulk approve for sales | Sales | - | Not implemented |
| CSV export for reconciliation | Bank | - | Not implemented |
| SMS notification for debt collection | Debts | - | Partial |
| Production templates/recipes | Production | Schema exists | Not wired up |
| Quality/waste tracking | Production | - | Not implemented |

---

## Quick Reference: Files to Touch by Phase

### Phase 0
- `.env` (rotate credentials)
- `app/api/inventory/[id]/adjust/route.ts`
- `app/api/stock-movements/route.ts`
- `app/api/expenses/[id]/route.ts`

### Phase 1
- `components/production/ProductionDetail.tsx`
- `components/baking/ProductionLogger.tsx`
- `app/api/debts/[id]/payments/route.ts`
- `lib/auth.ts`
- `app/api/expenses/[id]/route.ts`
- `prisma/schema.prisma`
- `app/api/inventory/[id]/adjust/route.ts`

### Phase 2
- `prisma/schema.prisma` (multiple changes)
- `app/api/sales/[id]/route.ts`
- `app/api/inventory/route.ts`
- `app/api/inventory/transfer/route.ts`
- `components/layout/DashboardHeader.tsx`
- `components/layout/EditorHeader.tsx`

### Phase 3
- Multiple component files (dark mode)
- `public/locales/*.json`
- Various API routes (error messages)
- `app/finances/sales/page.tsx`
- `components/sales/SalesTable.tsx`
- `components/providers/RestaurantProvider.tsx`
- `components/debts/RecordPaymentModal.tsx`

### Phase 4
- `app/api/bank/transactions/route.ts`
- `components/bank/TransactionsTable.tsx`
- `app/api/bank/analytics/route.ts`
- `lib/roles.ts`

---

## Session Resume Prompt

To continue working on these findings, use:

```
Resume the pre-client review work from .claude/summaries/2026-02-04_pre-client-review-findings.md

Current status: [Phase X] in progress
Last completed: [P#-# description]
Next up: [P#-# description]
```

---

*Generated: February 4, 2026*
*Review conducted by: Claude Opus 4.5*
