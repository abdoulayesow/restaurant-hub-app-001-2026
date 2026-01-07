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
    const bakeryId = searchParams.get('bakeryId')

    if (!bakeryId) {
      return NextResponse.json(
        { error: 'Bakery ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: bakeryId
        }
      }
    })

    if (!userBakery) {
      return NextResponse.json(
        { error: 'Access denied to this bakery' },
        { status: 403 }
      )
    }

    // Fetch latest DailySummary for bakery
    const latestSummary = await prisma.dailySummary.findFirst({
      where: { bakeryId },
      orderBy: { date: 'desc' },
      select: {
        cumulativeCashBalance: true,
        cumulativeOrangeBalance: true,
        cumulativeCardBalance: true,
        date: true
      }
    })

    // If no daily summary exists, fallback to bakery initial balances
    if (!latestSummary) {
      const bakery = await prisma.bakery.findUnique({
        where: { id: bakeryId },
        select: {
          initialCashBalance: true,
          initialOrangeBalance: true,
          initialCardBalance: true
        }
      })

      if (!bakery) {
        return NextResponse.json(
          { error: 'Bakery not found' },
          { status: 404 }
        )
      }

      const total = bakery.initialCashBalance + bakery.initialOrangeBalance + bakery.initialCardBalance

      return NextResponse.json({
        balances: {
          cash: bakery.initialCashBalance,
          orangeMoney: bakery.initialOrangeBalance,
          card: bakery.initialCardBalance,
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
