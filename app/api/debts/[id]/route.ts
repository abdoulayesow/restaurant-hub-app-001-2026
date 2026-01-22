import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/debts/[id] - Get debt details with payment history
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

    // Fetch debt with full details
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            company: true,
            customerType: true,
            creditLimit: true
          }
        },
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true,
            cashGNF: true,
            orangeMoneyGNF: true,
            cardGNF: true,
            status: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
            receiptNumber: true,
            notes: true,
            receivedBy: true,
            receivedByName: true,
            createdAt: true
          },
          orderBy: {
            paymentDate: 'desc'
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

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Error fetching debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/debts/[id] - Update debt (Manager only)
export async function PUT(
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
        { error: 'Only managers can update debts' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if debt exists
    const existingDebt = await prisma.debt.findUnique({
      where: { id },
      include: {
        payments: true
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

    // Validate principal amount if being updated
    if (body.principalAmount !== undefined) {
      if (body.principalAmount <= 0) {
        return NextResponse.json(
          { error: 'principalAmount must be greater than 0' },
          { status: 400 }
        )
      }

      // Ensure new principal amount is not less than already paid amount
      if (body.principalAmount < existingDebt.paidAmount) {
        return NextResponse.json(
          {
            error: `Cannot set principal amount (${body.principalAmount} GNF) lower than already paid amount (${existingDebt.paidAmount} GNF)`
          },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Prisma.DebtUpdateInput = {}

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null
    }

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }

    if (body.principalAmount !== undefined) {
      updateData.principalAmount = body.principalAmount
      updateData.remainingAmount = body.principalAmount - existingDebt.paidAmount
    }

    // Update debt
    const debt = await prisma.debt.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Error updating debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/debts/[id] - Delete debt (Manager only, only if no payments)
export async function DELETE(
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
        { error: 'Only managers can delete debts' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if debt exists
    const existingDebt = await prisma.debt.findUnique({
      where: { id },
      include: {
        payments: true
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

    // Prevent deleting debt with payments
    if (existingDebt.payments.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete debt with ${existingDebt.payments.length} payment(s). Please delete payments first or use write-off.`
        },
        { status: 400 }
      )
    }

    // Delete debt
    await prisma.debt.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Debt deleted successfully' })
  } catch (error) {
    console.error('Error deleting debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
