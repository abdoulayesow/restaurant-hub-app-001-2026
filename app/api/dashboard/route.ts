import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getExpiryInfo } from '@/lib/inventory-helpers'
import { formatDateForInput, extractDatePart } from '@/lib/date-utils'

// GET /api/dashboard - Aggregated dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const period = parseInt(searchParams.get('period') || '30', 10)
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    const viewMode = searchParams.get('viewMode') || 'business' // 'business' or 'cash'

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Validate user has access to this bakery
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate date range (custom dates take priority over period)
    let endDate: Date
    let startDate: Date
    let periodDays: number

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)
      periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      startDate = new Date()
      startDate.setDate(startDate.getDate() - period)
      startDate.setHours(0, 0, 0, 0)
      periodDays = period
    }

    // Calculate previous period for comparison
    const prevEndDate = new Date(startDate)
    prevEndDate.setMilliseconds(-1) // Just before current period starts
    const prevStartDate = new Date(prevEndDate)
    prevStartDate.setDate(prevStartDate.getDate() - periodDays)
    prevStartDate.setHours(0, 0, 0, 0)

    // Fetch all data in parallel
    const [
      approvedSales,
      approvedExpenses,
      prevPeriodSales,
      prevPeriodExpenses,
      pendingSalesCount,
      pendingExpensesCount,
      lowStockItems,
      restaurant,
      unpaidExpenses,
      inventoryItems,
      perishableItems,
      stockConsumption,
      bankTransactions,
    ] = await Promise.all([
      // Approved sales in period
      prisma.sale.findMany({
        where: {
          restaurantId,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      // Approved expenses in period with category AND expenseGroup
      prisma.expense.findMany({
        where: {
          restaurantId,
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
      }),
      // Previous period sales for comparison
      prisma.sale.aggregate({
        where: {
          restaurantId,
          date: { gte: prevStartDate, lte: prevEndDate },
        },
        _sum: { totalGNF: true },
      }),
      // Previous period expenses for comparison
      prisma.expense.aggregate({
        where: {
          restaurantId,
          date: { gte: prevStartDate, lte: prevEndDate },
        },
        _sum: { amountGNF: true },
      }),
      // Pending sales count
      prisma.sale.count({
        where: { restaurantId, status: 'Pending' },
      }),
      // Unpaid expenses count
      prisma.expense.count({
        where: { restaurantId, paymentStatus: 'Unpaid' },
      }),
      // Low stock items
      prisma.inventoryItem.findMany({
        where: {
          restaurantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nameFr: true,
          currentStock: true,
          minStock: true,
          unit: true,
        },
      }),
      // Bakery for initial balances
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          initialCashBalance: true,
          initialOrangeBalance: true,
          initialCardBalance: true,
        },
      }),
      // Unpaid/Partially paid expenses (approved but not fully paid)
      prisma.expense.findMany({
        where: {
          restaurantId,
          paymentStatus: { in: ['Unpaid', 'PartiallyPaid'] },
        },
        select: {
          id: true,
          categoryName: true,
          amountGNF: true,
          totalPaidAmount: true,
          date: true,
          supplier: {
            select: { name: true },
          },
        },
        orderBy: { date: 'asc' },
        take: 10,
      }),
      // Inventory items for valuation
      prisma.inventoryItem.findMany({
        where: {
          restaurantId,
          isActive: true,
        },
        select: {
          id: true,
          category: true,
          currentStock: true,
          unitCostGNF: true,
        },
      }),
      // Perishable items for expiry tracking
      prisma.inventoryItem.findMany({
        where: {
          restaurantId,
          isActive: true,
          expiryDays: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          nameFr: true,
          category: true,
          currentStock: true,
          unit: true,
          expiryDays: true,
        },
      }),
      // Stock consumption (Usage movements) in period
      prisma.stockMovement.findMany({
        where: {
          restaurantId,
          type: 'Usage',
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          itemId: true,
          quantity: true,
          unitCost: true,
          item: {
            select: {
              name: true,
              nameFr: true,
              unit: true,
            },
          },
        },
      }),
      // Bank transactions for cash flow view
      viewMode === 'cash'
        ? prisma.bankTransaction.findMany({
            where: {
              restaurantId,
              status: 'Confirmed',
              date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: 'asc' },
          })
        : Promise.resolve([]),
    ])

    // Calculate KPIs based on view mode
    let totalRevenue: number
    let totalExpenses: number
    let revenueByDayData: Array<{ date: Date; amount: number }>
    let expensesByDayData: Array<{ date: Date; amount: number }>

    if (viewMode === 'cash') {
      // Cash flow view: based on actual deposits/withdrawals
      const deposits = bankTransactions.filter(t => t.type === 'Deposit')
      const withdrawals = bankTransactions.filter(t => t.type === 'Withdrawal')
      totalRevenue = deposits.reduce((sum, t) => sum + t.amount, 0)
      totalExpenses = withdrawals.reduce((sum, t) => sum + t.amount, 0)
      revenueByDayData = deposits.map(t => ({ date: t.date, amount: t.amount }))
      expensesByDayData = withdrawals.map(t => ({ date: t.date, amount: t.amount }))
    } else {
      // Business view: based on sales/expenses creation date
      totalRevenue = approvedSales.reduce((sum, s) => sum + s.totalGNF, 0)
      totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amountGNF, 0)
      revenueByDayData = approvedSales.map(s => ({ date: s.date, amount: s.totalGNF }))
      expensesByDayData = approvedExpenses.map(e => ({ date: e.date, amount: e.amountGNF }))
    }

    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

    // Previous period comparison
    const prevRevenue = prevPeriodSales._sum.totalGNF || 0
    const prevExpenses = prevPeriodExpenses._sum.amountGNF || 0
    const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0
    const expensesChange = prevExpenses > 0 ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100) : 0

    // Calculate stock consumption value (actual cost of ingredients consumed)
    // Usage movements have negative quantities, so we use Math.abs()
    const stockConsumptionValue = stockConsumption.reduce(
      (sum, m) => sum + (Math.abs(m.quantity) * (m.unitCost || 0)),
      0
    )

    // Calculate food cost ratio (inventory consumption / revenue)
    // Food cost is based on actual ingredient usage, not expense categories
    const foodExpenses = stockConsumptionValue
    const foodCostRatio = totalRevenue > 0 ? Math.round((foodExpenses / totalRevenue) * 100) : 0
    const foodCostTarget = 30 // 30% target

    // Aggregate consumption by item for top consumed list
    const consumptionByItem = new Map<string, { name: string; nameFr: string; quantity: number; unit: string }>()
    stockConsumption.forEach(m => {
      const existing = consumptionByItem.get(m.itemId)
      if (existing) {
        existing.quantity += Math.abs(m.quantity)
      } else {
        consumptionByItem.set(m.itemId, {
          name: m.item.name,
          nameFr: m.item.nameFr || m.item.name,
          quantity: Math.abs(m.quantity),
          unit: m.item.unit,
        })
      }
    })
    const topConsumedItems = Array.from(consumptionByItem.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Calculate balance (initial + revenue - expenses)
    const initialBalance =
      (restaurant?.initialCashBalance || 0) +
      (restaurant?.initialOrangeBalance || 0) +
      (restaurant?.initialCardBalance || 0)
    const balance = initialBalance + totalRevenue - totalExpenses

    // Aggregate revenue and expenses by day for combined chart
    const revenueByDay: { date: string; revenue: number; expenses: number }[] = []
    const revenueMap = new Map<string, number>()
    const expensesMap = new Map<string, number>()

    // Use extractDatePart to avoid timezone conversion issues on the server
    revenueByDayData.forEach((item) => {
      const dateKey = extractDatePart(item.date)
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + item.amount)
    })

    expensesByDayData.forEach((item) => {
      const dateKey = extractDatePart(item.date)
      expensesMap.set(dateKey, (expensesMap.get(dateKey) || 0) + item.amount)
    })

    // Fill in all days in the period (even zeros)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateForInput(d)
      revenueByDay.push({
        date: dateKey,
        revenue: revenueMap.get(dateKey) || 0,
        expenses: expensesMap.get(dateKey) || 0,
      })
    }

    // Aggregate expenses by category (for detailed view)
    const expensesByCategoryMap = new Map<string, { name: string; nameFr: string; amount: number; color: string }>()

    approvedExpenses.forEach((expense) => {
      const categoryName = expense.category?.name || expense.categoryName || 'Other'
      const categoryNameFr = expense.category?.nameFr || expense.categoryName || 'Autre'
      const color = expense.category?.color || '#6B7280'
      const key = categoryName

      const existing = expensesByCategoryMap.get(key)
      if (existing) {
        existing.amount += expense.amountGNF
      } else {
        expensesByCategoryMap.set(key, {
          name: categoryName,
          nameFr: categoryNameFr,
          amount: expense.amountGNF,
          color,
        })
      }
    })

    const expensesByCategory = Array.from(expensesByCategoryMap.values())
      .sort((a, b) => b.amount - a.amount)

    // Aggregate expenses by expense group (for dashboard overview)
    const expenseGroupColors: Record<string, string> = {
      food: '#059669',      // Emerald
      transport: '#2563EB', // Blue
      utilities: '#7C3AED', // Violet
      salaries: '#EA580C',  // Orange
      other: '#6B7280',     // Gray
    }

    const expensesByGroupMap = new Map<string, { key: string; label: string; labelFr: string; amount: number; color: string }>()

    approvedExpenses.forEach((expense) => {
      const groupKey = expense.category?.expenseGroup?.key || 'other'
      const groupLabel = expense.category?.expenseGroup?.label || 'Other'
      const groupLabelFr = expense.category?.expenseGroup?.labelFr || 'Autre'
      const color = expenseGroupColors[groupKey] || '#6B7280'

      const existing = expensesByGroupMap.get(groupKey)
      if (existing) {
        existing.amount += expense.amountGNF
      } else {
        expensesByGroupMap.set(groupKey, {
          key: groupKey,
          label: groupLabel,
          labelFr: groupLabelFr,
          amount: expense.amountGNF,
          color,
        })
      }
    })

    const expensesByGroup = Array.from(expensesByGroupMap.values())
      .sort((a, b) => b.amount - a.amount)

    // Filter and format low stock items
    const lowStockItemsFiltered = lowStockItems
      .filter((item) => item.currentStock < item.minStock)
      .map((item) => ({
        id: item.id,
        name: item.name,
        nameFr: item.nameFr,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unit: item.unit,
        status: item.currentStock <= 0 || (item.minStock > 0 && item.currentStock <= item.minStock * 0.1)
          ? 'critical' as const
          : 'low' as const,
      }))
      .sort((a, b) => {
        // Critical items first
        if (a.status === 'critical' && b.status !== 'critical') return -1
        if (b.status === 'critical' && a.status !== 'critical') return 1
        // Then by how far below minStock
        const aRatio = a.currentStock / a.minStock
        const bRatio = b.currentStock / b.minStock
        return aRatio - bRatio
      })
      .slice(0, 5) // Top 5 most critical

    // Calculate total outstanding (unpaid expense amounts)
    const totalOutstanding = unpaidExpenses.reduce(
      (sum, e) => sum + (e.amountGNF - (e.totalPaidAmount || 0)),
      0
    )

    // Calculate total inventory value
    const inventoryValue = inventoryItems.reduce(
      (sum, item) => sum + (item.currentStock * item.unitCostGNF),
      0
    )

    // Calculate category breakdown for inventory value (top 3 categories)
    const categoryValueMap = new Map<string, { category: string, value: number, itemCount: number }>()
    inventoryItems.forEach((item) => {
      const category = item.category || 'Other'
      const itemValue = item.currentStock * item.unitCostGNF
      const existing = categoryValueMap.get(category)
      if (existing) {
        existing.value += itemValue
        existing.itemCount++
      } else {
        categoryValueMap.set(category, {
          category,
          value: itemValue,
          itemCount: 1,
        })
      }
    })

    const inventoryByCategory = Array.from(categoryValueMap.values())
      .map((item) => ({
        ...item,
        percentOfTotal: inventoryValue > 0 ? Math.round((item.value / inventoryValue) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)

    // Fetch last purchase dates for perishable items
    const perishableItemIds = perishableItems.map(item => item.id)
    const lastPurchaseMap = new Map<string, Date>()

    if (perishableItemIds.length > 0) {
      const purchaseMovements = await prisma.stockMovement.findMany({
        where: {
          itemId: { in: perishableItemIds },
          type: 'Purchase',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          itemId: true,
          createdAt: true,
        },
      })

      purchaseMovements.forEach(movement => {
        if (!lastPurchaseMap.has(movement.itemId)) {
          lastPurchaseMap.set(movement.itemId, movement.createdAt)
        }
      })
    }

    // Calculate expiry info for perishable items
    const itemsWithExpiry = perishableItems.map(item => {
      const lastPurchaseDate = lastPurchaseMap.get(item.id) || null
      const expiryInfo = getExpiryInfo(item, lastPurchaseDate, 7) // 7 days warning by default

      return {
        id: item.id,
        name: item.name,
        nameFr: item.nameFr,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        expiryDate: expiryInfo.expiryDate ? expiryInfo.expiryDate.toISOString() : null,
        status: expiryInfo.status,
        daysUntilExpiry: expiryInfo.daysUntilExpiry,
      }
    })

    // Filter for expired and warning items only
    const expiringItems = itemsWithExpiry.filter(
      item => item.status === 'expired' || item.status === 'warning'
    )

    // Sort by urgency (expired first, then by days until expiry)
    expiringItems.sort((a, b) => {
      if (a.status === 'expired' && b.status !== 'expired') return -1
      if (b.status === 'expired' && a.status !== 'expired') return 1
      if (a.daysUntilExpiry === null) return 1
      if (b.daysUntilExpiry === null) return -1
      return a.daysUntilExpiry - b.daysUntilExpiry
    })

    const expiredCount = expiringItems.filter(item => item.status === 'expired').length
    const warningCount = expiringItems.filter(item => item.status === 'warning').length

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin,
        balance,
        inventoryValue,
        revenueChange,
        expensesChange,
        foodCostRatio,
        foodCostTarget,
        foodExpenses,
      },
      revenueByDay,
      expensesByCategory,
      expensesByGroup,
      lowStockItems: lowStockItemsFiltered,
      pendingApprovals: {
        sales: pendingSalesCount,
        expenses: pendingExpensesCount,
      },
      unpaidExpenses: {
        expenses: unpaidExpenses.map(e => ({
          id: e.id,
          categoryName: e.categoryName,
          amountGNF: e.amountGNF,
          totalPaidAmount: e.totalPaidAmount || 0,
          date: e.date.toISOString(),
          supplier: e.supplier,
        })),
        totalOutstanding,
        count: unpaidExpenses.length,
      },
      inventoryValuation: {
        totalValue: inventoryValue,
        byCategory: inventoryByCategory,
      },
      stockConsumption: {
        totalValue: stockConsumptionValue,
        topItems: topConsumedItems,
      },
      expiringItems: {
        items: expiringItems.slice(0, 10), // Top 10 most urgent
        expiredCount,
        warningCount,
      },
      viewMode,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
