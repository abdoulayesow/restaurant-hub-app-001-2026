import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/restaurants/[id] - Fetch restaurant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: id
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'You do not have access to this restaurant' },
        { status: 403 }
      )
    }

    // Fetch restaurant details
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        openingDate: true,
        trackingStartDate: true,
        initialCapital: true,
        initialCashBalance: true,
        initialOrangeBalance: true,
        initialCardBalance: true,
        contactPhone: true,
        contactEmail: true,
        managerName: true,
        currency: true,
        restaurantType: true,
        inventoryEnabled: true,
        productionEnabled: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/restaurants/[id] - Update restaurant configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user has access to this restaurant AND check Manager role (combined query)
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: id
        }
      },
      include: {
        user: {
          select: { role: true }
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'You do not have access to this restaurant' },
        { status: 403 }
      )
    }

    if (userRestaurant.user.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can update restaurant configuration' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate name only if provided (allow partial updates)
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { error: 'Restaurant name cannot be empty' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (body.contactEmail) {
      const trimmedEmail = body.contactEmail.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate financial fields only if provided
    if (body.initialCapital !== undefined && body.initialCapital < 0) {
      return NextResponse.json(
        { error: 'Initial capital must be positive or zero' },
        { status: 400 }
      )
    }
    if (body.initialCashBalance !== undefined && body.initialCashBalance < 0) {
      return NextResponse.json(
        { error: 'Initial cash balance must be positive or zero' },
        { status: 400 }
      )
    }
    if (body.initialOrangeBalance !== undefined && body.initialOrangeBalance < 0) {
      return NextResponse.json(
        { error: 'Initial Orange Money balance must be positive or zero' },
        { status: 400 }
      )
    }
    if (body.initialCardBalance !== undefined && body.initialCardBalance < 0) {
      return NextResponse.json(
        { error: 'Initial card balance must be positive or zero' },
        { status: 400 }
      )
    }

    // Validate currency if provided
    const VALID_CURRENCIES = ['GNF', 'EUR', 'USD']
    if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Must be GNF, EUR, or USD' },
        { status: 400 }
      )
    }

    // Validate stockDeductionMode if provided
    if (body.stockDeductionMode && !['immediate', 'deferred'].includes(body.stockDeductionMode)) {
      return NextResponse.json(
        { error: 'Invalid stock deduction mode. Must be "immediate" or "deferred"' },
        { status: 400 }
      )
    }

    // Validate dates if provided
    if (body.openingDate) {
      const date = new Date(body.openingDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid openingDate format' },
          { status: 400 }
        )
      }
    }
    if (body.trackingStartDate) {
      const date = new Date(body.trackingStartDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid trackingStartDate format' },
          { status: 400 }
        )
      }
    }

    // Update restaurant with conditional spread pattern
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.location !== undefined && { location: body.location?.trim() || null }),
        ...(body.openingDate !== undefined && {
          openingDate: body.openingDate ? new Date(body.openingDate) : null
        }),
        ...(body.trackingStartDate !== undefined && {
          trackingStartDate: body.trackingStartDate ? new Date(body.trackingStartDate) : null
        }),
        ...(body.initialCapital !== undefined && { initialCapital: body.initialCapital }),
        ...(body.initialCashBalance !== undefined && { initialCashBalance: body.initialCashBalance }),
        ...(body.initialOrangeBalance !== undefined && { initialOrangeBalance: body.initialOrangeBalance }),
        ...(body.initialCardBalance !== undefined && { initialCardBalance: body.initialCardBalance }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone?.trim() || null }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail?.trim() || null }),
        ...(body.managerName !== undefined && { managerName: body.managerName?.trim() || null }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.stockDeductionMode !== undefined && { stockDeductionMode: body.stockDeductionMode }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.restaurantType !== undefined && { restaurantType: body.restaurantType }),
        ...(body.inventoryEnabled !== undefined && { inventoryEnabled: body.inventoryEnabled }),
        ...(body.productionEnabled !== undefined && { productionEnabled: body.productionEnabled })
      },
      select: {
        id: true,
        name: true,
        location: true,
        openingDate: true,
        trackingStartDate: true,
        initialCapital: true,
        initialCashBalance: true,
        initialOrangeBalance: true,
        initialCardBalance: true,
        contactPhone: true,
        contactEmail: true,
        managerName: true,
        currency: true,
        stockDeductionMode: true,
        isActive: true,
        restaurantType: true,
        inventoryEnabled: true,
        productionEnabled: true
      }
    })

    return NextResponse.json({ restaurant: updatedRestaurant })
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/restaurants/[id] - Soft delete a restaurant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user has access to this restaurant AND check Manager role
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: id
        }
      },
      include: {
        user: {
          select: { role: true }
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'You do not have access to this restaurant' },
        { status: 403 }
      )
    }

    if (userRestaurant.user.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can delete restaurants' },
        { status: 403 }
      )
    }

    // Soft delete: set isActive to false
    // Data is preserved and can be restored if needed
    await prisma.restaurant.update({
      where: { id },
      data: {
        isActive: false,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Restaurant has been archived. Data is preserved and can be restored.'
    })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
