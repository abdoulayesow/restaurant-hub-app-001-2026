/**
 * Production Test Restaurant Cleanup Script
 *
 * Removes the test restaurant "Bliss test" and ALL related data from PRODUCTION.
 * This includes: customers, sales, expenses, production logs, debts, bank transactions,
 * stock movements, products, inventory items, and user-restaurant assignments.
 *
 * Usage: npx ts-node scripts/cleanup-prod-test.ts
 *
 * WARNING: This script PERMANENTLY DELETES data from PRODUCTION database!
 */

import { PrismaClient } from '@prisma/client'

// PRODUCTION DATABASE CONNECTION
const PROD_DATABASE_URL = 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_DATABASE_URL }
  }
})

// Constants
const RESTAURANT_ID = 'bliss-test'
const RESTAURANT_NAME = 'Bliss test'

// ============================================================================
// CLEANUP FUNCTION
// ============================================================================
async function cleanupTestRestaurant() {
  console.log('='.repeat(60))
  console.log('Bakery Hub - PRODUCTION Test Restaurant Cleanup')
  console.log('='.repeat(60))
  console.log(`Target: ${RESTAURANT_NAME} (${RESTAURANT_ID})`)
  console.log(`Database: PRODUCTION (Neon)`)
  console.log('='.repeat(60))
  console.log('')

  // Check if restaurant exists
  console.log('Phase 1: Checking if test restaurant exists...')
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: RESTAURANT_ID }
  })

  if (!restaurant) {
    console.log(`  Restaurant '${RESTAURANT_NAME}' does not exist.`)
    console.log('  Nothing to clean up.')
    return
  }
  console.log(`  Found restaurant: ${restaurant.name}`)
  console.log('')

  // Delete in correct order to respect FK constraints
  console.log('Phase 2: Deleting related data...')
  console.log('  (Deleting in reverse dependency order)')
  console.log('')

  // 1. Bank transactions (linked to sales, debtPayments, expensePayments)
  const bankTxCount = await prisma.bankTransaction.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [1/14] Deleted ${bankTxCount.count} bank transactions`)

  // 2. Debt payments (linked to debts, customers, bank transactions)
  const debtPaymentCount = await prisma.debtPayment.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [2/14] Deleted ${debtPaymentCount.count} debt payments`)

  // 3. Debts (linked to customers)
  const debtCount = await prisma.debt.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [3/14] Deleted ${debtCount.count} debts`)

  // 4. Sale items (linked to sales)
  const saleItemCount = await prisma.saleItem.deleteMany({
    where: { sale: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  [4/14] Deleted ${saleItemCount.count} sale items`)

  // 5. Sales
  const saleCount = await prisma.sale.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [5/14] Deleted ${saleCount.count} sales`)

  // 6. Expense payments (linked to expenses)
  const expPaymentCount = await prisma.expensePayment.deleteMany({
    where: { expense: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  [6/14] Deleted ${expPaymentCount.count} expense payments`)

  // 7. Expense items (linked to expenses, inventory)
  const expItemCount = await prisma.expenseItem.deleteMany({
    where: { expense: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  [7/14] Deleted ${expItemCount.count} expense items`)

  // 8. Stock movements (linked to expenses, production logs)
  const stockMovCount = await prisma.stockMovement.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [8/14] Deleted ${stockMovCount.count} stock movements`)

  // 9. Expenses
  const expenseCount = await prisma.expense.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [9/14] Deleted ${expenseCount.count} expenses`)

  // 10. Production items (linked to production logs)
  const prodItemCount = await prisma.productionItem.deleteMany({
    where: { productionLog: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  [10/14] Deleted ${prodItemCount.count} production items`)

  // 11. Production logs
  const prodLogCount = await prisma.productionLog.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [11/14] Deleted ${prodLogCount.count} production logs`)

  // 12. Customers
  const customerCount = await prisma.customer.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [12/14] Deleted ${customerCount.count} customers`)

  // 13. Daily summaries
  const summaryCount = await prisma.dailySummary.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [13/14] Deleted ${summaryCount.count} daily summaries`)

  // 14. Products
  const productCount = await prisma.product.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  [14/14] Deleted ${productCount.count} products`)

  console.log('')
  console.log('Phase 3: Deleting inventory items...')
  const inventoryCount = await prisma.inventoryItem.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${inventoryCount.count} inventory items`)

  console.log('')
  console.log('Phase 4: Removing user-restaurant assignments...')
  const userRestCount = await prisma.userRestaurant.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${userRestCount.count} user-restaurant assignments`)

  console.log('')
  console.log('Phase 5: Deleting the restaurant...')
  await prisma.restaurant.delete({
    where: { id: RESTAURANT_ID }
  })
  console.log(`  Deleted restaurant: ${RESTAURANT_NAME}`)

  console.log('')
  console.log('='.repeat(60))
  console.log('CLEANUP COMPLETED SUCCESSFULLY')
  console.log('='.repeat(60))
  console.log('')
  console.log('Summary of deleted records:')
  console.log(`  Bank Transactions: ${bankTxCount.count}`)
  console.log(`  Debt Payments: ${debtPaymentCount.count}`)
  console.log(`  Debts: ${debtCount.count}`)
  console.log(`  Sale Items: ${saleItemCount.count}`)
  console.log(`  Sales: ${saleCount.count}`)
  console.log(`  Expense Payments: ${expPaymentCount.count}`)
  console.log(`  Expense Items: ${expItemCount.count}`)
  console.log(`  Stock Movements: ${stockMovCount.count}`)
  console.log(`  Expenses: ${expenseCount.count}`)
  console.log(`  Production Items: ${prodItemCount.count}`)
  console.log(`  Production Logs: ${prodLogCount.count}`)
  console.log(`  Customers: ${customerCount.count}`)
  console.log(`  Daily Summaries: ${summaryCount.count}`)
  console.log(`  Products: ${productCount.count}`)
  console.log(`  Inventory Items: ${inventoryCount.count}`)
  console.log(`  User-Restaurant: ${userRestCount.count}`)
  console.log(`  Restaurant: 1`)
  console.log('')
  console.log('The test restaurant has been completely removed from production.')
  console.log('='.repeat(60))
}

// ============================================================================
// MAIN
// ============================================================================
cleanupTestRestaurant()
  .catch((e) => {
    console.error('Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
