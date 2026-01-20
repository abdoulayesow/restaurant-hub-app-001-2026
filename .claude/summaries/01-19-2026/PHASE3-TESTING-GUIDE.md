# Phase 3: Credit Sales & Debt Tracking - Testing Guide

**Date**: January 19, 2026
**Feature**: Credit Sales Integration in Sales Entry
**Status**: Ready for Testing

---

## Overview

Phase 3 enhances the Sales Entry system to support mixed payment types, allowing sales to be recorded with both immediate payments (cash/Orange Money/card) and credit sales that create debt records for customers.

### Key Features Implemented

1. **Mixed Payment Sales Entry**
   - Support for immediate payments (cash, Orange Money, card)
   - Support for multiple credit sales per sale entry
   - Real-time total calculation including both payment types

2. **Credit Limit Validation**
   - Frontend validation against customer credit limits
   - Backend validation with detailed error messages
   - Display of available credit per customer

3. **Payment Status Display**
   - New "Payment Status" column in sales table
   - Visual indicators for "Fully Paid" vs "Has Debts"
   - Outstanding debt amount display

4. **Debt Tracking Integration**
   - Automatic debt record creation on sale submission
   - Link between sales and debts
   - Status tracking (Outstanding, PartiallyPaid, FullyPaid, Overdue)

---

## Prerequisites

### Database Setup
Ensure you have:
- At least 2-3 customers created in the system
- At least one customer with a defined credit limit (e.g., 5,000,000 GNF)
- Active restaurant selected

### User Role
- You must be logged in as Manager or Editor
- Managers have full access
- Editors can create sales but cannot modify existing debts

---

## Test Scenarios

### Scenario 1: Cash-Only Sale (Baseline Test)

**Objective**: Verify existing functionality still works

**Steps**:
1. Navigate to [Sales Page](http://localhost:5000/finances/sales)
2. Click "New Sale" button
3. Fill in:
   - Date: Today
   - Cash: 1,000,000 GNF
   - Leave Orange Money and Card at 0
   - Do NOT add any credit sales
4. Click "Save Sale"

**Expected Results**:
- ✅ Sale created successfully
- ✅ Total displayed as 1,000,000 GNF
- ✅ Sale appears in table with "Fully Paid" badge in Payment Status column
- ✅ No debts created

---

### Scenario 2: Mixed Payment Sale (Cash + Credit)

**Objective**: Test basic credit sales functionality

**Steps**:
1. Click "New Sale"
2. Fill in:
   - Date: Today
   - Cash: 500,000 GNF
   - Click "Add Credit Sale" button
3. In Credit Item 1:
   - Customer: Select any customer
   - Amount: 300,000 GNF
   - Due Date: 7 days from today (optional)
   - Description: "Baguette order" (optional)
4. Click "Save Sale"

**Expected Results**:
- ✅ Immediate Payment section shows: 500,000 GNF
- ✅ Credit Total section shows: 300,000 GNF
- ✅ Grand Total shows: 800,000 GNF
- ✅ Sale created successfully
- ✅ Sale appears with "Has Debts (1)" badge
- ✅ Outstanding amount shows: 300,000 GNF
- ✅ Debt record created and visible in Receivables page

---

### Scenario 3: Multiple Credit Sales

**Objective**: Test multiple debt items in a single sale

**Steps**:
1. Click "New Sale"
2. Fill in:
   - Date: Tomorrow
   - Cash: 200,000 GNF
   - Orange Money: 150,000 GNF
   - Card: 100,000 GNF
3. Add Credit Item 1:
   - Customer: Customer A
   - Amount: 250,000 GNF
4. Click "Add Another Credit Sale"
5. Add Credit Item 2:
   - Customer: Customer B
   - Amount: 300,000 GNF
6. Click "Save Sale"

**Expected Results**:
- ✅ Immediate Payment: 450,000 GNF
- ✅ Credit Total: 550,000 GNF
- ✅ Grand Total: 1,000,000 GNF
- ✅ Sale created with 2 debt records
- ✅ Payment Status shows: "Has Debts (2)"
- ✅ Outstanding amount: 550,000 GNF
- ✅ Both debts appear in Receivables page

---

### Scenario 4: Credit Limit Validation (Frontend)

**Objective**: Test credit limit enforcement

**Prerequisites**:
- Customer with credit limit of 5,000,000 GNF
- Customer has existing outstanding debt of 3,000,000 GNF (create if needed)

**Steps**:
1. Click "New Sale"
2. Add Credit Item:
   - Customer: Select customer with 5,000,000 GNF limit
   - Amount: 2,500,000 GNF (exceeds available 2,000,000 GNF)
3. Try to submit

**Expected Results**:
- ✅ Error message appears: "Exceeds credit limit (2,000,000 GNF available)"
- ✅ Error displays in red below the amount field
- ✅ Form does not submit
- ✅ Available credit shown below customer dropdown

**Fix**:
- Change amount to 2,000,000 GNF or less
- Form should now submit successfully

---

### Scenario 5: Credit Limit Validation (Backend)

**Objective**: Test backend validation as safety net

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "New Sale"
4. Add Credit Item with customer and amount that exceeds limit
5. Click "Save Sale"
6. Check the response in Network tab

**Expected Results**:
- ✅ 400 Bad Request status
- ✅ Response body contains error message with details:
  - Customer name
  - Credit limit
  - Current outstanding amount
  - New total that would exceed limit

---

### Scenario 6: Required Field Validation

**Objective**: Test form validation

**Steps**:
1. Click "New Sale"
2. Add Credit Item but leave customer empty
3. Try to submit

**Expected Results**:
- ✅ Error: "Customer required"

**Steps**:
1. Select customer but leave amount at 0
2. Try to submit

**Expected Results**:
- ✅ Error: "Amount must be positive"

**Steps**:
1. Remove all credit items
2. Leave all payment fields at 0
3. Try to submit

**Expected Results**:
- ✅ Error: "Total must be greater than 0"

---

### Scenario 7: Credit-Only Sale

**Objective**: Test sale with no immediate payment

**Steps**:
1. Click "New Sale"
2. Leave Cash, Orange Money, Card all at 0
3. Add Credit Item:
   - Customer: Any customer
   - Amount: 750,000 GNF
4. Click "Save Sale"

**Expected Results**:
- ✅ Immediate Payment: 0 GNF
- ✅ Credit Total: 750,000 GNF
- ✅ Grand Total: 750,000 GNF
- ✅ Sale created successfully
- ✅ Payment Status: "Has Debts (1)"
- ✅ Outstanding: 750,000 GNF

---

### Scenario 8: Visual Display in Sales Table

**Objective**: Verify payment status column displays correctly

**Steps**:
1. View the Sales table after creating various sales

**Expected Results for Fully Paid Sales**:
- ✅ Green badge with text "Fully Paid"
- ✅ No debt count or amount shown

**Expected Results for Sales with Debts**:
- ✅ Amber/yellow badge with text "Has Debts (N)" where N is count
- ✅ Outstanding amount displayed below badge
- ✅ Amount formatted as "XXX,XXX GNF"

---

### Scenario 9: Remove Credit Item

**Objective**: Test removing credit items from form

**Steps**:
1. Click "New Sale"
2. Add 2 credit items
3. Click trash icon on first credit item
4. Verify item is removed
5. Add cash payment and submit

**Expected Results**:
- ✅ First credit item removed
- ✅ Second credit item remains
- ✅ Sale creates only 1 debt record
- ✅ Totals recalculate correctly

---

### Scenario 10: Edit Mode (Future Enhancement)

**Status**: Edit mode for debts is not yet implemented

**Current Behavior**:
- Editing a sale does NOT allow modifying credit items
- Edit functionality is limited to immediate payment amounts

**Future Work**:
- Phase 4 will add debt management in edit mode
- For now, debts must be managed via Receivables page

---

## API Endpoints Involved

### POST /api/sales
Creates sale with optional debts array

**Request Body**:
```json
{
  "restaurantId": "string",
  "date": "2026-01-19",
  "cashGNF": 500000,
  "orangeMoneyGNF": 0,
  "cardGNF": 0,
  "debts": [
    {
      "customerId": "customer-id",
      "amountGNF": 300000,
      "dueDate": "2026-01-26",
      "description": "Baguette order"
    }
  ]
}
```

**Success Response**: 201 Created
```json
{
  "sale": {
    "id": "sale-id",
    "totalGNF": 800000,
    "debts": [ /* debt records */ ]
  }
}
```

**Error Responses**:
- 400: Validation errors (missing fields, credit limit exceeded)
- 403: Forbidden (no access to restaurant)
- 409: Conflict (sale already exists for date)

### GET /api/sales?restaurantId=X
Fetches sales with debt information

**Response**:
```json
{
  "sales": [
    {
      "id": "sale-id",
      "totalGNF": 800000,
      "activeDebtsCount": 1,
      "outstandingDebtAmount": 300000,
      "debts": [ /* active debt records */ ]
    }
  ]
}
```

### GET /api/customers?restaurantId=X&includeActive=true
Fetches customers with outstanding debt amounts

**Response**:
```json
{
  "customers": [
    {
      "id": "customer-id",
      "name": "Customer Name",
      "creditLimit": 5000000,
      "outstandingDebt": 3000000
    }
  ]
}
```

---

## Known Issues & Limitations

### Current Limitations

1. **Edit Mode Not Fully Implemented**
   - Cannot edit credit items in existing sales
   - Workaround: Manage debts via Receivables page

2. **No Bulk Credit Sales Import**
   - Each credit sale must be added manually
   - Future enhancement for CSV import

3. **Payment Status Not Sortable**
   - Payment Status column doesn't support sorting
   - Future enhancement to add sort functionality

### Edge Cases to Consider

1. **Customer Deleted After Debt Created**
   - System prevents deletion if debts exist
   - Must resolve/write-off debts first

2. **Credit Limit Changed After Debt Created**
   - Existing debts remain valid
   - New credit sales subject to new limit

3. **Multiple Users Creating Sales Simultaneously**
   - Race condition possible with credit limit checks
   - Database transaction ensures debt creation is atomic

---

## Troubleshooting

### Issue: "Credit limit exceeded" error but customer has no debts

**Cause**: Outstanding debt calculation might include written-off debts

**Solution**: Check Receivables page for all debts for this customer, including written-off ones

### Issue: Payment Status column shows "Fully Paid" but debts exist

**Cause**: Debts might be in "WrittenOff" or "FullyPaid" status

**Solution**: Only Outstanding, PartiallyPaid, and Overdue debts count as "active"

### Issue: Total doesn't match expected value

**Cause**: JavaScript floating-point precision issues

**Solution**: All amounts are stored as integers (no decimals) in database

### Issue: Sale created but debts missing

**Cause**: Transaction might have failed partway through

**Solution**:
1. Check browser console for errors
2. Check server logs for transaction failures
3. Verify database transaction completed

---

## Database Verification

### Check if sale was created:
```sql
SELECT * FROM "Sale"
WHERE "restaurantId" = 'your-restaurant-id'
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Check if debts were created:
```sql
SELECT d.*, c.name as customer_name
FROM "Debt" d
JOIN "Customer" c ON d."customerId" = c.id
WHERE d."saleId" = 'your-sale-id';
```

### Check customer outstanding debt:
```sql
SELECT
  c.name,
  c."creditLimit",
  SUM(d."remainingAmount") as outstanding_debt
FROM "Customer" c
LEFT JOIN "Debt" d ON c.id = d."customerId"
WHERE d.status IN ('Outstanding', 'PartiallyPaid', 'Overdue')
  AND c.id = 'your-customer-id'
GROUP BY c.id, c.name, c."creditLimit";
```

---

## Performance Considerations

### Indexing
Ensure these indexes exist:
- `Debt.customerId` - for customer lookup
- `Debt.saleId` - for sale lookup
- `Debt.status` - for filtering active debts
- `Sale.restaurantId_date` - unique constraint and query optimization

### Query Optimization
- Sales list query includes debt aggregation
- Consider pagination for large datasets (100+ sales)
- Credit limit check queries optimized with status filter

---

## Next Steps After Testing

1. **Create Test Customers**
   - Add 5-10 test customers with varied credit limits
   - Create some with existing debts

2. **Create Test Sales**
   - Create sales with various payment mix scenarios
   - Test edge cases (credit-only, mixed, fully-paid)

3. **Verify Receivables Page**
   - Navigate to Receivables page
   - Verify all debts appear correctly
   - Test debt payment recording (if implemented)

4. **Phase 4 Planning**
   - Receivables management page enhancements
   - Payment recording UI
   - Debt status transitions
   - Reporting and analytics

---

## Success Criteria

Phase 3 is considered successful when:

- ✅ Sales can be created with mixed payment types
- ✅ Multiple credit sales can be added to a single sale entry
- ✅ Credit limits are validated on frontend and backend
- ✅ Payment Status column displays correctly
- ✅ Outstanding debt amounts are accurate
- ✅ Debts are created and linked to sales
- ✅ No regression in existing functionality
- ✅ All test scenarios pass

---

## Support & Resources

- **Session Summary**: `.claude/summaries/01-19-2026/20260119-credit-sales-debt-tracking-phase3.md`
- **Product Spec**: `docs/product/PRODUCT-VISION.md`
- **Technical Spec**: `docs/product/TECHNICAL-SPEC.md`
- **Database Schema**: `prisma/schema.prisma`

---

**Testing Date**: _____________
**Tested By**: _____________
**Results**: _____________
