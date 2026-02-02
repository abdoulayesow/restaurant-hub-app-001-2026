import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessBank } from '@/lib/roles'

// GET /api/bank/balances - Get current balances for a bakery
// Calculates from initial balances + BankTransaction deposits - withdrawals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

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

    // Only owners can view bank balances
    if (!canAccessBank(session.user.role)) {
      return NextResponse.json(
        { error: 'Only owners can view bank balances' },
        { status: 403 }
      )
    }

    // Get restaurant initial balances
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        initialCashBalance: true,
        initialOrangeBalance: true,
        initialCardBalance: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get all confirmed bank transactions
    const transactions = await prisma.bankTransaction.findMany({
      where: {
        restaurantId,
        status: 'Confirmed'
      },
      select: {
        type: true,
        method: true,
        amount: true,
        date: true
      }
    })

    // Calculate balances by method
    // Formula: initial + deposits - withdrawals
    const calculateBalance = (method: 'Cash' | 'OrangeMoney' | 'Card', initial: number) => {
      const deposits = transactions
        .filter(t => t.type === 'Deposit' && t.method === method)
        .reduce((sum, t) => sum + t.amount, 0)
      const withdrawals = transactions
        .filter(t => t.type === 'Withdrawal' && t.method === method)
        .reduce((sum, t) => sum + t.amount, 0)
      return initial + deposits - withdrawals
    }

    const cashBalance = calculateBalance('Cash', restaurant.initialCashBalance)
    const orangeMoneyBalance = calculateBalance('OrangeMoney', restaurant.initialOrangeBalance)
    const cardBalance = calculateBalance('Card', restaurant.initialCardBalance)
    const total = cashBalance + orangeMoneyBalance + cardBalance

    // Get the date of the most recent transaction for "as of" date
    const latestTransaction = transactions.length > 0
      ? transactions.reduce((latest, t) => t.date > latest.date ? t : latest)
      : null

    // Calculate pending transactions (not yet confirmed)
    const pendingTransactions = await prisma.bankTransaction.findMany({
      where: {
        restaurantId,
        status: 'Pending'
      },
      select: {
        type: true,
        method: true,
        amount: true
      }
    })

    // Get undeposited sales cash (approved sales with cash that haven't been deposited to bank yet)
    // A sale's cash is deposited when there's a BankTransaction with reason='SalesDeposit' linked to that sale
    const undepositedSales = await prisma.sale.findMany({
      where: {
        restaurantId,
        status: 'Approved',
        cashGNF: { gt: 0 }
      },
      select: {
        id: true,
        cashGNF: true
      }
    })

    // Get all sales that have been deposited (have BankTransaction with reason='SalesDeposit')
    const depositedSaleIds = await prisma.bankTransaction.findMany({
      where: {
        restaurantId,
        reason: 'SalesDeposit',
        saleId: { not: null }
      },
      select: {
        saleId: true
      }
    })

    const depositedSaleIdsSet = new Set(depositedSaleIds.map(t => t.saleId).filter(Boolean))
    const totalUndepositedCash = undepositedSales
      .filter(sale => !depositedSaleIdsSet.has(sale.id))
      .reduce((sum, sale) => sum + sale.cashGNF, 0)

    // Get unpaid/partially paid expenses
    const unpaidExpenses = await prisma.expense.findMany({
      where: {
        restaurantId,
        paymentStatus: { in: ['Unpaid', 'PartiallyPaid'] }
      },
      select: {
        amountGNF: true,
        totalPaidAmount: true
      }
    })

    const totalUnpaidExpenses = unpaidExpenses.reduce(
      (sum, expense) => sum + (expense.amountGNF - expense.totalPaidAmount),
      0
    )

    const pendingByMethod = (method: 'Cash' | 'OrangeMoney' | 'Card') => {
      const deposits = pendingTransactions
        .filter(t => t.type === 'Deposit' && t.method === method)
        .reduce((sum, t) => sum + t.amount, 0)
      const withdrawals = pendingTransactions
        .filter(t => t.type === 'Withdrawal' && t.method === method)
        .reduce((sum, t) => sum + t.amount, 0)
      return { deposits, withdrawals, net: deposits - withdrawals }
    }

    // Total pending deposits = manual pending deposits + undeposited sales cash
    const manualPendingDeposits = pendingTransactions
      .filter(t => t.type === 'Deposit')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalPendingDeposits = manualPendingDeposits + totalUndepositedCash

    // Total pending withdrawals = manual pending withdrawals + unpaid expenses
    const manualPendingWithdrawals = pendingTransactions
      .filter(t => t.type === 'Withdrawal')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalPendingWithdrawals = manualPendingWithdrawals + totalUnpaidExpenses

    return NextResponse.json({
      balances: {
        cash: cashBalance,
        orangeMoney: orangeMoneyBalance,
        card: cardBalance,
        total,
        asOfDate: latestTransaction?.date.toISOString() || null
      },
      pending: {
        cash: pendingByMethod('Cash'),
        orangeMoney: pendingByMethod('OrangeMoney'),
        card: pendingByMethod('Card'),
        totalPendingDeposits,
        totalPendingWithdrawals
      },
      initial: {
        cash: restaurant.initialCashBalance,
        orangeMoney: restaurant.initialOrangeBalance,
        card: restaurant.initialCardBalance
      }
    })
  } catch (error) {
    console.error('Error fetching bank balances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
