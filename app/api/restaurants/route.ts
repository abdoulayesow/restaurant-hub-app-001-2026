import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/restaurants - Create a new restaurant
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only managers can create restaurants
    if (session.user.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can create restaurants' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Restaurant name is required' },
        { status: 400 }
      )
    }

    // Validate restaurant type if provided
    const validTypes = ['Bakery', 'Cafe', 'Restaurant', 'FastFood']
    if (body.restaurantType && !validTypes.includes(body.restaurantType)) {
      return NextResponse.json(
        { error: 'Invalid restaurant type' },
        { status: 400 }
      )
    }

    // Create the restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: body.name.trim(),
        location: body.location?.trim() || null,
        restaurantType: body.restaurantType || 'Bakery',
        inventoryEnabled: true,
        productionEnabled: true,
        isActive: true,
        // Link the creating user to this restaurant
        users: {
          create: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        location: true,
        restaurantType: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Create default payment methods for the new restaurant
    await prisma.paymentMethod.createMany({
      data: [
        {
          restaurantId: restaurant.id,
          name: 'Cash',
          nameFr: 'Espèces',
          type: 'cash',
          icon: 'Banknote',
          color: '#22C55E',
          sortOrder: 0,
        },
        {
          restaurantId: restaurant.id,
          name: 'Orange Money',
          nameFr: 'Orange Money',
          type: 'mobile_money',
          icon: 'Smartphone',
          color: '#F97316',
          sortOrder: 1,
        },
        {
          restaurantId: restaurant.id,
          name: 'Card',
          nameFr: 'Carte',
          type: 'card',
          icon: 'CreditCard',
          color: '#3B82F6',
          sortOrder: 2,
        },
      ],
    })

    return NextResponse.json({ restaurant }, { status: 201 })
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
