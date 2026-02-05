import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractDatePart } from '@/lib/date-utils'
import {
  calculateDailyAverage,
  calculateDaysUntilDepletion,
  calculateDepletionDate,
  getForecastStatus,
  calculateConfidence,
  calculateReorderQuantity,
  getReorderUrgency,
  calculateCashRunway,
  calculateDemandForecast,
  getTrend,
  calculateProfitMargin,
  comparePeriodMargins,
  type StockForecast,
  type ReorderRecommendation,
  type DemandForecast,
  type CashRunwayData,
  type ProfitabilityData
} from '@/lib/projection-utils'

/**
 * GET /api/projections
 *
 * Returns projection data for stock depletion, reorder recommendations,
 * cash runway, demand forecasts, and profitability trends.
 *
 * Query params:
 * - restaurantId: required
 * - analysisWindow: number of days to analyze (default: 30)
 * - forecastPeriods: comma-separated days to forecast (default: 7,14,30)
 */
export async function GET(request: NextRequest) {
  try {
    // ============================================================================
    // Authentication & Authorization
    // ============================================================================
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'You do not have access to this restaurant' },
        { status: 403 }
      )
    }

    // ============================================================================
    // Query Parameters
    // ============================================================================
    const analysisWindow = parseInt(searchParams.get('analysisWindow') || '30', 10)
    const forecastPeriodsStr = searchParams.get('forecastPeriods') || '7,14,30'
    const forecastPeriods = forecastPeriodsStr.split(',').map(p => parseInt(p, 10))

    const analysisStartDate = new Date()
    analysisStartDate.setDate(analysisStartDate.getDate() - analysisWindow)

    // ============================================================================
    // Fetch Data (Optimized - All in Parallel)
    // ============================================================================
    const [
      inventoryItems,
      stockMovements,
      sales,
      expenses,
      bankTransactions,
      restaurant
    ] = await Promise.all([
      // Inventory items
      prisma.inventoryItem.findMany({
        where: {
          restaurantId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          category: true,
          currentStock: true,
          unit: true,
          minStock: true,
          unitCostGNF: true,
          supplierId: true,
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),

      // Stock movements (last analysisWindow days)
      prisma.stockMovement.findMany({
        where: {
          restaurantId,
          createdAt: { gte: analysisStartDate },
          type: 'Usage' // Only usage for consumption calculation
        },
        select: {
          id: true,
          itemId: true,
          quantity: true,
          type: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      }),

      // Sales (last 60 days for chart history, approved only)
      prisma.sale.findMany({
        where: {
          restaurantId,
          date: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
          status: 'Approved'
        },
        select: {
          id: true,
          totalGNF: true,
          date: true
        },
        orderBy: { date: 'asc' }
      }),

      // Expenses (last 60 days for chart history, paid only)
      prisma.expense.findMany({
        where: {
          restaurantId,
          date: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'Paid'
        },
        select: {
          id: true,
          amountGNF: true,
          date: true
        },
        orderBy: { date: 'asc' }
      }),

      // Bank transactions (confirmed only)
      prisma.bankTransaction.findMany({
        where: {
          restaurantId,
          status: 'Confirmed'
        },
        select: {
          id: true,
          type: true,
          amount: true,
          date: true
        },
        orderBy: { date: 'asc' }
      }),

      // Restaurant initial balance
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { initialCashBalance: true }
      })
    ])

    // ============================================================================
    // 1. Stock Depletion Forecasts
    // ============================================================================
    const stockForecasts: StockForecast[] = []

    // Group stock movements by item
    const movementsByItem = new Map<string, typeof stockMovements>()
    for (const movement of stockMovements) {
      const existing = movementsByItem.get(movement.itemId) || []
      existing.push(movement)
      movementsByItem.set(movement.itemId, existing)
    }

    for (const item of inventoryItems) {
      const movements = movementsByItem.get(item.id) || []
      const dailyAverageUsage = calculateDailyAverage(movements, analysisWindow)
      const daysUntilDepletion = calculateDaysUntilDepletion(item.currentStock, dailyAverageUsage)
      const depletionDate = calculateDepletionDate(daysUntilDepletion)
      const status = getForecastStatus(daysUntilDepletion)
      const confidence = calculateConfidence(movements, analysisWindow)

      stockForecasts.push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        dailyAverageUsage,
        daysUntilDepletion,
        depletionDate,
        status,
        confidence
      })
    }

    // Sort by days until depletion (most urgent first)
    stockForecasts.sort((a, b) => {
      if (a.daysUntilDepletion === null) return 1
      if (b.daysUntilDepletion === null) return -1
      return a.daysUntilDepletion - b.daysUntilDepletion
    })

    // ============================================================================
    // 2. Reorder Recommendations
    // ============================================================================
    const reorderRecommendations: ReorderRecommendation[] = []

    for (const forecast of stockForecasts) {
      // Only recommend reorder for items with WARNING or worse status
      if (forecast.status === 'OK' || forecast.status === 'NO_DATA') continue

      const item = inventoryItems.find(i => i.id === forecast.itemId)
      if (!item) continue

      const recommendedOrderQuantity = calculateReorderQuantity(
        forecast.currentStock,
        forecast.dailyAverageUsage,
        5, // Lead time days (default)
        3  // Safety days
      )

      if (recommendedOrderQuantity > 0) {
        reorderRecommendations.push({
          itemId: forecast.itemId,
          itemName: forecast.itemName,
          currentStock: forecast.currentStock,
          recommendedOrderQuantity,
          unit: forecast.unit,
          estimatedCostGNF: recommendedOrderQuantity * (item.unitCostGNF || 0),
          urgency: getReorderUrgency(forecast.daysUntilDepletion),
          supplierId: item.supplierId || undefined,
          supplierName: item.supplier?.name || undefined
        })
      }
    }

    // Sort by urgency (URGENT > SOON > PLAN_AHEAD)
    const urgencyOrder = { URGENT: 0, SOON: 1, PLAN_AHEAD: 2 }
    reorderRecommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

    // ============================================================================
    // 3. Cash Runway
    // ============================================================================
    let currentBalance = restaurant?.initialCashBalance || 0

    // Calculate balance from confirmed bank transactions
    for (const transaction of bankTransactions) {
      if (transaction.type === 'Deposit') {
        currentBalance += transaction.amount
      } else {
        currentBalance -= transaction.amount
      }
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalGNF, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amountGNF, 0)

    const dailyRevenue = totalRevenue / analysisWindow
    const dailyExpenses = totalExpenses / analysisWindow

    const scenarios = calculateCashRunway(currentBalance, dailyRevenue, dailyExpenses)

    const cashRunway: CashRunwayData = {
      currentBalance,
      scenarios,
      dailyRevenue,
      dailyExpenses
    }

    // ============================================================================
    // 4. Demand Forecasts
    // ============================================================================
    const salesByDate = sales.map(s => s.totalGNF)
    const demandForecasts: DemandForecast[] = []

    for (const days of forecastPeriods) {
      const forecast = calculateDemandForecast(salesByDate, days)
      const { trend, percentage } = getTrend(salesByDate)

      demandForecasts.push({
        period: `${days}d` as '7d' | '14d' | '30d',
        expectedRevenue: forecast.expectedRevenue,
        confidenceInterval: forecast.confidenceInterval,
        trend,
        trendPercentage: percentage
      })
    }

    // ============================================================================
    // 5. Profitability Trend
    // ============================================================================
    const currentMargin = calculateProfitMargin(totalRevenue, totalExpenses)

    // Calculate margins for different periods for comparison
    const periodComparison: { period: string; margin: number }[] = []

    // Current period (30 days)
    periodComparison.push({
      period: '30d',
      margin: currentMargin
    })

    // 60 days (if we have data)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const [sales60Agg, expenses60Agg] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          restaurantId,
          date: { gte: sixtyDaysAgo },
          status: 'Approved'
        },
        _sum: { totalGNF: true }
      }),
      prisma.expense.aggregate({
        where: {
          restaurantId,
          date: { gte: sixtyDaysAgo },
          paymentStatus: 'Paid'
        },
        _sum: { amountGNF: true }
      })
    ])

    const revenue60 = sales60Agg._sum.totalGNF || 0
    const expenses60 = expenses60Agg._sum.amountGNF || 0
    const margin60 = calculateProfitMargin(revenue60, expenses60)

    periodComparison.push({
      period: '60d',
      margin: margin60
    })

    const trend = comparePeriodMargins(periodComparison)

    const profitability: ProfitabilityData = {
      currentMargin,
      trend,
      periodComparison
    }

    // ============================================================================
    // 6. Historical Data for Chart (Revenue & Expenses by Date)
    // ============================================================================
    const historicalData: Array<{ date: string; revenue: number; expenses: number }> = []

    // Group sales and expenses by date
    const salesByDateMap = new Map<string, number>()
    const expensesByDateMap = new Map<string, number>()

    for (const sale of sales) {
      const dateStr = extractDatePart(sale.date)
      salesByDateMap.set(dateStr, (salesByDateMap.get(dateStr) || 0) + sale.totalGNF)
    }

    for (const expense of expenses) {
      const dateStr = extractDatePart(expense.date)
      expensesByDateMap.set(dateStr, (expensesByDateMap.get(dateStr) || 0) + expense.amountGNF)
    }

    // Combine into historical data array
    const allDates = new Set([...salesByDateMap.keys(), ...expensesByDateMap.keys()])
    for (const date of Array.from(allDates).sort()) {
      historicalData.push({
        date,
        revenue: salesByDateMap.get(date) || 0,
        expenses: expensesByDateMap.get(date) || 0
      })
    }

    // ============================================================================
    // Response
    // ============================================================================
    return NextResponse.json({
      stockForecasts,
      reorderRecommendations,
      cashRunway,
      demandForecasts,
      profitability,
      historicalData
    })

  } catch (error) {
    console.error('[API] Error fetching projections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projections' },
      { status: 500 }
    )
  }
}
