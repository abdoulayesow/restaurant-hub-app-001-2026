import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, authorizeRestaurantAccess } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MovementType } from '@prisma/client'
import { sendNotification } from '@/lib/notification-service'
import { canAdjustStock } from '@/lib/roles'

// POST /api/inventory/[id]/adjust - Create stock adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: itemId } = await params

    // Get the inventory item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant and can adjust stock
    // Note: Only Owner and RestaurantManager can directly adjust stock
    // Baker/Cashier affect stock indirectly through production logs and expense payments
    const auth = await authorizeRestaurantAccess(
      session.user.id,
      item.restaurantId,
      canAdjustStock,
      'Only managers can directly adjust stock. Use production logs or expenses instead.'
    )
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { type, quantity, reason, unitCost } = body

    // Validate required fields
    if (!type || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Missing required fields: type, quantity' },
        { status: 400 }
      )
    }

    // Validate movement type
    const validTypes: MovementType[] = ['Purchase', 'Usage', 'Waste', 'Adjustment']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid movement type. Must be: Purchase, Usage, Waste, or Adjustment' },
        { status: 400 }
      )
    }

    // Calculate stock change based on movement type
    // Purchase and positive Adjustment increase stock
    // Usage, Waste, and negative Adjustment decrease stock
    let stockChange: number
    if (type === 'Purchase') {
      stockChange = Math.abs(quantity) // Always positive
    } else if (type === 'Usage' || type === 'Waste') {
      stockChange = -Math.abs(quantity) // Always negative
    } else {
      // Adjustment - can be positive or negative
      stockChange = quantity
    }

    // Validate stock won't go negative
    const newStock = item.currentStock + stockChange
    if (newStock < 0) {
      return NextResponse.json(
        { error: `Insufficient stock. Current: ${item.currentStock} ${item.unit}` },
        { status: 400 }
      )
    }

    // Get user name for audit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })

    // Create movement and update stock in a transaction
    const [movement, updatedItem] = await prisma.$transaction([
      // Create stock movement
      prisma.stockMovement.create({
        data: {
          restaurantId: item.restaurantId,
          itemId,
          type: type as MovementType,
          quantity: stockChange,
          unitCost: unitCost || item.unitCostGNF,
          reason: reason || null,
          createdBy: session.user.id,
          createdByName: user?.name || session.user.email || 'Unknown',
        },
      }),
      // Update inventory stock
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: {
            increment: stockChange,
          },
          // Update unit cost if provided with a purchase
          ...(type === 'Purchase' && unitCost && { unitCostGNF: unitCost }),
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

    // Send SMS notification if stock is low or critical
    if (updatedItem.currentStock <= updatedItem.minStock) {
      const isCritical = updatedItem.currentStock <= updatedItem.minStock * 0.1

      await sendNotification({
        restaurantId: updatedItem.restaurantId,
        type: isCritical ? 'critical_stock' : 'low_stock',
        recipientType: 'manager',
        data: {
          itemName: updatedItem.name,
          currentStock: updatedItem.currentStock,
          unit: updatedItem.unit,
        },
      }).catch(err => console.error('Failed to send stock alert SMS:', err))
    }

    return NextResponse.json({
      movement,
      item: {
        ...updatedItem,
        stockStatus: getStockStatus(updatedItem.currentStock, updatedItem.minStock),
      },
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate stock status
function getStockStatus(current: number, min: number): 'critical' | 'low' | 'ok' {
  if (current <= 0 || (min > 0 && current <= min * 0.1)) return 'critical'
  if (current < min) return 'low'
  return 'ok'
}
