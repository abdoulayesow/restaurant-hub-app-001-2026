// Test dashboard API integration
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDashboardAPI() {
  try {
    console.log('\n=== DASHBOARD API INTEGRATION TEST ===\n')

    const restaurantId = 'bakery-conakry-main'
    const period = 30
    const viewMode = 'business'

    // Calculate date range (same logic as API)
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)
    startDate.setHours(0, 0, 0, 0)

    console.log('Query Parameters:')
    console.log(`  restaurantId: ${restaurantId}`)
    console.log(`  period: ${period} days`)
    console.log(`  viewMode: ${viewMode}`)
    console.log(`  dateRange: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // Fetch approved sales (same as API line 86-93)
    const approvedSales = await prisma.sale.findMany({
      where: {
        restaurantId,
        status: 'Approved',
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })

    console.log('\n📈 Approved Sales Query Result:')
    console.log(`  Found: ${approvedSales.length} sales`)
    approvedSales.forEach(s => {
      console.log(`    ${s.date.toISOString().split('T')[0]}: ${s.totalGNF.toLocaleString()} GNF`)
    })

    // Fetch approved expenses (same as API line 95-118)
    const approvedExpenses = await prisma.expense.findMany({
      where: {
        restaurantId,
        status: 'Approved',
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            color: true,
            expenseGroup: {
              select: {
                key: true,
                label: true,
                labelFr: true,
              },
            },
          },
        },
      },
    })

    console.log('\n💰 Approved Expenses Query Result:')
    console.log(`  Found: ${approvedExpenses.length} expenses`)
    approvedExpenses.forEach(e => {
      console.log(`    ${e.date.toISOString().split('T')[0]}: ${e.amountGNF.toLocaleString()} GNF`)
    })

    // Calculate KPIs (same as API line 268-275)
    const totalRevenue = approvedSales.reduce((sum, s) => sum + s.totalGNF, 0)
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amountGNF, 0)
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

    console.log('\n📊 Calculated KPIs:')
    console.log(`  Total Revenue: ${totalRevenue.toLocaleString()} GNF`)
    console.log(`  Total Expenses: ${totalExpenses.toLocaleString()} GNF`)
    console.log(`  Profit: ${profit.toLocaleString()} GNF`)
    console.log(`  Profit Margin: ${profitMargin}%`)

    // Build revenueByDay data (same as API line 323-345)
    const revenueByDayData = approvedSales.map(s => ({ date: s.date, amount: s.totalGNF }))
    const expensesByDayData = approvedExpenses.map(e => ({ date: e.date, amount: e.amountGNF }))

    const revenueMap = new Map()
    const expensesMap = new Map()

    revenueByDayData.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0]
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + item.amount)
    })

    expensesByDayData.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0]
      expensesMap.set(dateKey, (expensesMap.get(dateKey) || 0) + item.amount)
    })

    // Fill in all days in the period
    const revenueByDay = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      revenueByDay.push({
        date: dateKey,
        revenue: revenueMap.get(dateKey) || 0,
        expenses: expensesMap.get(dateKey) || 0,
      })
    }

    console.log('\n📈 Chart Data (revenueByDay):')
    console.log(`  Total data points: ${revenueByDay.length}`)
    const nonZeroDays = revenueByDay.filter(d => d.revenue > 0 || d.expenses > 0)
    console.log(`  Days with data: ${nonZeroDays.length}`)
    console.log('\n  Sample (non-zero days):')
    nonZeroDays.slice(0, 10).forEach(d => {
      console.log(`    ${d.date}: Revenue=${d.revenue.toLocaleString()}, Expenses=${d.expenses.toLocaleString()}`)
    })

    console.log('\n=== DIAGNOSIS ===')
    if (revenueByDay.length === 0) {
      console.log('❌ ERROR: revenueByDay array is empty!')
      console.log('   The chart will show a flat line.')
    } else if (nonZeroDays.length === 0) {
      console.log('❌ ISSUE: All days have zero revenue and expenses')
      console.log('   The chart will show a flat line at zero.')
      console.log('   But KPIs show revenue:', totalRevenue)
      console.log('   This is a DATA MISMATCH bug!')
    } else {
      console.log('✅ Data looks correct!')
      console.log(`   Chart should show ${nonZeroDays.length} data points`)
      console.log('   If you see a flat line, the issue is in the frontend chart component.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDashboardAPI()
