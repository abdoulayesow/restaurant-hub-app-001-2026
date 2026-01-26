import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/bank/transactions/[id] - Get a single bank transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Only managers can access bank transactions' },
        { status: 403 }
      )
    }

    const { id } = await params

    const transaction = await prisma.bankTransaction.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        },
        debtPayment: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            debt: {
              select: {
                id: true,
                customer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        expensePayment: {
          select: {
            id: true,
            amount: true,
            paidAt: true,
            expense: {
              select: {
                id: true,
                categoryName: true,
                amountGNF: true,
                description: true
              }
            }
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: transaction.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error fetching bank transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/bank/transactions/[id] - Update a bank transaction (confirm, add bank ref, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Only managers can update bank transactions' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existingTransaction = await prisma.bankTransaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingTransaction.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      status,
      bankRef,
      receiptUrl,
      comments,
      description
    } = body

    // Prepare update data
    const updateData: {
      status?: 'Pending' | 'Confirmed'
      confirmedAt?: Date | null
      bankRef?: string | null
      receiptUrl?: string | null
      comments?: string | null
      description?: string | null
    } = {}

    // Handle status change
    if (status !== undefined) {
      if (status !== 'Pending' && status !== 'Confirmed') {
        return NextResponse.json(
          { error: 'Status must be Pending or Confirmed' },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set confirmedAt when confirming
      if (status === 'Confirmed' && existingTransaction.status !== 'Confirmed') {
        updateData.confirmedAt = new Date()
      } else if (status === 'Pending') {
        updateData.confirmedAt = null
      }
    }

    // Handle optional field updates
    if (bankRef !== undefined) {
      updateData.bankRef = bankRef?.trim() || null
    }

    if (receiptUrl !== undefined) {
      updateData.receiptUrl = receiptUrl?.trim() || null
    }

    if (comments !== undefined) {
      updateData.comments = comments?.trim() || null
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    // Update transaction
    const transaction = await prisma.bankTransaction.update({
      where: { id },
      data: updateData,
      include: {
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        },
        debtPayment: {
          select: {
            id: true,
            amount: true,
            paymentDate: true
          }
        },
        expensePayment: {
          select: {
            id: true,
            amount: true,
            expense: {
              select: {
                id: true,
                categoryName: true,
                amountGNF: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error updating bank transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
