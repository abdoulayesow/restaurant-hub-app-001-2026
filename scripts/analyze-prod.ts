import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function main() {
  console.log('='.repeat(60))
  console.log('Production Database Analysis')
  console.log('='.repeat(60))

  // Core data to KEEP
  console.log('\n📌 DATA TO KEEP (Core Setup):')

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, location: true }
  })
  console.log(`  Restaurants: ${restaurants.length}`)
  restaurants.forEach(r => console.log(`    - ${r.name} (${r.location || 'no location'})`))

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  })
  console.log(`  Users: ${users.length}`)
  users.forEach(u => console.log(`    - ${u.name || u.email} (${u.role})`))

  const userRestaurants = await prisma.userRestaurant.count()
  console.log(`  User-Restaurant mappings: ${userRestaurants}`)

  // Reference data to KEEP
  console.log('\n📋 REFERENCE DATA TO KEEP:')

  const products = await prisma.product.count()
  console.log(`  Products: ${products}`)

  const inventoryItems = await prisma.inventoryItem.count()
  console.log(`  Inventory Items: ${inventoryItems}`)

  const suppliers = await prisma.supplier.count()
  console.log(`  Suppliers: ${suppliers}`)

  // Transactional data to CLEAR
  console.log('\n🗑️  DATA TO CLEAR (Baking & Finances):')

  const sales = await prisma.sale.count()
  console.log(`  Sales: ${sales}`)

  const saleItems = await prisma.saleItem.count()
  console.log(`  Sale Items: ${saleItems}`)

  const expenses = await prisma.expense.count()
  console.log(`  Expenses: ${expenses}`)

  const expensePayments = await prisma.expensePayment.count()
  console.log(`  Expense Payments: ${expensePayments}`)

  const productionLogs = await prisma.productionLog.count()
  console.log(`  Production Logs: ${productionLogs}`)

  const productionItems = await prisma.productionItem.count()
  console.log(`  Production Items: ${productionItems}`)

  const stockMovements = await prisma.stockMovement.count()
  console.log(`  Stock Movements: ${stockMovements}`)

  const debts = await prisma.debt.count()
  console.log(`  Debts: ${debts}`)

  const debtPayments = await prisma.debtPayment.count()
  console.log(`  Debt Payments: ${debtPayments}`)

  const bankTransactions = await prisma.bankTransaction.count()
  console.log(`  Bank Transactions: ${bankTransactions}`)

  const customers = await prisma.customer.count()
  console.log(`  Customers: ${customers}`)

  const dailySummaries = await prisma.dailySummary.count()
  console.log(`  Daily Summaries: ${dailySummaries}`)

  // Check inventory stock levels
  console.log('\n📦 INVENTORY STOCK LEVELS (will reset to 0):')
  const itemsWithStock = await prisma.inventoryItem.findMany({
    where: { currentStock: { gt: 0 } },
    select: { name: true, currentStock: true, unit: true }
  })
  console.log(`  Items with stock > 0: ${itemsWithStock.length}`)
  itemsWithStock.slice(0, 5).forEach(i => console.log(`    - ${i.name}: ${i.currentStock} ${i.unit}`))
  if (itemsWithStock.length > 5) console.log(`    ... and ${itemsWithStock.length - 5} more`)

  // Restaurant settings
  console.log('\n⚙️  RESTAURANT SETTINGS:')
  const restDetails = await prisma.restaurant.findMany({
    select: {
      name: true,
      initialCashBalance: true,
      currency: true
    }
  })
  restDetails.forEach(r => {
    console.log(`  ${r.name}:`)
    console.log(`    - Initial Cash Balance: ${r.initialCashBalance} GNF`)
    console.log(`    - Currency: ${r.currency}`)
  })

  console.log('\n' + '='.repeat(60))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
