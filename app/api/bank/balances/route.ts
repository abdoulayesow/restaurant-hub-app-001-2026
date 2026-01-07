import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/bank/balances - Get current balances for a bakery
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

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Fetch latest DailySummary for bakery
    const latestSummary = await prisma.dailySummary.findFirst({
      where: { restaurantId },
      orderBy: { date: 'desc' },
      select: {
        cumulativeCashBalance: true,
        cumulativeOrangeBalance: true,
        cumulativeCardBalance: true,
        date: true
      }
    })

    // If no daily summary exists, fallback to restaurant initial balances
    if (!latestSummary) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          restaurantType: true,
          initialCashBalance: true,
          initialOrangeBalance: true,
          initialCardBalance: true
        }
      })

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        )
      }

      const total = restaurant.initialCashBalance + restaurant.initialOrangeBalance + restaurant.initialCardBalance

      return NextResponse.json({
        balances: {
          cash: restaurant.initialCashBalance,
          orangeMoney: restaurant.initialOrangeBalance,
          card: restaurant.initialCardBalance,
          total,
          asOfDate: null
        }
      })
    }

    // Return balances from latest daily summary
    const total = latestSummary.cumulativeCashBalance +
                  latestSummary.cumulativeOrangeBalance +
                  latestSummary.cumulativeCardBalance

    return NextResponse.json({
      balances: {
        cash: latestSummary.cumulativeCashBalance,
        orangeMoney: latestSummary.cumulativeOrangeBalance,
        card: latestSummary.cumulativeCardBalance,
        total,
        asOfDate: latestSummary.date.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching bank balances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
