// Diagnostic script to check dashboard data
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDashboardData() {
  try {
    console.log('\n=== DASHBOARD DATA DIAGNOSTIC ===\n')

    // Get all restaurants
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true }
    })
    console.log('Restaurants:', restaurants.length)
    restaurants.forEach(r => console.log(`  - ${r.name} (${r.id})`))

    if (restaurants.length === 0) {
      console.log('\n❌ No restaurants found!')
      return
    }

    const restaurantId = restaurants[0].id
    console.log(`\n📊 Checking data for: ${restaurants[0].name}\n`)

    // Calculate date range (last 30 days)
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)

    console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // Check sales
    const salesByStatus = await prisma.sale.groupBy({
      by: ['status'],
      where: { restaurantId },
      _count: true,
      _sum: { totalGNF: true }
    })

    console.log('\n📈 Sales:')
    if (salesByStatus.length === 0) {
      console.log('  ❌ No sales found')
    } else {
      salesByStatus.forEach(s => {
        console.log(`  ${s.status}: ${s._count} sales, ${s._sum.totalGNF?.toLocaleString()} GNF`)
      })
    }

    // Check sales in period
    const salesInPeriod = await prisma.sale.findMany({
      where: {
        restaurantId,
        date: { gte: startDate, lte: endDate }
      },
      select: { status: true, date: true, totalGNF: true }
    })
    console.log(`  In last 30 days: ${salesInPeriod.length} sales`)
    if (salesInPeriod.length > 0) {
      const approved = salesInPeriod.filter(s => s.status === 'Approved')
      console.log(`    - Approved: ${approved.length} (${approved.reduce((sum, s) => sum + s.totalGNF, 0).toLocaleString()} GNF)`)
      console.log(`    - Pending: ${salesInPeriod.filter(s => s.status === 'Pending').length}`)
    }

    // Check expenses
    const expensesByStatus = await prisma.expense.groupBy({
      by: ['status'],
      where: { restaurantId },
      _count: true,
      _sum: { amountGNF: true }
    })

    console.log('\n💰 Expenses:')
    if (expensesByStatus.length === 0) {
      console.log('  ❌ No expenses found')
    } else {
      expensesByStatus.forEach(e => {
        console.log(`  ${e.status}: ${e._count} expenses, ${e._sum.amountGNF?.toLocaleString()} GNF`)
      })
    }

    // Check expenses in period
    const expensesInPeriod = await prisma.expense.findMany({
      where: {
        restaurantId,
        date: { gte: startDate, lte: endDate }
      },
      select: { status: true, date: true, amountGNF: true }
    })
    console.log(`  In last 30 days: ${expensesInPeriod.length} expenses`)
    if (expensesInPeriod.length > 0) {
      const approved = expensesInPeriod.filter(e => e.status === 'Approved')
      console.log(`    - Approved: ${approved.length} (${approved.reduce((sum, e) => sum + e.amountGNF, 0).toLocaleString()} GNF)`)
      console.log(`    - Pending: ${expensesInPeriod.filter(e => e.status === 'Pending').length}`)
    }

    // Check inventory
    const inventoryCount = await prisma.inventoryItem.count({
      where: { restaurantId, isActive: true }
    })
    console.log(`\n📦 Active Inventory Items: ${inventoryCount}`)

    // Summary
    console.log('\n=== SUMMARY ===')
    const approvedSalesInPeriod = salesInPeriod.filter(s => s.status === 'Approved')
    const approvedExpensesInPeriod = expensesInPeriod.filter(e => e.status === 'Approved')

    if (approvedSalesInPeriod.length === 0 && approvedExpensesInPeriod.length === 0) {
      console.log('❌ No APPROVED sales or expenses in the last 30 days')
      console.log('   Dashboard will show zeros!')
      console.log('\n💡 Solutions:')
      console.log('   1. Approve pending sales/expenses from the approvals page')
      console.log('   2. Create new sales/expenses and approve them')
      console.log('   3. Change the dashboard time period to include older data')
    } else {
      console.log('✅ Dashboard should show data:')
      console.log(`   Revenue: ${approvedSalesInPeriod.reduce((sum, s) => sum + s.totalGNF, 0).toLocaleString()} GNF`)
      console.log(`   Expenses: ${approvedExpensesInPeriod.reduce((sum, e) => sum + e.amountGNF, 0).toLocaleString()} GNF`)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDashboardData()
