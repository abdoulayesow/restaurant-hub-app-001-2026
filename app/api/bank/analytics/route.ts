import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessBank } from '@/lib/roles'

// GET /api/bank/analytics - Get analytics data for bank charts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const timeframe = searchParams.get('timeframe') || '30' // days

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

    // Only owners can view bank analytics
    if (!canAccessBank(session.user.role)) {
      return NextResponse.json(
        { error: 'Only owners can view bank analytics' },
        { status: 403 }
      )
    }

    const days = parseInt(timeframe)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get all confirmed transactions within timeframe for cash flow
    const transactions = await prisma.bankTransaction.findMany({
      where: {
        restaurantId,
        status: 'Confirmed',
        date: {
          gte: startDate
        }
      },
      select: {
        date: true,
        amount: true,
        type: true,
        method: true,
        reason: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get restaurant initial balances for balance history
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

    // 1. CASH FLOW DATA - Daily aggregation by method
    const dailyCashFlow = new Map<string, {
      date: string
      cashDeposits: number
      cashWithdrawals: number
      orangeDeposits: number
      orangeWithdrawals: number
      cardDeposits: number
      cardWithdrawals: number
    }>()

    transactions.forEach(txn => {
      const dateKey = txn.date.toISOString().split('T')[0]

      if (!dailyCashFlow.has(dateKey)) {
        dailyCashFlow.set(dateKey, {
          date: dateKey,
          cashDeposits: 0,
          cashWithdrawals: 0,
          orangeDeposits: 0,
          orangeWithdrawals: 0,
          cardDeposits: 0,
          cardWithdrawals: 0
        })
      }

      const day = dailyCashFlow.get(dateKey)!

      if (txn.method === 'Cash') {
        if (txn.type === 'Deposit') day.cashDeposits += txn.amount
        else day.cashWithdrawals += txn.amount
      } else if (txn.method === 'OrangeMoney') {
        if (txn.type === 'Deposit') day.orangeDeposits += txn.amount
        else day.orangeWithdrawals += txn.amount
      } else if (txn.method === 'Card') {
        if (txn.type === 'Deposit') day.cardDeposits += txn.amount
        else day.cardWithdrawals += txn.amount
      }
    })

    const cashFlowData = Array.from(dailyCashFlow.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // 2. BREAKDOWN DATA - By reason and method
    const reasonBreakdown = new Map<string, number>()
    const methodBreakdown = new Map<string, { deposits: number; withdrawals: number }>()

    transactions.forEach(txn => {
      // By reason
      const current = reasonBreakdown.get(txn.reason) || 0
      reasonBreakdown.set(txn.reason, current + txn.amount)

      // By method
      if (!methodBreakdown.has(txn.method)) {
        methodBreakdown.set(txn.method, { deposits: 0, withdrawals: 0 })
      }
      const methodData = methodBreakdown.get(txn.method)!
      if (txn.type === 'Deposit') {
        methodData.deposits += txn.amount
      } else {
        methodData.withdrawals += txn.amount
      }
    })

    const reasonData = Array.from(reasonBreakdown.entries()).map(([reason, amount]) => ({
      reason,
      amount,
      percentage: transactions.length > 0
        ? Math.round((amount / transactions.reduce((sum, t) => sum + t.amount, 0)) * 100)
        : 0
    }))

    const methodData = Array.from(methodBreakdown.entries()).map(([method, data]) => ({
      method,
      deposits: data.deposits,
      withdrawals: data.withdrawals,
      net: data.deposits - data.withdrawals
    }))

    // 3. BALANCE HISTORY - Running balance over time by method
    // Get all historical confirmed transactions to calculate running balances
    const allHistoricalTransactions = await prisma.bankTransaction.findMany({
      where: {
        restaurantId,
        status: 'Confirmed'
      },
      select: {
        date: true,
        amount: true,
        type: true,
        method: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Group by date and calculate running balance
    const balanceByDate = new Map<string, {
      date: string
      cashBalance: number
      orangeMoneyBalance: number
      cardBalance: number
      totalBalance: number
    }>()

    let runningCash = restaurant.initialCashBalance
    let runningOrange = restaurant.initialOrangeBalance
    let runningCard = restaurant.initialCardBalance

    allHistoricalTransactions.forEach(txn => {
      const dateKey = txn.date.toISOString().split('T')[0]

      // Update running balances
      const delta = txn.type === 'Deposit' ? txn.amount : -txn.amount
      if (txn.method === 'Cash') runningCash += delta
      else if (txn.method === 'OrangeMoney') runningOrange += delta
      else if (txn.method === 'Card') runningCard += delta

      // Store snapshot for this date
      balanceByDate.set(dateKey, {
        date: dateKey,
        cashBalance: runningCash,
        orangeMoneyBalance: runningOrange,
        cardBalance: runningCard,
        totalBalance: runningCash + runningOrange + runningCard
      })
    })

    // Filter to timeframe and fill gaps
    const balanceHistory: Array<{
      date: string
      cashBalance: number
      orangeMoneyBalance: number
      cardBalance: number
      totalBalance: number
    }> = []

    const currentDate = new Date(startDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    let lastCash = restaurant.initialCashBalance
    let lastOrange = restaurant.initialOrangeBalance
    let lastCard = restaurant.initialCardBalance

    // Get balance at start date
    for (const [dateKey, balance] of balanceByDate.entries()) {
      if (dateKey < startDate.toISOString().split('T')[0]) {
        lastCash = balance.cashBalance
        lastOrange = balance.orangeMoneyBalance
        lastCard = balance.cardBalance
      }
    }

    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const balance = balanceByDate.get(dateKey)

      if (balance) {
        balanceHistory.push(balance)
        lastCash = balance.cashBalance
        lastOrange = balance.orangeMoneyBalance
        lastCard = balance.cardBalance
      } else {
        // Fill with last known balance
        balanceHistory.push({
          date: dateKey,
          cashBalance: lastCash,
          orangeMoneyBalance: lastOrange,
          cardBalance: lastCard,
          totalBalance: lastCash + lastOrange + lastCard
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({
      cashFlow: cashFlowData,
      reasonBreakdown: reasonData,
      methodBreakdown: methodData,
      balanceHistory: balanceHistory,
      summary: {
        totalTransactions: transactions.length,
        totalDeposits: transactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: transactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0),
        netCashFlow: transactions.reduce((sum, t) => {
          return sum + (t.type === 'Deposit' ? t.amount : -t.amount)
        }, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching bank analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
