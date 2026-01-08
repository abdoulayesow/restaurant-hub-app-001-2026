import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard - Aggregated dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bakeryId = searchParams.get('bakeryId')
    const period = parseInt(searchParams.get('period') || '30', 10)

    if (!bakeryId) {
      return NextResponse.json({ error: 'bakeryId is required' }, { status: 400 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId,
        },
      },
    })

    if (!userBakery) {
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
      bakery,
    ] = await Promise.all([
      // Approved sales in period
      prisma.sale.findMany({
        where: {
          bakeryId,
          status: 'Approved',
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      // Approved expenses in period with category
      prisma.expense.findMany({
        where: {
          bakeryId,
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
        where: { bakeryId, status: 'Pending' },
      }),
      // Pending expenses count
      prisma.expense.count({
        where: { bakeryId, status: 'Pending' },
      }),
      // Low stock items
      prisma.inventoryItem.findMany({
        where: {
          bakeryId,
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
      prisma.bakery.findUnique({
        where: { id: bakeryId },
        select: {
          initialCashBalance: true,
          initialOrangeBalance: true,
          initialCardBalance: true,
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
      (bakery?.initialCashBalance || 0) +
      (bakery?.initialOrangeBalance || 0) +
      (bakery?.initialCardBalance || 0)
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

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin,
        balance,
      },
      revenueByDay,
      expensesByCategory,
      lowStockItems: lowStockItemsFiltered,
      pendingApprovals: {
        sales: pendingSalesCount,
        expenses: pendingExpensesCount,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
