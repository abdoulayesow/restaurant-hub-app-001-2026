import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/expenses/[id]/payments - List all payments for an expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: expenseId } = await params

    // Fetch expense to check access
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true,
        restaurantId: true,
        amountGNF: true,
        totalPaidAmount: true,
        paymentStatus: true
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: expense.restaurantId
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
    const payments = await prisma.expensePayment.findMany({
      where: { expenseId },
      include: {
        bankTransaction: {
          select: {
            id: true,
            date: true,
            amount: true,
            method: true,
            status: true,
            bankRef: true
          }
        }
      },
      orderBy: { paidAt: 'desc' }
    })

    // Calculate summary
    const summary = {
      totalAmount: expense.amountGNF,
      totalPaid: expense.totalPaidAmount,
      remainingAmount: expense.amountGNF - expense.totalPaidAmount,
      paymentCount: payments.length,
      paymentStatus: expense.paymentStatus
    }

    return NextResponse.json({ payments, summary })
  } catch (error) {
    console.error('Error fetching expense payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/expenses/[id]/payments - Record a payment for an expense
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check manager role - only managers can record payments
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Only managers can record expense payments' },
        { status: 403 }
      )
    }

    const { id: expenseId } = await params

    // Fetch expense
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true,
        restaurantId: true,
        amountGNF: true,
        totalPaidAmount: true,
        paymentStatus: true,
        status: true, // Approval status
        categoryName: true,
        description: true
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: expense.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Validate expense is Approved
    if (expense.status !== 'Approved') {
      return NextResponse.json(
        { error: 'Payment can only be recorded for approved expenses' },
        { status: 400 }
      )
    }

    // Validate expense is not fully paid
    if (expense.paymentStatus === 'Paid') {
      return NextResponse.json(
        { error: 'This expense is already fully paid' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { amount, paymentMethod, notes, receiptUrl } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }

    if (!paymentMethod || !['Cash', 'OrangeMoney', 'Card'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Payment method must be Cash, OrangeMoney, or Card' },
        { status: 400 }
      )
    }

    // Validate amount doesn't exceed remaining balance
    const remainingAmount = expense.amountGNF - expense.totalPaidAmount
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance of ${remainingAmount} GNF` },
        { status: 400 }
      )
    }

    // Get user name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    // Calculate new payment status
    const newTotalPaid = expense.totalPaidAmount + amount
    const newPaymentStatus = newTotalPaid >= expense.amountGNF
      ? 'Paid'
      : newTotalPaid > 0
        ? 'PartiallyPaid'
        : 'Unpaid'

    // Create payment and bank transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create bank transaction (withdrawal)
      const bankTransaction = await tx.bankTransaction.create({
        data: {
          restaurantId: expense.restaurantId,
          date: new Date(),
          amount,
          type: 'Withdrawal',
          method: paymentMethod,
          reason: 'ExpensePayment',
          description: `Payment for expense: ${expense.categoryName}${expense.description ? ` - ${expense.description}` : ''}`,
          status: 'Confirmed', // Expense payments are confirmed immediately
          confirmedAt: new Date(),
          receiptUrl: receiptUrl?.trim() || null,
          createdBy: session.user.id,
          createdByName: user?.name || null
        }
      })

      // Create expense payment
      const payment = await tx.expensePayment.create({
        data: {
          expenseId,
          amount,
          paymentMethod,
          bankTransactionId: bankTransaction.id,
          paidBy: session.user.id,
          paidByName: user?.name || null,
          notes: notes?.trim() || null,
          receiptUrl: receiptUrl?.trim() || null
        },
        include: {
          bankTransaction: {
            select: {
              id: true,
              date: true,
              amount: true,
              method: true,
              status: true
            }
          }
        }
      })

      // Update expense payment tracking
      const updatedExpense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          totalPaidAmount: newTotalPaid,
          paymentStatus: newPaymentStatus,
          fullyPaidAt: newPaymentStatus === 'Paid' ? new Date() : null
        },
        select: {
          id: true,
          amountGNF: true,
          totalPaidAmount: true,
          paymentStatus: true,
          fullyPaidAt: true
        }
      })

      return { payment, expense: updatedExpense, bankTransaction }
    })

    return NextResponse.json({
      payment: result.payment,
      expense: result.expense,
      message: result.expense.paymentStatus === 'Paid'
        ? 'Expense fully paid'
        : `Payment recorded. Remaining: ${result.expense.amountGNF - result.expense.totalPaidAmount} GNF`
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording expense payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
