import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with their restaurants
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        restaurants: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                location: true,
                restaurantType: true,
                inventoryEnabled: true,
                productionEnabled: true,
                isActive: true,
              },
            },
          },
        },
        defaultRestaurant: {
          select: {
            id: true,
            name: true,
            location: true,
            restaurantType: true,
            inventoryEnabled: true,
            productionEnabled: true,
            isActive: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const restaurants = user.restaurants.map((ur) => ur.restaurant)

    return NextResponse.json({
      restaurants,
      defaultRestaurant: user.defaultRestaurant,
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
