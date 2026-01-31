import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// GET /api/restaurant/settings - Fetch restaurant settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

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

    // Fetch restaurant settings
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        stockDeductionMode: true,
        restaurantType: true,
        inventoryEnabled: true,
        productionEnabled: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      stockDeductionMode: restaurant.stockDeductionMode,
      restaurantType: restaurant.restaurantType,
      inventoryEnabled: restaurant.inventoryEnabled,
      productionEnabled: restaurant.productionEnabled,
    })
  } catch (error) {
    console.error('Error fetching restaurant settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/restaurant/settings - Update restaurant settings (Manager only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantId, stockDeductionMode } = body

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    if (!stockDeductionMode) {
      return NextResponse.json(
        { error: 'Stock deduction mode is required' },
        { status: 400 }
      )
    }

    // Validate stock deduction mode
    if (!['immediate', 'deferred'].includes(stockDeductionMode)) {
      return NextResponse.json(
        { error: 'Invalid stock deduction mode. Must be "immediate" or "deferred"' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant and check role
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: restaurantId,
        },
      },
      select: { role: true },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!canApprove(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can update restaurant settings' },
        { status: 403 }
      )
    }

    // Update restaurant settings
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { stockDeductionMode },
      select: {
        id: true,
        name: true,
        stockDeductionMode: true,
        restaurantType: true,
        inventoryEnabled: true,
        productionEnabled: true,
      },
    })

    return NextResponse.json({
      message: 'Restaurant settings updated successfully',
      restaurant: {
        restaurantId: updatedRestaurant.id,
        restaurantName: updatedRestaurant.name,
        stockDeductionMode: updatedRestaurant.stockDeductionMode,
        restaurantType: updatedRestaurant.restaurantType,
        inventoryEnabled: updatedRestaurant.inventoryEnabled,
        productionEnabled: updatedRestaurant.productionEnabled,
      },
    })
  } catch (error) {
    console.error('Error updating restaurant settings:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant settings' },
      { status: 500 }
    )
  }
}
