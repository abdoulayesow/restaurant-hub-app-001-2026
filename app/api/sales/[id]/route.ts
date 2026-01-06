import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/sales/[id] - Get a single sale
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

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        bakery: true,
        cashDeposit: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: sale.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ sale })
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/sales/[id] - Update a sale
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

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: existingSale.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isManager = isManagerRole(session.user.role)

    // Editors can only edit Pending sales, Managers can edit any
    if (!isManager && existingSale.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Only pending sales can be edited by non-managers' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      cashGNF,
      orangeMoneyGNF,
      cardGNF,
      itemsCount,
      customersCount,
      receiptUrl,
      openingTime,
      closingTime,
      comments,
    } = body

    // Calculate new total
    const newCashGNF = cashGNF !== undefined ? cashGNF : existingSale.cashGNF
    const newOrangeMoneyGNF = orangeMoneyGNF !== undefined ? orangeMoneyGNF : existingSale.orangeMoneyGNF
    const newCardGNF = cardGNF !== undefined ? cardGNF : existingSale.cardGNF
    const totalGNF = newCashGNF + newOrangeMoneyGNF + newCardGNF

    // Update sale
    const sale = await prisma.sale.update({
      where: { id },
      data: {
        totalGNF,
        cashGNF: newCashGNF,
        orangeMoneyGNF: newOrangeMoneyGNF,
        cardGNF: newCardGNF,
        itemsCount: itemsCount !== undefined ? itemsCount : existingSale.itemsCount,
        customersCount: customersCount !== undefined ? customersCount : existingSale.customersCount,
        receiptUrl: receiptUrl !== undefined ? receiptUrl : existingSale.receiptUrl,
        openingTime: openingTime !== undefined ? openingTime : existingSale.openingTime,
        closingTime: closingTime !== undefined ? closingTime : existingSale.closingTime,
        comments: comments !== undefined ? comments : existingSale.comments,
        // If a non-manager edits, reset to Pending for re-approval
        status: !isManager && existingSale.status === 'Pending' ? 'Pending' : existingSale.status,
        lastModifiedBy: session.user.id,
        lastModifiedByName: session.user.name || session.user.email,
      },
      include: {
        cashDeposit: true,
      },
    })

    return NextResponse.json({ sale })
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: DELETE is intentionally not implemented
// Sales should be rejected, not deleted, for audit trail
