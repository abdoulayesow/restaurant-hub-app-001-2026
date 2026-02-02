/**
 * Check Database Indexes
 *
 * Verifies that all expected indexes exist in the database
 * Run with: npx tsx scripts/check-indexes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Database Indexes\n')
  console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown')
  console.log('='.repeat(80))

  // Query to get all indexes on key tables
  const indexQuery = `
    SELECT
        t.relname as tablename,
        i.relname as indexname,
        pg_get_indexdef(i.oid) as indexdef
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    WHERE t.relname IN ('Sale', 'Expense', 'SaleItem', 'ExpenseItem', 'ExpensePayment',
                        'Debt', 'Customer', 'BankTransaction', 'StockMovement',
                        'ProductionLog', 'InventoryItem')
      AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY t.relname, i.relname;
  `

  const result = await prisma.$queryRawUnsafe<Array<{
    tablename: string
    indexname: string
    indexdef: string
  }>>(indexQuery)

  // Group by table
  const byTable: Record<string, Array<{ indexname: string; indexdef: string }>> = {}
  result.forEach(row => {
    if (!byTable[row.tablename]) {
      byTable[row.tablename] = []
    }
    byTable[row.tablename].push({
      indexname: row.indexname,
      indexdef: row.indexdef
    })
  })

  console.log('\n📊 Indexes by Table:\n')
  Object.keys(byTable).sort().forEach(tablename => {
    console.log(`\n${tablename}:`)
    byTable[tablename].forEach(idx => {
      // Highlight custom indexes vs auto-generated primary key indexes
      const isCustom = !idx.indexname.includes('_pkey')
      const marker = isCustom ? '📌' : '🔑'
      console.log(`  ${marker} ${idx.indexname}`)
      if (isCustom) {
        // Extract the column names from the index definition
        const match = idx.indexdef.match(/\((.*?)\)/)
        if (match) {
          console.log(`     Columns: ${match[1]}`)
        }
      }
    })
  })

  // Get table sizes
  const sizeQuery = `
    SELECT
        relname as tablename,
        pg_size_pretty(pg_total_relation_size(oid)) AS size,
        pg_total_relation_size(oid) AS size_bytes
    FROM pg_class
    WHERE relname IN ('Sale', 'Expense', 'SaleItem', 'ExpenseItem', 'ExpensePayment',
                      'Debt', 'Customer', 'BankTransaction', 'StockMovement',
                      'ProductionLog', 'InventoryItem')
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND relkind = 'r'
    ORDER BY size_bytes DESC;
  `

  const sizes = await prisma.$queryRawUnsafe<Array<{
    tablename: string
    size: string
    size_bytes: bigint
  }>>(sizeQuery)

  console.log('\n\n📦 Table Sizes:\n')
  sizes.forEach(row => {
    console.log(`  ${row.tablename.padEnd(25)} ${row.size.padStart(10)}`)
  })

  // Get record counts for key tables
  console.log('\n\n📈 Record Counts:\n')

  const counts = [
    { name: 'Sales', count: await prisma.sale.count() },
    { name: 'Expenses', count: await prisma.expense.count() },
    { name: 'SaleItems', count: await prisma.saleItem.count() },
    { name: 'ExpenseItems', count: await prisma.expenseItem.count() },
    { name: 'ExpensePayments', count: await prisma.expensePayment.count() },
    { name: 'Debts', count: await prisma.debt.count() },
    { name: 'Customers', count: await prisma.customer.count() },
    { name: 'BankTransactions', count: await prisma.bankTransaction.count() },
    { name: 'StockMovements', count: await prisma.stockMovement.count() },
    { name: 'ProductionLogs', count: await prisma.productionLog.count() },
    { name: 'InventoryItems', count: await prisma.inventoryItem.count() },
  ]

  counts.sort((a, b) => b.count - a.count).forEach(({ name, count }) => {
    console.log(`  ${name.padEnd(25)} ${count.toString().padStart(10)}`)
  })

  // Expected indexes check for Sale and Expense tables
  console.log('\n\n✅ Expected Indexes Check:\n')

  const expectedSaleIndexes = [
    'Sale_restaurantId_idx',
    'Sale_date_idx',
    'Sale_status_idx',
    'Sale_restaurantId_date_key'
  ]

  const expectedExpenseIndexes = [
    'Expense_restaurantId_idx',
    'Expense_date_idx',
    'Expense_categoryId_idx',
    'Expense_supplierId_idx',
    'Expense_paymentStatus_idx'
  ]

  const saleIndexes = byTable['Sale']?.map(i => i.indexname) || []
  const expenseIndexes = byTable['Expense']?.map(i => i.indexname) || []

  console.log('Sale table:')
  expectedSaleIndexes.forEach(idx => {
    const exists = saleIndexes.includes(idx)
    console.log(`  ${exists ? '✅' : '❌'} ${idx}`)
  })

  console.log('\nExpense table:')
  expectedExpenseIndexes.forEach(idx => {
    const exists = expenseIndexes.includes(idx)
    console.log(`  ${exists ? '✅' : '❌'} ${idx}`)
  })

  console.log('\n' + '='.repeat(80))
}

main()
  .catch((error) => {
    console.error('❌ Index check failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
