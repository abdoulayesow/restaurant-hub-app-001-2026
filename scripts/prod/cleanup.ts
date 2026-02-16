/**
 * Production Database Cleanup Script
 *
 * KEEPS:
 * - Restaurants (resets initialCashBalance to 0)
 * - Users & UserRestaurant mappings
 * - Inventory Items (resets currentStock to 0)
 * - Suppliers
 *
 * CLEARS:
 * - Products
 * - Customers
 * - Sales & Sale Items
 * - Expenses & Expense Payments
 * - Production Logs & Production Items
 * - Stock Movements
 * - Debts & Debt Payments
 * - Bank Transactions
 * - Daily Summaries
 */

import { PrismaClient } from '@prisma/client'

const PROD_DATABASE_URL = 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_DATABASE_URL }
  }
})

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  console.log('='.repeat(60))
  console.log('Production Database Cleanup')
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made')
    console.log('   Run with --execute to apply changes\n')
  } else {
    console.log('\n🚨 EXECUTE MODE - Changes will be applied!\n')
  }

  // Show what will be affected
  console.log('📊 Current data counts:')

  const counts = {
    bankTransactions: await prisma.bankTransaction.count(),
    debtPayments: await prisma.debtPayment.count(),
    debts: await prisma.debt.count(),
    saleItems: await prisma.saleItem.count(),
    sales: await prisma.sale.count(),
    expensePayments: await prisma.expensePayment.count(),
    expenses: await prisma.expense.count(),
    productionItems: await prisma.productionItem.count(),
    productionLogs: await prisma.productionLog.count(),
    stockMovements: await prisma.stockMovement.count(),
    customers: await prisma.customer.count(),
    products: await prisma.product.count(),
    dailySummaries: await prisma.dailySummary.count(),
    inventoryItems: await prisma.inventoryItem.count(),
    restaurants: await prisma.restaurant.count(),
  }

  console.log(`  Bank Transactions: ${counts.bankTransactions}`)
  console.log(`  Debt Payments: ${counts.debtPayments}`)
  console.log(`  Debts: ${counts.debts}`)
  console.log(`  Sale Items: ${counts.saleItems}`)
  console.log(`  Sales: ${counts.sales}`)
  console.log(`  Expense Payments: ${counts.expensePayments}`)
  console.log(`  Expenses: ${counts.expenses}`)
  console.log(`  Production Items: ${counts.productionItems}`)
  console.log(`  Production Logs: ${counts.productionLogs}`)
  console.log(`  Stock Movements: ${counts.stockMovements}`)
  console.log(`  Customers: ${counts.customers}`)
  console.log(`  Products: ${counts.products}`)
  console.log(`  Daily Summaries: ${counts.dailySummaries}`)
  console.log(`  Inventory Items: ${counts.inventoryItems} (will reset stock to 0)`)
  console.log(`  Restaurants: ${counts.restaurants} (will reset cash balance to 0)`)

  if (dryRun) {
    console.log('\n✅ Dry run complete. Run with --execute to apply changes.')
    return
  }

  // Execute cleanup in correct order (respecting FK constraints)
  console.log('\n🗑️  Deleting transactional data...')

  // 1. Delete bank transactions first (no dependencies)
  const deletedBankTx = await prisma.bankTransaction.deleteMany({})
  console.log(`  ✓ Deleted ${deletedBankTx.count} bank transactions`)

  // 2. Delete debt payments
  const deletedDebtPayments = await prisma.debtPayment.deleteMany({})
  console.log(`  ✓ Deleted ${deletedDebtPayments.count} debt payments`)

  // 3. Delete debts
  const deletedDebts = await prisma.debt.deleteMany({})
  console.log(`  ✓ Deleted ${deletedDebts.count} debts`)

  // 4. Delete sale items
  const deletedSaleItems = await prisma.saleItem.deleteMany({})
  console.log(`  ✓ Deleted ${deletedSaleItems.count} sale items`)

  // 5. Delete sales
  const deletedSales = await prisma.sale.deleteMany({})
  console.log(`  ✓ Deleted ${deletedSales.count} sales`)

  // 6. Delete expense payments
  const deletedExpensePayments = await prisma.expensePayment.deleteMany({})
  console.log(`  ✓ Deleted ${deletedExpensePayments.count} expense payments`)

  // 7. Delete expenses
  const deletedExpenses = await prisma.expense.deleteMany({})
  console.log(`  ✓ Deleted ${deletedExpenses.count} expenses`)

  // 8. Delete production items
  const deletedProductionItems = await prisma.productionItem.deleteMany({})
  console.log(`  ✓ Deleted ${deletedProductionItems.count} production items`)

  // 9. Delete production logs
  const deletedProductionLogs = await prisma.productionLog.deleteMany({})
  console.log(`  ✓ Deleted ${deletedProductionLogs.count} production logs`)

  // 10. Delete stock movements
  const deletedStockMovements = await prisma.stockMovement.deleteMany({})
  console.log(`  ✓ Deleted ${deletedStockMovements.count} stock movements`)

  // 11. Delete customers
  const deletedCustomers = await prisma.customer.deleteMany({})
  console.log(`  ✓ Deleted ${deletedCustomers.count} customers`)

  // 12. Delete products
  const deletedProducts = await prisma.product.deleteMany({})
  console.log(`  ✓ Deleted ${deletedProducts.count} products`)

  // 13. Delete daily summaries
  const deletedDailySummaries = await prisma.dailySummary.deleteMany({})
  console.log(`  ✓ Deleted ${deletedDailySummaries.count} daily summaries`)

  // Reset inventory stock to 0
  console.log('\n📦 Resetting inventory stock levels...')
  const resetInventory = await prisma.inventoryItem.updateMany({
    data: { currentStock: 0 }
  })
  console.log(`  ✓ Reset ${resetInventory.count} inventory items to 0 stock`)

  // Reset restaurant cash balances to 0
  console.log('\n💰 Resetting restaurant cash balances...')
  const resetRestaurants = await prisma.restaurant.updateMany({
    data: {
      initialCashBalance: 0,
      initialOrangeBalance: 0,
      initialCardBalance: 0
    }
  })
  console.log(`  ✓ Reset ${resetRestaurants.count} restaurants to 0 balance`)

  // Final verification
  console.log('\n📊 Final data counts:')
  const finalCounts = {
    bankTransactions: await prisma.bankTransaction.count(),
    debts: await prisma.debt.count(),
    sales: await prisma.sale.count(),
    expenses: await prisma.expense.count(),
    productionLogs: await prisma.productionLog.count(),
    stockMovements: await prisma.stockMovement.count(),
    customers: await prisma.customer.count(),
    products: await prisma.product.count(),
    inventoryItems: await prisma.inventoryItem.count(),
    restaurants: await prisma.restaurant.count(),
    users: await prisma.user.count(),
    userRestaurants: await prisma.userRestaurant.count(),
    suppliers: await prisma.supplier.count(),
  }

  console.log('  CLEARED:')
  console.log(`    Bank Transactions: ${finalCounts.bankTransactions}`)
  console.log(`    Debts: ${finalCounts.debts}`)
  console.log(`    Sales: ${finalCounts.sales}`)
  console.log(`    Expenses: ${finalCounts.expenses}`)
  console.log(`    Production Logs: ${finalCounts.productionLogs}`)
  console.log(`    Stock Movements: ${finalCounts.stockMovements}`)
  console.log(`    Customers: ${finalCounts.customers}`)
  console.log(`    Products: ${finalCounts.products}`)

  console.log('\n  PRESERVED:')
  console.log(`    Restaurants: ${finalCounts.restaurants}`)
  console.log(`    Users: ${finalCounts.users}`)
  console.log(`    User-Restaurant mappings: ${finalCounts.userRestaurants}`)
  console.log(`    Inventory Items: ${finalCounts.inventoryItems} (stock reset to 0)`)
  console.log(`    Suppliers: ${finalCounts.suppliers}`)

  console.log('\n' + '='.repeat(60))
  console.log('✅ Production cleanup complete!')
  console.log('='.repeat(60))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
