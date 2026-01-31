import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { canApprove } from '@/lib/roles'

// GET /api/cash-deposits - List sales deposits (via BankTransaction with reason SalesDeposit)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status') // "Pending" | "Confirmed"

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Build where clause for BankTransaction
    const whereClause: Prisma.BankTransactionWhereInput = {
      restaurantId,
      reason: 'SalesDeposit'
    }

    // Map legacy status values for backward compatibility
    if (status === 'Pending') {
      whereClause.status = 'Pending'
    } else if (status === 'Deposited' || status === 'Confirmed') {
      whereClause.status = 'Confirmed'
    }

    // Fetch deposits from BankTransaction
    const transactions = await prisma.bankTransaction.findMany({
      where: whereClause,
      include: {
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Map to legacy deposit format for backward compatibility
    const deposits = transactions.map(tx => ({
      id: tx.id,
      restaurantId: tx.restaurantId,
      date: tx.date,
      amount: tx.amount,
      status: tx.status === 'Confirmed' ? 'Deposited' : 'Pending',
      bankRef: tx.bankRef,
      receiptUrl: tx.receiptUrl,
      comments: tx.comments,
      depositedBy: tx.createdBy,
      depositedByName: tx.createdByName,
      depositedAt: tx.confirmedAt,
      saleId: tx.saleId,
      sale: tx.sale,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    }))

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error('Error fetching cash deposits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cash-deposits - Create new sales deposit (as BankTransaction)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user name for record keeping
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    const body = await request.json()

    // Validate required fields
    if (!body.restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant and check role
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: body.restaurantId
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
        { error: 'Only owners can create cash deposits' },
        { status: 403 }
      )
    }

    // If saleId provided, check it's not already linked to another deposit
    if (body.saleId) {
      const existingDeposit = await prisma.bankTransaction.findFirst({
        where: { saleId: body.saleId }
      })

      if (existingDeposit) {
        return NextResponse.json(
          { error: 'This sale is already linked to another deposit' },
          { status: 400 }
        )
      }
    }

    // Parse date
    const depositDate = new Date(body.date)
    if (isNaN(depositDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Create deposit as BankTransaction
    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        restaurantId: body.restaurantId,
        date: depositDate,
        amount: body.amount,
        type: 'Deposit',
        method: 'Cash',
        reason: 'SalesDeposit',
        status: 'Pending',
        saleId: body.saleId || null,
        bankRef: body.bankRef?.trim() || null,
        receiptUrl: body.receiptUrl?.trim() || null,
        comments: body.comments?.trim() || null,
        createdBy: session.user.id,
        createdByName: user?.name || null
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

    // Map to legacy deposit format for backward compatibility
    const deposit = {
      id: bankTransaction.id,
      restaurantId: bankTransaction.restaurantId,
      date: bankTransaction.date,
      amount: bankTransaction.amount,
      status: 'Pending',
      bankRef: bankTransaction.bankRef,
      receiptUrl: bankTransaction.receiptUrl,
      comments: bankTransaction.comments,
      depositedBy: bankTransaction.createdBy,
      depositedByName: bankTransaction.createdByName,
      depositedAt: bankTransaction.confirmedAt,
      saleId: bankTransaction.saleId,
      sale: bankTransaction.sale,
      createdAt: bankTransaction.createdAt,
      updatedAt: bankTransaction.updatedAt
    }

    return NextResponse.json({ deposit }, { status: 201 })
  } catch (error) {
    console.error('Error creating cash deposit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
