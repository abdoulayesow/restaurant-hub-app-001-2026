/**
 * Production Per-Restaurant Cleanup Script
 *
 * Removes all transactional/financial data for a specific restaurant.
 * Dry-run by default (no changes made).
 *
 * KEEPS:
 * - Restaurant (settings, balances)
 * - Users & UserRestaurant mappings
 * - Products
 * - Inventory Items (stock levels preserved)
 * - Suppliers, Categories, Expense Groups
 * - Payment Methods
 *
 * CLEARS:
 * - Sales & Sale Items
 * - Expenses, Expense Payments, Expense Items
 * - Production Logs & Production Items
 * - Stock Movements
 * - Debts & Debt Payments
 * - Bank Transactions
 * - Customers
 * - Daily Summaries
 * - Stock Reconciliations & Reconciliation Items
 * - Inventory Transfers
 * - Notification Logs
 *
 * Usage:
 *   npx tsx scripts/prod/cleanup-restaurant.ts bliss-miniere              # dry run
 *   npx tsx scripts/prod/cleanup-restaurant.ts bliss-miniere --execute    # actually delete
 */

import { PrismaClient } from '@prisma/client'

const PROD_DATABASE_URL = 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_DATABASE_URL }
  }
})

const args = process.argv.slice(2)
const restaurantId = args.find(a => !a.startsWith('--'))
const dryRun = !args.includes('--execute')

async function getTransactionCounts(restaurantId: string) {
  const [
    sales, saleItems, expenses, expensePayments, expenseItems,
    productionLogs, productionItems, stockMovements,
    debts, debtPayments, bankTransactions, customers,
    dailySummaries, stockReconciliations, reconciliationItems,
    inventoryTransfers, notificationLogs
  ] = await Promise.all([
    prisma.sale.count({ where: { restaurantId } }),
    prisma.saleItem.count({ where: { sale: { restaurantId } } }),
    prisma.expense.count({ where: { restaurantId } }),
    prisma.expensePayment.count({ where: { expense: { restaurantId } } }),
    prisma.expenseItem.count({ where: { expense: { restaurantId } } }),
    prisma.productionLog.count({ where: { restaurantId } }),
    prisma.productionItem.count({ where: { productionLog: { restaurantId } } }),
    prisma.stockMovement.count({ where: { restaurantId } }),
    prisma.debt.count({ where: { restaurantId } }),
    prisma.debtPayment.count({ where: { restaurantId } }),
    prisma.bankTransaction.count({ where: { restaurantId } }),
    prisma.customer.count({ where: { restaurantId } }),
    prisma.dailySummary.count({ where: { restaurantId } }),
    prisma.stockReconciliation.count({ where: { restaurantId } }),
    prisma.reconciliationItem.count({ where: { reconciliation: { restaurantId } } }),
    prisma.inventoryTransfer.count({ where: { OR: [{ sourceRestaurantId: restaurantId }, { targetRestaurantId: restaurantId }] } }),
    prisma.notificationLog.count({ where: { restaurantId } }),
  ])

  return {
    reconciliationItems, stockReconciliations, notificationLogs, inventoryTransfers,
    expensePayments, bankTransactions, debtPayments, debts,
    saleItems, sales, expenseItems, stockMovements, expenses,
    productionItems, productionLogs, customers, dailySummaries,
  }
}

function printCounts(counts: Record<string, number>, label: string) {
  console.log(`\n${label}`)
  console.log('-'.repeat(50))

  const labels: Record<string, string> = {
    reconciliationItems: 'Reconciliation Items',
    stockReconciliations: 'Stock Reconciliations',
    notificationLogs: 'Notification Logs',
    inventoryTransfers: 'Inventory Transfers',
    expensePayments: 'Expense Payments',
    bankTransactions: 'Bank Transactions',
    debtPayments: 'Debt Payments',
    debts: 'Debts',
    saleItems: 'Sale Items',
    sales: 'Sales',
    expenseItems: 'Expense Items',
    stockMovements: 'Stock Movements',
    expenses: 'Expenses',
    productionItems: 'Production Items',
    productionLogs: 'Production Logs',
    customers: 'Customers',
    dailySummaries: 'Daily Summaries',
  }

  for (const [key, count] of Object.entries(counts)) {
    const marker = count > 0 ? '!!' : 'ok'
    console.log(`  [${marker}] ${labels[key] || key}: ${count}`)
  }
}

async function cleanupRestaurant(restaurantId: string, dryRun: boolean) {
  console.log('='.repeat(60))
  console.log('Production Per-Restaurant Cleanup')
  console.log('='.repeat(60))
  console.log(`Target: ${restaurantId}`)

  if (dryRun) {
    console.log('\n  DRY RUN MODE - No changes will be made')
    console.log('  Run with --execute to apply changes\n')
  } else {
    console.log('\n  EXECUTE MODE - Changes will be applied!\n')
  }

  // Phase 1: Verify restaurant exists
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, location: true }
  })

  if (!restaurant) {
    console.log(`Restaurant '${restaurantId}' not found. Aborting.`)
    return
  }

  console.log(`Restaurant: ${restaurant.name} (${restaurant.location || 'N/A'})`)

  // Phase 2: Show current counts
  const beforeCounts = await getTransactionCounts(restaurantId)
  printCounts(beforeCounts, 'Current data counts')

  const totalRecords = Object.values(beforeCounts).reduce((sum, c) => sum + c, 0)
  if (totalRecords === 0) {
    console.log('\nNo transactional data found. Nothing to clean up.')
    console.log('='.repeat(60))
    return
  }

  // Phase 3: Dry-run gate
  if (dryRun) {
    console.log(`\nTotal records to delete: ${totalRecords}`)
    console.log('\nDry run complete. Run with --execute to apply changes.')
    console.log('='.repeat(60))
    return
  }

  // Phase 4: Delete in FK-safe order
  console.log('\nDeleting transactional data...')

  // Step 1: ReconciliationItems (FK -> StockReconciliation)
  const d1 = await prisma.reconciliationItem.deleteMany({
    where: { reconciliation: { restaurantId } }
  })
  console.log(`  [ 1/17] Deleted ${d1.count} reconciliation items`)

  // Step 2: StockReconciliations (FK -> Restaurant)
  const d2 = await prisma.stockReconciliation.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [ 2/17] Deleted ${d2.count} stock reconciliations`)

  // Step 3: NotificationLogs (FK -> Restaurant)
  const d3 = await prisma.notificationLog.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [ 3/17] Deleted ${d3.count} notification logs`)

  // Step 4: InventoryTransfers (FK -> Restaurant x2)
  const d4 = await prisma.inventoryTransfer.deleteMany({
    where: { OR: [{ sourceRestaurantId: restaurantId }, { targetRestaurantId: restaurantId }] }
  })
  console.log(`  [ 4/17] Deleted ${d4.count} inventory transfers`)

  // Step 5: ExpensePayments (FK -> BankTransaction, Expense) - must come before BankTransactions
  const d5 = await prisma.expensePayment.deleteMany({
    where: { expense: { restaurantId } }
  })
  console.log(`  [ 5/17] Deleted ${d5.count} expense payments`)

  // Step 6: BankTransactions (FK -> DebtPayment, Sale) - must come before DebtPayments and Sales
  const d6 = await prisma.bankTransaction.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [ 6/17] Deleted ${d6.count} bank transactions`)

  // Step 7: DebtPayments (FK -> Debt, Customer)
  const d7 = await prisma.debtPayment.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [ 7/17] Deleted ${d7.count} debt payments`)

  // Step 8: Debts (FK -> Customer, Sale)
  const d8 = await prisma.debt.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [ 8/17] Deleted ${d8.count} debts`)

  // Step 9: SaleItems (FK -> Sale)
  const d9 = await prisma.saleItem.deleteMany({
    where: { sale: { restaurantId } }
  })
  console.log(`  [ 9/17] Deleted ${d9.count} sale items`)

  // Step 10: Sales
  const d10 = await prisma.sale.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [10/17] Deleted ${d10.count} sales`)

  // Step 11: ExpenseItems (FK -> Expense)
  const d11 = await prisma.expenseItem.deleteMany({
    where: { expense: { restaurantId } }
  })
  console.log(`  [11/17] Deleted ${d11.count} expense items`)

  // Step 12: StockMovements (FK -> Expense, ProductionLog)
  const d12 = await prisma.stockMovement.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [12/17] Deleted ${d12.count} stock movements`)

  // Step 13: Expenses
  const d13 = await prisma.expense.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [13/17] Deleted ${d13.count} expenses`)

  // Step 14: ProductionItems (FK -> ProductionLog)
  const d14 = await prisma.productionItem.deleteMany({
    where: { productionLog: { restaurantId } }
  })
  console.log(`  [14/17] Deleted ${d14.count} production items`)

  // Step 15: ProductionLogs
  const d15 = await prisma.productionLog.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [15/17] Deleted ${d15.count} production logs`)

  // Step 16: Customers
  const d16 = await prisma.customer.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [16/17] Deleted ${d16.count} customers`)

  // Step 17: DailySummaries
  const d17 = await prisma.dailySummary.deleteMany({
    where: { restaurantId }
  })
  console.log(`  [17/17] Deleted ${d17.count} daily summaries`)

  // Phase 5: Verify cleanup
  const afterCounts = await getTransactionCounts(restaurantId)
  printCounts(afterCounts, 'Final data counts (should all be 0)')

  // Phase 6: Show preserved data
  const [products, inventoryItems, userRestaurants] = await Promise.all([
    prisma.product.count({ where: { restaurantId } }),
    prisma.inventoryItem.count({ where: { restaurantId } }),
    prisma.userRestaurant.count({ where: { restaurantId } }),
  ])

  console.log('\nPreserved data:')
  console.log(`  Products: ${products}`)
  console.log(`  Inventory Items: ${inventoryItems}`)
  console.log(`  User-Restaurant Mappings: ${userRestaurants}`)
  console.log(`  Restaurant: ${restaurant.name} (kept)`)

  console.log('\n' + '='.repeat(60))
  console.log('Cleanup complete!')
  console.log('='.repeat(60))
}

if (!restaurantId) {
  console.error('Usage: npx tsx scripts/prod/cleanup-restaurant.ts <restaurant-id> [--execute]')
  console.error('')
  console.error('Examples:')
  console.error('  npx tsx scripts/prod/cleanup-restaurant.ts bliss-miniere            # dry run')
  console.error('  npx tsx scripts/prod/cleanup-restaurant.ts bliss-miniere --execute   # actually delete')
  process.exit(1)
}

cleanupRestaurant(restaurantId, dryRun)
  .catch((e) => {
    console.error('Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
