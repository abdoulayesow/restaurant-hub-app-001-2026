/**
 * Data Migration Script: CashDeposit to BankTransaction (ARCHIVED)
 *
 * This script was used to migrate CashDeposit records to BankTransaction.
 * The CashDeposit model has been removed from the schema.
 *
 * If you need to migrate legacy data, use raw SQL:
 *
 * INSERT INTO "BankTransaction" (
 *   id, "restaurantId", date, amount, type, method, reason,
 *   description, status, "confirmedAt", "bankRef", "receiptUrl",
 *   "saleId", "createdBy", "createdByName", comments, "createdAt", "updatedAt"
 * )
 * SELECT
 *   id, "restaurantId", date, amount, 'Deposit', 'Cash',
 *   CASE WHEN "saleId" IS NOT NULL THEN 'SalesDeposit' ELSE 'Other' END,
 *   comments,
 *   CASE WHEN status = 'Deposited' THEN 'Confirmed' ELSE 'Pending' END,
 *   CASE WHEN status = 'Deposited' THEN "depositedAt" ELSE NULL END,
 *   "bankRef", "receiptUrl", "saleId", "depositedBy", "depositedByName",
 *   comments, "createdAt", "updatedAt"
 * FROM "CashDeposit"
 * ON CONFLICT (id) DO NOTHING;
 *
 * Then drop the CashDeposit table:
 * DROP TABLE IF EXISTS "CashDeposit";
 */

console.log('This migration script is archived.')
console.log('The CashDeposit model has been removed from the schema.')
console.log('See comments in this file for manual SQL migration if needed.')
