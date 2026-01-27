import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/debts/[id]/write-off - Write off debt as bad debt (Manager only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can write off debts' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if debt exists
    const existingDebt = await prisma.debt.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!existingDebt) {
      return NextResponse.json(
        { error: 'Debt not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingDebt.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Prevent writing off already fully paid debt
    if (existingDebt.status === 'FullyPaid') {
      return NextResponse.json(
        { error: 'Cannot write off a fully paid debt' },
        { status: 400 }
      )
    }

    // Prevent writing off already written-off debt
    if (existingDebt.status === 'WrittenOff') {
      return NextResponse.json(
        { error: 'Debt is already written off' },
        { status: 400 }
      )
    }

    // Update debt to WrittenOff status
    const debt = await prisma.debt.update({
      where: { id },
      data: {
        status: 'WrittenOff',
        notes: body.reason
          ? `${existingDebt.notes ? existingDebt.notes + '\n\n' : ''}Write-off reason: ${body.reason.trim()}`
          : existingDebt.notes
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            customerType: true
          }
        },
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
            receiptNumber: true,
            receivedByName: true,
            createdAt: true
          },
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    })

    return NextResponse.json({
      debt,
      message: `Debt written off successfully. Remaining amount of ${existingDebt.remainingAmount} GNF marked as bad debt.`
    })
  } catch (error) {
    console.error('Error writing off debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
