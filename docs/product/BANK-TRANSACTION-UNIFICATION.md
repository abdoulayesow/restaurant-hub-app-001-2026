# Bank Transaction Management

**Created**: January 29, 2026
**Updated**: January 30, 2026
**Status**: ✅ Complete

## Overview

This document describes the bank transaction workflow - how financial movements are tracked, when bank transactions are created, and how the owner confirms them.

## Business Context

The bakery is managed remotely by the owner in Atlanta, while staff operate in Conakry, Guinea. The owner needs:
- **Visibility**: See all cash movements (deposits and withdrawals)
- **Verification**: Confirm that recorded transactions actually happened
- **Reconciliation**: Match recorded transactions against bank/Orange Money statements

## Core Principle: Transactions Track Money Movement

**Bank transactions are created when money physically moves, NOT when records are created.**

| User Action | Creates Bank Transaction? | Why |
|-------------|--------------------------|-----|
| Record a sale | ❌ No | Sale is just a record of what was sold |
| Record an expense | ❌ No | Expense is just a record of what's owed |
| Record a debt | ❌ No | Debt is just a record of credit given |
| **Deposit sales cash** | ✅ Yes (Deposit) | Cash physically moves to bank/safe |
| **Collect debt payment** | ✅ Yes (Deposit) | Cash physically received from customer |
| **Pay an expense** | ✅ Yes (Withdrawal) | Cash physically paid out |
| **Manual bank entry** | ✅ Yes | Owner records other movements |

## Transaction Sources & Permissions

### Source-Linked Transactions (View Only)

These transactions are created from other pages and linked to their source record:

| Source | Created From | Transaction Type | Editable from Bank? |
|--------|-------------|------------------|---------------------|
| Sales deposit | Sales page → "Deposit to Bank" | Deposit | ❌ View only |
| Debt collection | Debts page → "Record Payment" | Deposit | ❌ View only |
| Expense payment | Expenses page → "Record Payment" | Withdrawal | ❌ View only |

**Why view-only?** These transactions are linked to their source records. To modify them, go to the source page.

### Manual Transactions (Full Control)

The owner can create standalone transactions directly from the Bank page:

| Action | When Allowed |
|--------|--------------|
| Create deposit/withdrawal | Always |
| Edit transaction | Only while status = `Pending` |
| Delete transaction | Only while status = `Pending` |
| Confirm transaction | Only while status = `Pending` |
| View transaction | Always |

Once confirmed, manual transactions become view-only (same as linked transactions).

## Confirmation Workflow

All bank transactions require owner confirmation:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Staff creates  │ ──▶ │    PENDING      │ ──▶ │   CONFIRMED     │
│   transaction   │     │  (Owner review) │     │   (Final)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        Owner opens detail
                        modal with form:
                        - Bank reference
                        - Notes/comments
                        - Confirm button
```

### Who Can Do What

| Action | Staff | Owner/Manager |
|--------|-------|---------------|
| Create sales deposit | ✅ | ✅ |
| Create expense payment | ✅ | ✅ |
| Record debt payment | ✅ | ✅ |
| Create manual bank entry | ❌ | ✅ |
| Edit/delete manual entry | ❌ | ✅ (if Pending) |
| Confirm any transaction | ❌ | ✅ |

## Bank Page Features

### Balance Display
- **Cash**: Physical cash balance
- **Orange Money**: Mobile money balance
- **Card**: Bank card balance
- **Total**: Sum of all methods
- **Pending Deposits**: Awaiting confirmation (not yet in balance)
- **Pending Withdrawals**: Awaiting confirmation (not yet deducted)

### Transaction List
- Shows all transactions (linked + manual)
- Filter by: Type (Deposit/Withdrawal), Status (Pending/Confirmed), Search
- Click any row to open detail modal

### Detail Modal
- Shows transaction details and source info (if linked)
- For pending transactions: confirmation form with bank ref + notes
- For confirmed transactions: view-only display

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/bank/transactions` | GET | List all transactions for restaurant |
| `/api/bank/transactions` | POST | Create manual transaction (Owner only) |
| `/api/bank/transactions/[id]` | GET | Get transaction details |
| `/api/bank/transactions/[id]` | PUT | Update/confirm transaction |
| `/api/bank/transactions/[id]` | DELETE | Delete pending manual transaction |
| `/api/bank/balances` | GET | Get current balances by payment method |
| `/api/cash-deposits` | POST | Create sales deposit (from Sales page) |
| `/api/expenses/[id]/payments` | POST | Record expense payment → creates withdrawal |
| `/api/debts/[id]/payments` | POST | Record debt payment → creates deposit |

## Database Schema

```prisma
model BankTransaction {
  id            String   @id @default(cuid())
  restaurantId  String
  date          DateTime
  amount        Float
  type          TransactionType  // Deposit | Withdrawal
  method        PaymentMethod    // Cash | OrangeMoney | Card
  reason        TransactionReason // SalesDeposit | DebtCollection | ExpensePayment | OwnerWithdrawal | CapitalInjection | Other
  status        TransactionStatus // Pending | Confirmed
  description   String?
  comments      String?
  bankRef       String?
  receiptUrl    String?

  // Links to source records (optional, mutually exclusive)
  saleId        String?  @unique  // For SalesDeposit
  debtPaymentId String?  @unique  // For DebtCollection
  expensePayment ExpensePayment?  // For ExpensePayment (back-reference)

  // Audit fields
  createdBy     String?
  createdByName String?
  confirmedAt   DateTime?
  confirmedBy   String?
}
```

---

# Implementation History

*The sections below document the migration from the old CashDeposit model to the unified BankTransaction model (completed January 2026).*

## Solution: Unify on BankTransaction

### Phase 1: Update Expense Payments ✅ Complete

**File**: `app/api/expenses/[id]/payments/route.ts`

**Change**: Line 223
```typescript
// Before
status: 'Confirmed', // Expense payments are confirmed immediately

// After
status: 'Pending', // Requires Manager confirmation
```

**Impact**: Expense payments will now appear as pending withdrawals on bank page.

### Phase 2: Create Bank Transactions for Debt Payments ✅ Complete

**File**: `app/api/debts/[id]/payments/route.ts`

**Change**: After creating `DebtPayment`, also create `BankTransaction`:
```typescript
// Create bank transaction for the debt payment
const bankTransaction = await prisma.bankTransaction.create({
  data: {
    restaurantId,
    date: paymentDate,
    amount: validatedAmount,
    type: 'Deposit',
    method: paymentMethod, // Cash, OrangeMoney, or Card
    reason: 'DebtCollection',
    description: `Debt payment from ${debt.customer?.name || 'Unknown'}`,
    status: 'Pending',
    debtPaymentId: debtPayment.id,
    createdBy: session.user.id,
    createdByName: user.name,
  }
})
```

**Impact**: Debt payments will appear as pending deposits on bank page.

### Phase 3: Migrate Sales Deposits to BankTransaction ✅ Complete

**File**: `app/api/cash-deposits/route.ts`

**Option A**: Replace `CashDeposit` creation with `BankTransaction`:
```typescript
const bankTransaction = await prisma.bankTransaction.create({
  data: {
    restaurantId: body.restaurantId,
    date: depositDate,
    amount: body.amount,
    type: 'Deposit',
    method: 'Cash',
    reason: 'SalesDeposit',
    status: 'Pending',
    saleId: body.saleId,
    bankRef: body.bankRef,
    receiptUrl: body.receiptUrl,
    comments: body.comments,
    createdBy: session.user.id,
    createdByName: user.name,
  }
})
```

**Option B**: Keep `CashDeposit` and also create `BankTransaction` (for backward compatibility during transition).

**Recommended**: Option A (clean migration)

**Impact**: Sales cash deposits will appear on bank page.

### Phase 4: Deprecate CashDeposit Model ✅ Complete

1. ~~Migrate existing `CashDeposit` records to `BankTransaction`~~ (See `scripts/migrate-bank-data.ts` for SQL)
2. ✅ Updated Sales page to read from `BankTransaction` instead
3. ✅ Removed `CashDeposit` model from schema

### Phase 5: Enhance Bank Page Confirmation UI ✅ Complete

**Implemented**: `TransactionDetailModal` with inline confirmation form

| Transaction Type | Modal to Show |
|-----------------|---------------|
| Sale-linked deposit | Confirmation with sale details, bank ref field |
| Expense-linked withdrawal | Confirmation with expense details |
| Debt-linked deposit | Confirmation with customer/debt details |
| Standalone transaction | Simple confirmation with optional notes |

**New Component**: `components/bank/ConfirmTransactionModal.tsx`
- Detects transaction source (sale, expense, debt, standalone)
- Shows relevant source information
- Collects confirmation details (bank ref, notes)
- Calls `PUT /api/bank/transactions/{id}` with `status: 'Confirmed'`

## Database Schema Notes

### Current BankTransaction Links
```prisma
model BankTransaction {
  // ... other fields

  // Links to source records (optional, mutually exclusive)
  saleId          String?        @unique // For SalesDeposit
  sale            Sale?          @relation(...)
  debtPaymentId   String?        @unique // For DebtCollection
  debtPayment     DebtPayment?   @relation(...)

  // Back-reference from ExpensePayment
  expensePayment  ExpensePayment?
}
```

The schema already supports linking to all sources. No schema changes needed.

### CashDeposit Status Values
- `Pending` - Recorded by staff
- `Deposited` - Confirmed by manager

### BankTransaction Status Values
- `Pending` - Recorded, awaiting confirmation
- `Confirmed` - Verified by manager

## Migration Strategy

### Data Migration (if needed)
```sql
-- Migrate existing CashDeposits to BankTransactions
INSERT INTO BankTransaction (
  id, restaurantId, date, amount, type, method, reason,
  status, saleId, bankRef, receiptUrl, comments, createdAt
)
SELECT
  id, restaurantId, date, amount, 'Deposit', 'Cash', 'SalesDeposit',
  CASE WHEN status = 'Deposited' THEN 'Confirmed' ELSE 'Pending' END,
  saleId, bankRef, receiptUrl, comments, createdAt
FROM CashDeposit;
```

## Implementation Order

1. **Phase 1**: Fix expense payments (change to Pending) - Low risk
2. **Phase 2**: Add bank transactions for debt payments - Medium risk
3. **Phase 3**: Migrate sales deposits to BankTransaction - Higher risk
4. **Phase 5**: Enhanced confirmation UI - After phases 1-3
5. **Phase 4**: Deprecate CashDeposit - Final cleanup

## Testing Checklist

- [x] Expense payment creates Pending withdrawal
- [x] Expense withdrawal appears on bank page
- [x] Manager can confirm expense withdrawal
- [x] Debt payment creates Pending deposit
- [x] Debt deposit appears on bank page
- [x] Manager can confirm debt deposit
- [x] Sales deposit creates BankTransaction (not CashDeposit)
- [x] Sales deposit appears on bank page
- [x] Manager can confirm sales deposit
- [x] Bank balances only count Confirmed transactions
- [x] Pending totals show correct amounts
- [x] All confirmation modals show source information

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `app/api/expenses/[id]/payments/route.ts` | Changed status to 'Pending' | ✅ |
| `app/api/debts/[id]/payments/route.ts` | Added BankTransaction creation | ✅ |
| `app/api/cash-deposits/route.ts` | Replaced CashDeposit with BankTransaction | ✅ |
| `app/api/cash-deposits/[id]/route.ts` | Updated to use BankTransaction with backward compat | ✅ |
| `app/api/sales/route.ts` | Removed CashDeposit includes | ✅ |
| `app/api/sales/[id]/route.ts` | Removed CashDeposit includes | ✅ |
| `app/api/sales/[id]/approve/route.ts` | Removed CashDeposit includes | ✅ |
| `app/finances/sales/page.tsx` | Updated to check BankTransaction instead of CashDeposit | ✅ |
| `components/sales/SalesTable.tsx` | Removed CashDeposit from interface | ✅ |
| `components/bank/DepositFormModal.tsx` | Updated to check bankTransaction for filtering | ✅ |
| `components/bank/TransactionDetailModal.tsx` | Added inline confirmation form | ✅ |
| `prisma/schema.prisma` | Removed CashDeposit model and enum | ✅ |
| `scripts/check-database-integrity.ts` | Removed CashDeposit from checks | ✅ |
| `scripts/migrate-bank-data.ts` | Archived with SQL migration instructions | ✅ |

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | Low | Simple status change, easily reversible |
| 2 | Medium | New functionality, test thoroughly |
| 3 | Higher | Changes existing workflow, need data migration |
| 4 | Low | UI only, no data changes |
| 5 | Medium | Schema change, requires migration script |

## Success Metrics

- ✅ All cash movements visible on bank page
- ✅ Manager can confirm all transaction types from bank page
- ✅ Bank balances accurate (only Confirmed transactions)
- ✅ Staff workflow unchanged (same UI for recording)
- ✅ Remote owner has complete visibility and control

## Implementation Summary

**Completed**: January 29, 2026

### What Was Done

1. **Expense Payments** now create `Pending` BankTransactions (withdrawals) requiring Manager confirmation
2. **Debt Payments** now create `Pending` BankTransactions (deposits) for debt collections
3. **Sales Deposits** use `BankTransaction` directly instead of the deprecated `CashDeposit` model
4. **TransactionDetailModal** includes inline confirmation form with bank reference and notes fields
5. **CashDeposit model removed** from schema; legacy API maintains backward compatibility

### Database Migration Note

The `CashDeposit` table should be dropped in production using raw SQL after verifying all data has been migrated:

```sql
-- See scripts/migrate-bank-data.ts for full migration SQL
DROP TABLE IF EXISTS "CashDeposit";
```

### Backward Compatibility

The `/api/cash-deposits/[id]` endpoint maintains backward compatibility:
- Accepts legacy status values (`Deposited` → `Confirmed`)
- Returns legacy field names for existing integrations
