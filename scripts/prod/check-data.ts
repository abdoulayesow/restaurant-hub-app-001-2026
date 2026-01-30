/**
 * Quick script to check production database data counts
 * Usage: DATABASE_URL="..." npx tsx scripts/prod/check-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Production Database Status')
  console.log('='.repeat(50))
  console.log('')

  // Base setup
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true, initialCapital: true } })
  const users = await prisma.user.findMany({ select: { email: true, role: true } })
  const userRestaurants = await prisma.userRestaurant.count()
  const categories = await prisma.category.count()
  const expenseGroups = await prisma.expenseGroup.count()
  const suppliers = await prisma.supplier.count()
  const paymentMethods = await prisma.paymentMethod.count()
  const inventoryItems = await prisma.inventoryItem.count()
  const products = await prisma.product.count()
  const customers = await prisma.customer.count()

  // Transactions
  const sales = await prisma.sale.count()
  const expenses = await prisma.expense.count()
  const productionLogs = await prisma.productionLog.count()
  const bankTransactions = await prisma.bankTransaction.count()
  const debts = await prisma.debt.count()
  const debtPayments = await prisma.debtPayment.count()
  const stockMovements = await prisma.stockMovement.count()

  console.log('BASE SETUP:')
  console.log(`  Restaurants: ${restaurants.length}`)
  restaurants.forEach(r => console.log(`    - ${r.name} (capital: ${r.initialCapital?.toLocaleString() || 0} GNF)`))
  console.log(`  Users: ${users.length}`)
  users.forEach(u => console.log(`    - ${u.email} (${u.role})`))
  console.log(`  User-Restaurant Assignments: ${userRestaurants}`)
  console.log(`  Categories: ${categories}`)
  console.log(`  Expense Groups: ${expenseGroups}`)
  console.log(`  Suppliers: ${suppliers}`)
  console.log(`  Payment Methods: ${paymentMethods}`)
  console.log(`  Inventory Items: ${inventoryItems}`)
  console.log(`  Products: ${products}`)
  console.log(`  Customers: ${customers}`)
  console.log('')

  console.log('TRANSACTIONS:')
  console.log(`  Sales: ${sales}`)
  console.log(`  Expenses: ${expenses}`)
  console.log(`  Production Logs: ${productionLogs}`)
  console.log(`  Bank Transactions: ${bankTransactions}`)
  console.log(`  Debts: ${debts}`)
  console.log(`  Debt Payments: ${debtPayments}`)
  console.log(`  Stock Movements: ${stockMovements}`)
  console.log('')

  const hasTransactions = sales + expenses + productionLogs + bankTransactions + debts > 0
  console.log('STATUS:')
  console.log(`  Has transaction data: ${hasTransactions ? 'YES' : 'NO'}`)

  if (hasTransactions) {
    console.log('')
    console.log('To reset for testing, run: npx tsx scripts/prod/reset.ts')
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
