import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory/valuation
 *
 * Calculate total inventory value and breakdowns
 *
 * Query params:
 * - restaurantId (required)
 * - groupBy (optional): 'category' | 'supplier'
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const groupBy = searchParams.get('groupBy') as 'category' | 'supplier' | null

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Validate user has access to this restaurant
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

    // Fetch all active inventory items
    const items = await prisma.inventoryItem.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nameFr: true,
        category: true,
        currentStock: true,
        unitCostGNF: true,
        supplierId: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate total value and stats
    let totalValue = 0
    let activeItems = 0
    let zeroStockItems = 0

    const categoryMap = new Map<string, { category: string, value: number, itemCount: number }>()
    const supplierMap = new Map<string, { supplierId: string, supplierName: string, value: number, itemCount: number }>()

    items.forEach((item) => {
      const itemValue = item.currentStock * item.unitCostGNF
      totalValue += itemValue
      activeItems++

      if (item.currentStock === 0) {
        zeroStockItems++
      }

      // Group by category
      if (groupBy === 'category' || !groupBy) {
        const category = item.category || 'Other'
        const existing = categoryMap.get(category)
        if (existing) {
          existing.value += itemValue
          existing.itemCount++
        } else {
          categoryMap.set(category, {
            category,
            value: itemValue,
            itemCount: 1,
          })
        }
      }

      // Group by supplier
      if (groupBy === 'supplier' || !groupBy) {
        if (item.supplierId && item.supplier) {
          const existing = supplierMap.get(item.supplierId)
          if (existing) {
            existing.value += itemValue
            existing.itemCount++
          } else {
            supplierMap.set(item.supplierId, {
              supplierId: item.supplierId,
              supplierName: item.supplier.name,
              value: itemValue,
              itemCount: 1,
            })
          }
        }
      }
    })

    // Convert maps to arrays and add percentages
    const byCategory = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        percentOfTotal: totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    const bySupplier = Array.from(supplierMap.values())
      .map((item) => ({
        ...item,
        percentOfTotal: totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      totalValue,
      byCategory,
      bySupplier,
      stats: {
        totalItems: items.length,
        activeItems,
        zeroStockItems,
      },
    })
  } catch (error) {
    console.error('Error calculating inventory valuation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
