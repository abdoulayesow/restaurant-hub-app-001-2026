import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bakeryId = searchParams.get('bakeryId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'

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
      isActive: boolean
      category?: string
      name?: { contains: string; mode: 'insensitive' }
      currentStock?: { lt: number } | { lte: number }
    } = {
      bakeryId,
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Fetch items
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Filter low stock items in memory (need to compare with minStock)
    let filteredItems = items
    if (lowStock) {
      filteredItems = items.filter((item) => item.currentStock < item.minStock)
    }

    // Add stock status to each item
    const itemsWithStatus = filteredItems.map((item) => ({
      ...item,
      stockStatus: getStockStatus(item.currentStock, item.minStock),
    }))

    return NextResponse.json({ items: itemsWithStatus })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory - Create new inventory item (Manager only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Manager role required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      bakeryId,
      name,
      nameFr,
      category,
      unit,
      currentStock = 0,
      minStock = 0,
      reorderPoint = 0,
      unitCostGNF = 0,
      supplierId,
      expiryDays,
    } = body

    if (!bakeryId || !name || !category || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: bakeryId, name, category, unit' },
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

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        bakeryId,
        name,
        nameFr,
        category,
        unit,
        currentStock,
        minStock,
        reorderPoint,
        unitCostGNF,
        supplierId: supplierId || null,
        expiryDays: expiryDays || null,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate stock status
function getStockStatus(current: number, min: number): 'critical' | 'low' | 'ok' {
  if (current <= 0 || (min > 0 && current <= min * 0.1)) return 'critical'
  if (current < min) return 'low'
  return 'ok'
}
