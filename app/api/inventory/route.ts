import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'
import { getExpiryInfo } from '@/lib/inventory-helpers'

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'

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
      isActive: boolean
      category?: string
      name?: { contains: string; mode: 'insensitive' }
      currentStock?: { lt: number } | { lte: number }
    } = {
      restaurantId,
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

    // Fetch last purchase dates for perishable items
    const perishableItemIds = filteredItems
      .filter(item => item.expiryDays && item.expiryDays > 0)
      .map(item => item.id)

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

      // Map itemId to most recent purchase date
      purchaseMovements.forEach(movement => {
        if (!lastPurchaseMap.has(movement.itemId)) {
          lastPurchaseMap.set(movement.itemId, movement.createdAt)
        }
      })
    }

    // Add stock status and expiry info to each item
    const itemsWithStatus = filteredItems.map((item) => {
      const lastPurchaseDate = lastPurchaseMap.get(item.id) || null
      const expiryInfo = item.expiryDays && item.expiryDays > 0
        ? getExpiryInfo(item, lastPurchaseDate)
        : null

      return {
        ...item,
        stockStatus: getStockStatus(item.currentStock, item.minStock),
        expiryStatus: expiryInfo?.status || null,
        expiryDate: expiryInfo?.expiryDate || null,
        daysUntilExpiry: expiryInfo?.daysUntilExpiry || null,
        lastPurchaseDate,
      }
    })

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
      restaurantId,
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

    if (!restaurantId || !name || !category || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, name, category, unit' },
        { status: 400 }
      )
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

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        restaurantId,
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
