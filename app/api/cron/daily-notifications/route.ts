// app/api/cron/daily-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndNotifyLowStock, sendNotification } from '@/lib/notification-service'

// This endpoint should be called by Vercel Cron daily
// See vercel.json configuration
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active restaurants
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    for (const restaurant of restaurants) {
      // Check low stock
      await checkAndNotifyLowStock(restaurant.id)

      // Send daily summary
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [salesData, expensesData] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            restaurantId: restaurant.id,
            date: { gte: today, lt: tomorrow },
            status: 'Approved',
          },
          _sum: { totalGNF: true },
        }),
        prisma.expense.aggregate({
          where: {
            restaurantId: restaurant.id,
            date: { gte: today, lt: tomorrow },
            status: 'Approved',
          },
          _sum: { amountGNF: true },
        }),
      ])

      const totalSales = salesData._sum.totalGNF || 0
      const totalExpenses = expensesData._sum.amountGNF || 0

      await sendNotification({
        restaurantId: restaurant.id,
        type: 'daily_summary',
        data: {
          totalSales,
          totalExpenses,
          profit: totalSales - totalExpenses,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
