import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reconciliation - List reconciliations for a restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')

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

    // Build query filters
    const where: {
      restaurantId: string
      status?: 'Pending' | 'Approved' | 'Rejected'
    } = {
      restaurantId,
    }

    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      where.status = status as 'Pending' | 'Approved' | 'Rejected'
    }

    const reconciliations = await prisma.stockReconciliation.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                unit: true,
                category: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ reconciliations })
  } catch (error) {
    console.error('Error fetching reconciliations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reconciliation - Create a new stock reconciliation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantId, notes, items } = body

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
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

    // Fetch current stock for all items to calculate variance
    const inventoryItemIds = items.map((item: { inventoryItemId: string }) => item.inventoryItemId)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: inventoryItemIds },
        restaurantId,
        isActive: true,
      },
    })

    // Create lookup map for system stock
    const stockMap = new Map(inventoryItems.map(item => [item.id, item.currentStock]))

    // Validate all items exist
    const missingItems = inventoryItemIds.filter((id: string) => !stockMap.has(id))
    if (missingItems.length > 0) {
      return NextResponse.json({
        error: 'Some inventory items not found',
        missingItems
      }, { status: 400 })
    }

    // Create reconciliation with items
    const reconciliation = await prisma.stockReconciliation.create({
      data: {
        restaurantId,
        submittedBy: session.user.id,
        submittedByName: session.user.name || undefined,
        notes: notes || undefined,
        items: {
          create: items.map((item: { inventoryItemId: string; physicalCount: number }) => {
            const systemStock = stockMap.get(item.inventoryItemId) || 0
            const variance = item.physicalCount - systemStock
            return {
              inventoryItemId: item.inventoryItemId,
              systemStock,
              physicalCount: item.physicalCount,
              variance,
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                unit: true,
                category: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ reconciliation }, { status: 201 })
  } catch (error) {
    console.error('Error creating reconciliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
