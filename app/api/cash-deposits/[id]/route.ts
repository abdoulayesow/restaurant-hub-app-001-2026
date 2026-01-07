import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/cash-deposits/[id] - Update deposit status (mark as deposited)
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
        { error: 'Only managers can update cash deposits' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if deposit exists
    const existingDeposit = await prisma.cashDeposit.findUnique({
      where: { id }
    })

    if (!existingDeposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: existingDeposit.bakeryId
        }
      }
    })

    if (!userBakery) {
      return NextResponse.json(
        { error: 'Access denied to this bakery' },
        { status: 403 }
      )
    }

    // Validate status
    if (body.status && body.status !== 'Pending' && body.status !== 'Deposited') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "Pending" or "Deposited"' },
        { status: 400 }
      )
    }

    // Parse depositedAt if provided
    let depositedAt = existingDeposit.depositedAt
    if (body.depositedAt) {
      depositedAt = new Date(body.depositedAt)
      if (isNaN(depositedAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid depositedAt date format' },
          { status: 400 }
        )
      }
    }

    // If marking as Deposited, set depositedAt to now if not provided
    if (body.status === 'Deposited' && !depositedAt) {
      depositedAt = new Date()
    }

    // Update deposit
    const deposit = await prisma.cashDeposit.update({
      where: { id },
      data: {
        status: body.status || existingDeposit.status,
        bankRef: body.bankRef?.trim() || existingDeposit.bankRef,
        receiptUrl: body.receiptUrl?.trim() || existingDeposit.receiptUrl,
        depositedAt: depositedAt
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

    return NextResponse.json({ deposit })
  } catch (error) {
    console.error('Error updating cash deposit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
