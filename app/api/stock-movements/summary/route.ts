import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MovementType, Prisma } from '@prisma/client'

// GET /api/stock-movements/summary - Get aggregated stock movement statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const itemId = searchParams.get('itemId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build filter conditions
    const whereConditions: Prisma.StockMovementWhereInput = {
      restaurantId: restaurantId,
    }

    if (itemId) {
      whereConditions.itemId = itemId
    }

    if (startDate || endDate) {
      whereConditions.createdAt = {}
      if (startDate) {
        whereConditions.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereConditions.createdAt.lte = new Date(endDate)
      }
    }

    // Fetch all movements matching the filter
    const movements = await prisma.stockMovement.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'asc' },
    })

    // Calculate aggregations
    let totalPurchases = 0
    let totalUsage = 0
    let totalWaste = 0
    let totalAdjustments = 0
    let totalCost = 0
    let costCount = 0

    const movementsByType: Record<
      MovementType,
      { type: MovementType; count: number; totalQuantity: number }
    > = {
      Purchase: { type: 'Purchase', count: 0, totalQuantity: 0 },
      Usage: { type: 'Usage', count: 0, totalQuantity: 0 },
      Waste: { type: 'Waste', count: 0, totalQuantity: 0 },
      Adjustment: { type: 'Adjustment', count: 0, totalQuantity: 0 },
    }

    movements.forEach((movement) => {
      const absQuantity = Math.abs(movement.quantity)

      // Update type-specific counters
      movementsByType[movement.type].count++
      movementsByType[movement.type].totalQuantity += absQuantity

      // Update totals
      switch (movement.type) {
        case 'Purchase':
          totalPurchases += absQuantity
          break
        case 'Usage':
          totalUsage += absQuantity
          break
        case 'Waste':
          totalWaste += absQuantity
          break
        case 'Adjustment':
          totalAdjustments += absQuantity
          break
      }

      // Track costs for average calculation
      if (movement.unitCost !== null && movement.unitCost !== undefined) {
        totalCost += movement.unitCost * absQuantity
        costCount += absQuantity
      }
    })

    // Calculate net change (purchases and positive adjustments add, usage and waste subtract)
    const netChange = totalPurchases + totalAdjustments - totalUsage - totalWaste

    // Calculate average cost
    const averageCost = costCount > 0 ? totalCost / costCount : 0

    return NextResponse.json({
      totalPurchases,
      totalUsage,
      totalWaste,
      totalAdjustments,
      netChange,
      averageCost: Math.round(averageCost * 100) / 100, // Round to 2 decimal places
      movementsByType: Object.values(movementsByType),
      totalMovements: movements.length,
    })
  } catch (error) {
    console.error('Error fetching stock movement summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movement summary' },
      { status: 500 }
    )
  }
}
