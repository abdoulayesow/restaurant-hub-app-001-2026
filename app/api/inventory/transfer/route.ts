import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/inventory/transfer - Create a new inventory transfer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sourceRestaurantId,
      targetRestaurantId,
      sourceItemId,
      targetItemId,
      quantity,
      reason,
    } = body

    // Validate required fields
    if (!sourceRestaurantId || !targetRestaurantId || !sourceItemId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (sourceRestaurantId === targetRestaurantId) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same restaurant' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Verify user has access to both restaurants
    const userRestaurants = await prisma.userRestaurant.findMany({
      where: {
        userId: session.user.id,
        restaurantId: { in: [sourceRestaurantId, targetRestaurantId] },
      },
    })

    if (userRestaurants.length !== 2) {
      return NextResponse.json(
        { error: 'You do not have access to both restaurants' },
        { status: 403 }
      )
    }

    // Get source item
    const sourceItem = await prisma.inventoryItem.findUnique({
      where: { id: sourceItemId },
    })

    if (!sourceItem || sourceItem.restaurantId !== sourceRestaurantId) {
      return NextResponse.json(
        { error: 'Source item not found' },
        { status: 404 }
      )
    }

    if (sourceItem.currentStock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock in source restaurant' },
        { status: 400 }
      )
    }

    // Get or create target item
    let finalTargetItemId = targetItemId

    if (!finalTargetItemId) {
      // Look for matching item in target restaurant by name and category
      const existingTargetItem = await prisma.inventoryItem.findFirst({
        where: {
          restaurantId: targetRestaurantId,
          name: sourceItem.name,
          category: sourceItem.category,
          isActive: true,
        },
      })

      if (existingTargetItem) {
        finalTargetItemId = existingTargetItem.id
      } else {
        // Create new item in target restaurant
        const newTargetItem = await prisma.inventoryItem.create({
          data: {
            restaurantId: targetRestaurantId,
            name: sourceItem.name,
            nameFr: sourceItem.nameFr,
            category: sourceItem.category,
            unit: sourceItem.unit,
            currentStock: 0,
            minStock: sourceItem.minStock,
            reorderPoint: sourceItem.reorderPoint,
            unitCostGNF: sourceItem.unitCostGNF,
            expiryDays: sourceItem.expiryDays,
            isActive: true,
          },
        })
        finalTargetItemId = newTargetItem.id
      }
    }

    // Get restaurant names for the reason text
    const [sourceRestaurant, targetRestaurant] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: sourceRestaurantId },
        select: { name: true },
      }),
      prisma.restaurant.findUnique({
        where: { id: targetRestaurantId },
        select: { name: true },
      }),
    ])

    // Execute transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the transfer record
      const transfer = await tx.inventoryTransfer.create({
        data: {
          sourceRestaurantId,
          targetRestaurantId,
          sourceItemId,
          targetItemId: finalTargetItemId,
          quantity,
          reason,
          createdBy: session.user.id,
          createdByName: session.user.name || session.user.email,
        },
      })

      // Build reason text with restaurant names
      const transferOutReason = reason
        ? `→ ${targetRestaurant?.name}: ${reason}`
        : `→ ${targetRestaurant?.name}`
      const transferInReason = reason
        ? `← ${sourceRestaurant?.name}: ${reason}`
        : `← ${sourceRestaurant?.name}`

      // 2. Create TransferOut movement (decreases source stock)
      await tx.stockMovement.create({
        data: {
          restaurantId: sourceRestaurantId,
          itemId: sourceItemId,
          type: 'TransferOut',
          quantity: -quantity, // Negative to decrease stock
          reason: transferOutReason,
          createdBy: session.user.id,
          createdByName: session.user.name || session.user.email,
        },
      })

      // 3. Update source item stock
      const updatedSourceItem = await tx.inventoryItem.update({
        where: { id: sourceItemId },
        data: {
          currentStock: { decrement: quantity },
        },
      })

      // 4. Create TransferIn movement (increases target stock)
      await tx.stockMovement.create({
        data: {
          restaurantId: targetRestaurantId,
          itemId: finalTargetItemId!,
          type: 'TransferIn',
          quantity: quantity, // Positive to increase stock
          unitCost: sourceItem.unitCostGNF,
          reason: transferInReason,
          createdBy: session.user.id,
          createdByName: session.user.name || session.user.email,
        },
      })

      // 5. Update target item stock
      const updatedTargetItem = await tx.inventoryItem.update({
        where: { id: finalTargetItemId! },
        data: {
          currentStock: { increment: quantity },
        },
      })

      return {
        transfer,
        sourceItem: updatedSourceItem,
        targetItem: updatedTargetItem,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    )
  }
}

// GET /api/inventory/transfer - Get transfer history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get transfers where this restaurant is source or target
    const transfers = await prisma.inventoryTransfer.findMany({
      where: {
        OR: [
          { sourceRestaurantId: restaurantId },
          { targetRestaurantId: restaurantId },
        ],
      },
      include: {
        sourceRestaurant: { select: { id: true, name: true } },
        targetRestaurant: { select: { id: true, name: true } },
        sourceItem: { select: { id: true, name: true, unit: true } },
        targetItem: { select: { id: true, name: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ transfers })
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}
