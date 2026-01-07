import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/inventory/[id] - Get single inventory item with recent movements
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            quantity: true,
            unitCost: true,
            reason: true,
            createdBy: true,
            createdByName: true,
            createdAt: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: item.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Add stock status
    const itemWithStatus = {
      ...item,
      stockStatus: getStockStatus(item.currentStock, item.minStock),
    }

    return NextResponse.json({ item: itemWithStatus })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/inventory/[id] - Update inventory item (Manager only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Manager role required' }, { status: 403 })
    }

    const { id } = await params

    // First, get the existing item to check restaurant access
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingItem.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      nameFr,
      category,
      unit,
      minStock,
      reorderPoint,
      unitCostGNF,
      supplierId,
      expiryDays,
    } = body

    // Update item (don't allow direct currentStock changes - use adjust route)
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameFr !== undefined && { nameFr }),
        ...(category !== undefined && { category }),
        ...(unit !== undefined && { unit }),
        ...(minStock !== undefined && { minStock }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(unitCostGNF !== undefined && { unitCostGNF }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(expiryDays !== undefined && { expiryDays: expiryDays || null }),
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

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/inventory/[id] - Soft delete inventory item (Manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Manager role required' }, { status: 403 })
    }

    const { id } = await params

    // First, get the existing item to check restaurant access
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingItem.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by setting isActive to false
    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate stock status
function getStockStatus(current: number, min: number): 'critical' | 'low' | 'ok' {
  if (current <= 0 || (min > 0 && current <= min * 0.1)) return 'critical'
  if (current < min) return 'low'
  return 'ok'
}
