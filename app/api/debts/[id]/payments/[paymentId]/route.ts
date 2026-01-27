import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// PUT /api/debts/[id]/payments/[paymentId] - Update payment (Manager only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
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
        { error: 'Only managers can update payments' },
        { status: 403 }
      )
    }

    const { id: debtId, paymentId } = await params
    const body = await request.json()

    // Check if payment exists
    const existingPayment = await prisma.debtPayment.findUnique({
      where: { id: paymentId }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify payment belongs to the specified debt
    if (existingPayment.debtId !== debtId) {
      return NextResponse.json(
        { error: 'Payment does not belong to this debt' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingPayment.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Build update data (only allow updating non-critical fields)
    const updateData: Prisma.DebtPaymentUpdateInput = {}

    if (body.receiptNumber !== undefined) {
      updateData.receiptNumber = body.receiptNumber?.trim() || null
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null
    }

    // Update payment
    const payment = await prisma.debtPayment.update({
      where: { id: paymentId },
      data: updateData
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/debts/[id]/payments/[paymentId] - Delete payment (Manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
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
        { error: 'Only managers can delete payments' },
        { status: 403 }
      )
    }

    const { id: debtId, paymentId } = await params

    // Check if payment exists
    const existingPayment = await prisma.debtPayment.findUnique({
      where: { id: paymentId }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify payment belongs to the specified debt
    if (existingPayment.debtId !== debtId) {
      return NextResponse.json(
        { error: 'Payment does not belong to this debt' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingPayment.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Fetch debt to recalculate amounts
    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    })

    if (!debt) {
      return NextResponse.json(
        { error: 'Debt not found' },
        { status: 404 }
      )
    }

    // Use transaction to delete payment and update debt atomically
    await prisma.$transaction(async (tx) => {
      // Delete payment
      await tx.debtPayment.delete({
        where: { id: paymentId }
      })

      // Calculate new debt amounts
      const newPaidAmount = debt.paidAmount - existingPayment.amount
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
        // Check if overdue
        if (debt.dueDate && new Date(debt.dueDate) < new Date()) {
          newStatus = 'Overdue'
        } else {
          newStatus = 'Outstanding'
        }
      }

      // Update debt
      await tx.debt.update({
        where: { id: debtId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus
        }
      })
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
