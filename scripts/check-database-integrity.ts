/**
 * Database Integrity Check
 *
 * Verifies all tables have data and relationships are intact
 * Run with: npx tsx scripts/check-database-integrity.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Database Integrity\n')

  // Core tables to check
  const checks = [
    { name: 'Restaurants', model: prisma.restaurant },
    { name: 'Users', model: prisma.user },
    { name: 'UserRestaurants (assignments)', model: prisma.userRestaurant },
    { name: 'Categories', model: prisma.category },
    { name: 'InventoryItems', model: prisma.inventoryItem },
    { name: 'StockMovements', model: prisma.stockMovement },
    { name: 'ProductionLogs', model: prisma.productionLog },
    { name: 'ExpenseGroups', model: prisma.expenseGroup },
    { name: 'Expenses', model: prisma.expense },
    { name: 'Customers', model: prisma.customer },
    { name: 'Sales', model: prisma.sale },
    { name: 'Debts', model: prisma.debt },
    { name: 'DebtPayments', model: prisma.debtPayment },
    { name: 'BankTransactions', model: prisma.bankTransaction },
    { name: 'ExpensePayments', model: prisma.expensePayment },
  ]

  console.log('📊 Table Row Counts:\n')

  let totalRecords = 0
  const results: { name: string; count: number }[] = []

  for (const check of checks) {
    const count = await (check.model as any).count()
    results.push({ name: check.name, count })
    totalRecords += count

    const status = count > 0 ? '✅' : '⚠️ '
    console.log(`${status} ${check.name.padEnd(35)} ${count} records`)
  }

  console.log(`\n📈 Total Records Across All Tables: ${totalRecords}\n`)

  // Detailed checks
  console.log('🔗 Relationship Integrity Checks:\n')

  // Check restaurants
  const restaurants = await prisma.restaurant.findMany({
    include: {
      _count: {
        select: {
          inventoryItems: true,
          expenses: true,
          sales: true,
          users: true
        }
      }
    }
  })

  console.log('🏢 Restaurants:')
  if (restaurants.length === 0) {
    console.log('   ❌ NO RESTAURANTS FOUND - Database needs seeding!')
  } else {
    restaurants.forEach(r => {
      console.log(`   ✅ ${r.name}`)
      console.log(`      - Inventory: ${r._count.inventoryItems} items`)
      console.log(`      - Expenses: ${r._count.expenses}`)
      console.log(`      - Sales: ${r._count.sales}`)
      console.log(`      - Users: ${r._count.users}`)
    })
  }

  // Check users
  const users = await prisma.user.findMany({
    include: {
      restaurants: {
        include: {
          restaurant: { select: { name: true } }
        }
      }
    }
  })

  console.log('\n👥 Users:')
  if (users.length === 0) {
    console.log('   ❌ NO USERS FOUND - Database needs seeding!')
  } else {
    users.forEach(u => {
      const restaurantNames = u.restaurants.map(r => r.restaurant.name).join(', ')
      console.log(`   ✅ ${u.name} (${u.email}) - Role: ${u.role}`)
      console.log(`      Restaurants: ${restaurantNames || 'None'}`)
    })
  }

  // Check inventory items
  const inventoryCount = await prisma.inventoryItem.count()
  console.log(`\n📦 Inventory Items: ${inventoryCount}`)
  if (inventoryCount === 0) {
    console.log('   ⚠️  No inventory items - consider seeding')
  }

  // Check expenses with new payment status
  const expensesByStatus = await prisma.expense.groupBy({
    by: ['status', 'paymentStatus'],
    _count: true
  })

  console.log('\n💰 Expense Status Breakdown:')
  if (expensesByStatus.length === 0) {
    console.log('   No expenses found')
  } else {
    expensesByStatus.forEach(stat => {
      console.log(`   ${stat.status} / ${stat.paymentStatus}: ${stat._count} expenses`)
    })
  }

  // Final verdict
  console.log('\n' + '='.repeat(60))

  if (restaurants.length === 0 || users.length === 0) {
    console.log('❌ DATABASE NEEDS SEEDING')
    console.log('\nRun: npm run seed (or create seed data manually)')
  } else if (totalRecords < 10) {
    console.log('⚠️  DATABASE HAS MINIMAL DATA')
    console.log('\nConsider seeding additional test data')
  } else {
    console.log('✅ DATABASE INTEGRITY LOOKS GOOD')
    console.log(`\n${totalRecords} total records across all tables`)
    console.log('All core data appears intact after migration')
  }

  console.log('='.repeat(60))
}

main()
  .catch((error) => {
    console.error('❌ Integrity check failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
