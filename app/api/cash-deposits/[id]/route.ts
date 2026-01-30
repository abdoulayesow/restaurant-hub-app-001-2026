import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// PUT /api/cash-deposits/[id] - Update deposit status (mark as confirmed)
// Now uses BankTransaction instead of CashDeposit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if bank transaction exists
    const existingTransaction = await prisma.bankTransaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this restaurant and check role
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingTransaction.restaurantId
        }
      },
      select: { role: true }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    if (!canApprove(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can update cash deposits' },
        { status: 403 }
      )
    }

    // Validate status - map legacy values
    let newStatus = body.status
    if (newStatus === 'Deposited') {
      newStatus = 'Confirmed' // Map legacy status
    }
    if (newStatus && newStatus !== 'Pending' && newStatus !== 'Confirmed') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "Pending" or "Confirmed"' },
        { status: 400 }
      )
    }

    // Parse confirmedAt if provided (legacy: depositedAt)
    let confirmedAt = existingTransaction.confirmedAt
    if (body.depositedAt || body.confirmedAt) {
      confirmedAt = new Date(body.depositedAt || body.confirmedAt)
      if (isNaN(confirmedAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }
    }

    // If marking as Confirmed, set confirmedAt to now if not provided
    if (newStatus === 'Confirmed' && !confirmedAt) {
      confirmedAt = new Date()
    }

    // Update bank transaction
    const transaction = await prisma.bankTransaction.update({
      where: { id },
      data: {
        status: newStatus || existingTransaction.status,
        bankRef: body.bankRef?.trim() || existingTransaction.bankRef,
        receiptUrl: body.receiptUrl?.trim() || existingTransaction.receiptUrl,
        confirmedAt: confirmedAt,
        comments: body.comments?.trim() || existingTransaction.comments,
      },
      include: {
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        }
      }
    })

    // Return in legacy format for backward compatibility
    return NextResponse.json({
      deposit: {
        id: transaction.id,
        restaurantId: transaction.restaurantId,
        date: transaction.date,
        amount: transaction.amount,
        status: transaction.status === 'Confirmed' ? 'Deposited' : 'Pending',
        bankRef: transaction.bankRef,
        receiptUrl: transaction.receiptUrl,
        comments: transaction.comments,
        depositedAt: transaction.confirmedAt,
        depositedBy: transaction.createdBy,
        depositedByName: transaction.createdByName,
        saleId: transaction.saleId,
        sale: transaction.sale,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }
    })
  } catch (error) {
    console.error('Error updating cash deposit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
