import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MovementType } from '@prisma/client'

// GET /api/stock-movements - List stock movements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bakeryId = searchParams.get('bakeryId')
    const itemId = searchParams.get('itemId')
    const type = searchParams.get('type') as MovementType | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

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

    // Build query filters
    const where: {
      bakeryId: string
      itemId?: string
      type?: MovementType
      createdAt?: { gte?: Date; lte?: Date }
    } = {
      bakeryId,
    }

    if (itemId) {
      where.itemId = itemId
    }

    if (type) {
      where.type = type
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Cap at 100
      include: {
        item: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            unit: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ movements })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock-movements - Create stock movement (also updates inventory)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bakeryId, itemId, type, quantity, unitCost, reason } = body

    // Validate required fields
    if (!bakeryId || !itemId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: bakeryId, itemId, type, quantity' },
        { status: 400 }
      )
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

    // Validate item exists and belongs to bakery
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    })

    if (!item || item.bakeryId !== bakeryId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Validate movement type
    const validTypes: MovementType[] = ['Purchase', 'Usage', 'Waste', 'Adjustment']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid movement type' },
        { status: 400 }
      )
    }

    // Calculate stock change
    let stockChange: number
    if (type === 'Purchase') {
      stockChange = Math.abs(quantity)
    } else if (type === 'Usage' || type === 'Waste') {
      stockChange = -Math.abs(quantity)
    } else {
      stockChange = quantity
    }

    // Get user name for audit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })

    // Create movement and update stock in a transaction
    const [movement, updatedItem] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          bakeryId,
          itemId,
          type: type as MovementType,
          quantity: stockChange,
          unitCost: unitCost || item.unitCostGNF,
          reason: reason || null,
          createdBy: session.user.id,
          createdByName: user?.name || session.user.email || 'Unknown',
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              unit: true,
              category: true,
            },
          },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: {
            increment: stockChange,
          },
          ...(type === 'Purchase' && unitCost && { unitCostGNF: unitCost }),
        },
      }),
    ])

    return NextResponse.json({ movement, updatedStock: updatedItem.currentStock }, { status: 201 })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
