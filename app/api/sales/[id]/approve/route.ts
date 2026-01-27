import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'
import { sendNotification } from '@/lib/notification-service'

// POST /api/sales/[id]/approve - Approve or reject a sale (Manager only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers can approve/reject
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingSale.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected'

    // Update sale status
    const sale = await prisma.sale.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: session.user.id,
        approvedByName: session.user.name || session.user.email,
        approvedAt: new Date(),
        // Optionally append rejection reason to comments
        comments: action === 'reject' && reason
          ? `${existingSale.comments ? existingSale.comments + '\n' : ''}[Rejected: ${reason}]`
          : existingSale.comments,
      },
      include: {
        restaurant: true,
        cashDeposit: true,
      },
    })

    // If approved, update daily summary (optional - can be done via cron job)
    if (action === 'approve') {
      const saleDate = new Date(sale.date)
      saleDate.setHours(0, 0, 0, 0)

      await prisma.dailySummary.upsert({
        where: {
          restaurantId_date: {
            restaurantId: sale.restaurantId,
            date: saleDate,
          },
        },
        update: {
          dailyCashSales: sale.cashGNF,
          dailyOrangeSales: sale.orangeMoneyGNF,
          dailyCardSales: sale.cardGNF,
        },
        create: {
          restaurantId: sale.restaurantId,
          date: saleDate,
          dailyCashSales: sale.cashGNF,
          dailyOrangeSales: sale.orangeMoneyGNF,
          dailyCardSales: sale.cardGNF,
        },
      })
    }

    // Send SMS notification to submitter
    if (sale.submittedBy) {
      const notificationType = action === 'approve' ? 'sale_approved' : 'sale_rejected'
      await sendNotification({
        restaurantId: sale.restaurantId,
        type: notificationType,
        recipientUserId: sale.submittedBy,
        data: {
          amount: sale.totalGNF,
          reason: reason || '',
        },
      }).catch(err => console.error('Failed to send SMS notification:', err))
    }

    return NextResponse.json({
      sale,
      message: `Sale ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    console.error('Error approving/rejecting sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
