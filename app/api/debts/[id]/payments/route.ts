import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/debts/[id]/payments - List payments for a debt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if debt exists and get restaurant ID
    const debt = await prisma.debt.findUnique({
      where: { id },
      select: { restaurantId: true }
    })

    if (!debt) {
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
          restaurantId: debt.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Fetch payments
    const payments = await prisma.debtPayment.findMany({
      where: { debtId: id },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/debts/[id]/payments - Record payment for a debt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Editor or Manager role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true }
    })

    if (!user || (user.role !== 'Manager' && user.role !== 'Editor')) {
      return NextResponse.json(
        { error: 'Only managers and editors can record payments' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      )
    }

    if (!body.paymentMethod || !body.paymentMethod.trim()) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }

    if (!body.paymentDate) {
      return NextResponse.json(
        { error: 'Payment date is required' },
        { status: 400 }
      )
    }

    // Fetch debt with restaurant check
    const debt = await prisma.debt.findUnique({
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

    if (!debt) {
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
          restaurantId: debt.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Validate payment amount doesn't exceed remaining amount
    if (body.amount > debt.remainingAmount) {
      return NextResponse.json(
        {
          error: `Payment amount (${body.amount} GNF) exceeds remaining debt (${debt.remainingAmount} GNF)`
        },
        { status: 400 }
      )
    }

    // Prevent payments on written-off debts
    if (debt.status === 'WrittenOff') {
      return NextResponse.json(
        { error: 'Cannot record payment for a written-off debt' },
        { status: 400 }
      )
    }

    // Use transaction to create payment and update debt atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.debtPayment.create({
        data: {
          restaurantId: debt.restaurantId,
          debtId: id,
          customerId: debt.customerId,
          amount: body.amount,
          paymentMethod: body.paymentMethod.trim(),
          paymentDate: new Date(body.paymentDate),
          receiptNumber: body.receiptNumber?.trim() || null,
          notes: body.notes?.trim() || null,
          receivedBy: session.user.id,
          receivedByName: user.name || null
        }
      })

      // Calculate new debt amounts
      const newPaidAmount = debt.paidAmount + body.amount
      const newRemainingAmount = debt.principalAmount - newPaidAmount

      // Determine new status
      let newStatus: 'Outstanding' | 'PartiallyPaid' | 'FullyPaid' | 'Overdue'
      if (newRemainingAmount === 0) {
        newStatus = 'FullyPaid'
      } else if (newPaidAmount > 0) {
        // Check if overdue
        if (debt.dueDate && new Date(debt.dueDate) < new Date()) {
          newStatus = 'Overdue'
        } else {
          newStatus = 'PartiallyPaid'
        }
      } else {
        newStatus = 'Outstanding'
      }

      // Update debt
      const updatedDebt = await tx.debt.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus
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

      return { payment, debt: updatedDebt }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
