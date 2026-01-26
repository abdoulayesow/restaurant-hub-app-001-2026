import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getExpiryInfo } from '@/lib/inventory-helpers'

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

    // Calculate date range
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)
    startDate.setHours(0, 0, 0, 0)

    // Fetch all data in parallel
    const [
      approvedSales,
      approvedExpenses,
      pendingSalesCount,
      pendingExpensesCount,
      lowStockItems,
      restaurant,
      unpaidExpenses,
      inventoryItems,
      perishableItems,
    ] = await Promise.all([
      // Approved sales in period
      prisma.sale.findMany({
        where: {
          restaurantId,
          status: 'Approved',
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      // Approved expenses in period with category
      prisma.expense.findMany({
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
            },
          },
        },
      }),
      // Pending sales count
      prisma.sale.count({
        where: { restaurantId, status: 'Pending' },
      }),
      // Pending expenses count
      prisma.expense.count({
        where: { restaurantId, status: 'Pending' },
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
          status: 'Approved',
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
    ])

    // Calculate KPIs
    const totalRevenue = approvedSales.reduce((sum, s) => sum + s.totalGNF, 0)
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amountGNF, 0)
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

    // Calculate balance (initial + revenue - expenses)
    const initialBalance =
      (restaurant?.initialCashBalance || 0) +
      (restaurant?.initialOrangeBalance || 0) +
      (restaurant?.initialCardBalance || 0)
    const balance = initialBalance + totalRevenue - totalExpenses

    // Aggregate revenue by day
    const revenueByDay: { date: string; amount: number }[] = []
    const revenueMap = new Map<string, number>()

    approvedSales.forEach((sale) => {
      const dateKey = sale.date.toISOString().split('T')[0]
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + sale.totalGNF)
    })

    // Fill in all days in the period (even zeros)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      revenueByDay.push({
        date: dateKey,
        amount: revenueMap.get(dateKey) || 0,
      })
    }

    // Aggregate expenses by category
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
      },
      revenueByDay,
      expensesByCategory,
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
      expiringItems: {
        items: expiringItems.slice(0, 10), // Top 10 most urgent
        expiredCount,
        warningCount,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
