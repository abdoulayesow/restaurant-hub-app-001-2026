import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessBank } from '@/lib/roles'
import { Prisma } from '@prisma/client'

// GET /api/bank/transactions - List bank transactions for a restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const type = searchParams.get('type') // Deposit | Withdrawal
    const method = searchParams.get('method') // Cash | OrangeMoney | Card
    const status = searchParams.get('status') // Pending | Confirmed
    const reason = searchParams.get('reason') // SalesDeposit | DebtCollection | ExpensePayment | OwnerWithdrawal | CapitalInjection | Other
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Check owner role for bank access
    if (!canAccessBank(session.user.role)) {
      return NextResponse.json(
        { error: 'Only owners can access bank transactions' },
        { status: 403 }
      )
    }

    // Build where clause
    const whereClause: Prisma.BankTransactionWhereInput = { restaurantId }

    if (type === 'Deposit' || type === 'Withdrawal') {
      whereClause.type = type
    }

    if (method === 'Cash' || method === 'OrangeMoney' || method === 'Card') {
      whereClause.method = method
    }

    if (status === 'Pending' || status === 'Confirmed') {
      whereClause.status = status
    }

    if (reason) {
      const validReasons = ['SalesDeposit', 'DebtCollection', 'ExpensePayment', 'OwnerWithdrawal', 'CapitalInjection', 'Other']
      if (validReasons.includes(reason)) {
        whereClause.reason = reason as Prisma.EnumTransactionReasonFilter
      }
    }

    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    }

    // Fetch transactions
    const transactions = await prisma.bankTransaction.findMany({
      where: whereClause,
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
      },
      orderBy: { date: 'desc' }
    })

    // Calculate summary
    const summary = {
      totalDeposits: transactions
        .filter(t => t.type === 'Deposit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: transactions
        .filter(t => t.type === 'Withdrawal')
        .reduce((sum, t) => sum + t.amount, 0),
      pendingCount: transactions.filter(t => t.status === 'Pending').length,
      confirmedCount: transactions.filter(t => t.status === 'Confirmed').length,
      byMethod: {
        cash: {
          deposits: transactions
            .filter(t => t.type === 'Deposit' && t.method === 'Cash')
            .reduce((sum, t) => sum + t.amount, 0),
          withdrawals: transactions
            .filter(t => t.type === 'Withdrawal' && t.method === 'Cash')
            .reduce((sum, t) => sum + t.amount, 0)
        },
        orangeMoney: {
          deposits: transactions
            .filter(t => t.type === 'Deposit' && t.method === 'OrangeMoney')
            .reduce((sum, t) => sum + t.amount, 0),
          withdrawals: transactions
            .filter(t => t.type === 'Withdrawal' && t.method === 'OrangeMoney')
            .reduce((sum, t) => sum + t.amount, 0)
        },
        card: {
          deposits: transactions
            .filter(t => t.type === 'Deposit' && t.method === 'Card')
            .reduce((sum, t) => sum + t.amount, 0),
          withdrawals: transactions
            .filter(t => t.type === 'Withdrawal' && t.method === 'Card')
            .reduce((sum, t) => sum + t.amount, 0)
        }
      }
    }

    return NextResponse.json({ transactions, summary })
  } catch (error) {
    console.error('Error fetching bank transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bank/transactions - Create a new bank transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check owner role for bank access
    if (!canAccessBank(session.user.role)) {
      return NextResponse.json(
        { error: 'Only owners can create bank transactions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      restaurantId,
      date,
      amount,
      type,
      method,
      reason,
      description,
      bankRef,
      receiptUrl,
      comments,
      saleId,
      debtPaymentId
    } = body

    // Validate required fields
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }

    if (!type || (type !== 'Deposit' && type !== 'Withdrawal')) {
      return NextResponse.json(
        { error: 'Type must be Deposit or Withdrawal' },
        { status: 400 }
      )
    }

    if (!method || !['Cash', 'OrangeMoney', 'Card'].includes(method)) {
      return NextResponse.json(
        { error: 'Method must be Cash, OrangeMoney, or Card' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    const validReasons = ['SalesDeposit', 'DebtCollection', 'ExpensePayment', 'OwnerWithdrawal', 'CapitalInjection', 'Other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
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

    // If saleId provided, verify it's not already linked and belongs to restaurant
    if (saleId) {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        select: { restaurantId: true }
      })

      if (!sale || sale.restaurantId !== restaurantId) {
        return NextResponse.json(
          { error: 'Sale not found or does not belong to this restaurant' },
          { status: 400 }
        )
      }

      const existingTransaction = await prisma.bankTransaction.findFirst({
        where: { saleId }
      })

      if (existingTransaction) {
        return NextResponse.json(
          { error: 'This sale is already linked to another transaction' },
          { status: 400 }
        )
      }
    }

    // If debtPaymentId provided, verify it's not already linked and belongs to restaurant
    if (debtPaymentId) {
      const debtPayment = await prisma.debtPayment.findUnique({
        where: { id: debtPaymentId },
        include: {
          debt: {
            select: { restaurantId: true }
          }
        }
      })

      if (!debtPayment || debtPayment.debt.restaurantId !== restaurantId) {
        return NextResponse.json(
          { error: 'Debt payment not found or does not belong to this restaurant' },
          { status: 400 }
        )
      }

      const existingTransaction = await prisma.bankTransaction.findUnique({
        where: { debtPaymentId }
      })

      if (existingTransaction) {
        return NextResponse.json(
          { error: 'This debt payment is already linked to another transaction' },
          { status: 400 }
        )
      }
    }

    // Parse date
    const transactionDate = new Date(date)
    if (isNaN(transactionDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get user name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    // Create transaction
    const transaction = await prisma.bankTransaction.create({
      data: {
        restaurantId,
        date: transactionDate,
        amount,
        type,
        method,
        reason,
        description: description?.trim() || null,
        bankRef: bankRef?.trim() || null,
        receiptUrl: receiptUrl?.trim() || null,
        comments: comments?.trim() || null,
        saleId: saleId || null,
        debtPaymentId: debtPaymentId || null,
        status: 'Pending',
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
        },
        debtPayment: {
          select: {
            id: true,
            amount: true,
            paymentDate: true
          }
        }
      }
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Error creating bank transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
