import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/expenses - List expenses for a bakery
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query filters
    const where: {
      restaurantId: string
      status?: 'Pending' | 'Approved' | 'Rejected'
      categoryId?: string
      date?: { gte?: Date; lte?: Date }
    } = {
      restaurantId,
    }

    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      where.status = status as 'Pending' | 'Approved' | 'Rejected'
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Fetch expenses with relations
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            color: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        expenseItems: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    // Calculate summary statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const todayExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date)
      return expenseDate >= today && expenseDate < tomorrow
    })

    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date)
      return expenseDate >= monthStart
    })

    const totalAmount = expenses.reduce((sum, e) => sum + e.amountGNF, 0)

    // Calculate previous period expenses for comparison
    let previousPeriodTotal = 0
    let expenseChangePercent = 0

    if (startDate) {
      const currentStart = new Date(startDate)
      const currentEnd = endDate ? new Date(endDate) : new Date()
      const periodDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24))

      const previousEnd = new Date(currentStart)
      previousEnd.setDate(previousEnd.getDate() - 1)
      const previousStart = new Date(previousEnd)
      previousStart.setDate(previousStart.getDate() - periodDays)

      const previousExpenses = await prisma.expense.findMany({
        where: {
          restaurantId,
          date: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
        select: { amountGNF: true },
      })

      previousPeriodTotal = previousExpenses.reduce((sum, e) => sum + e.amountGNF, 0)

      if (previousPeriodTotal > 0) {
        expenseChangePercent = ((totalAmount - previousPeriodTotal) / previousPeriodTotal) * 100
      } else if (totalAmount > 0) {
        expenseChangePercent = 100 // New expenses from zero
      }
    }

    // Build expensesByDay for trend chart (sorted ascending for chart)
    const expensesByDay = expenses
      .reduce((acc: { date: string; amount: number }[], expense) => {
        const dateStr = new Date(expense.date).toISOString().split('T')[0]
        const existing = acc.find(d => d.date === dateStr)
        if (existing) {
          existing.amount += expense.amountGNF
        } else {
          acc.push({ date: dateStr, amount: expense.amountGNF })
        }
        return acc
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Build expensesByCategory for category chart
    const expensesByCategory = expenses
      .reduce((acc: { categoryName: string; categoryNameFr?: string | null; amount: number; color?: string | null }[], expense) => {
        const existing = acc.find(c => c.categoryName === expense.categoryName)
        if (existing) {
          existing.amount += expense.amountGNF
        } else {
          acc.push({
            categoryName: expense.categoryName,
            categoryNameFr: expense.category?.nameFr,
            amount: expense.amountGNF,
            color: expense.category?.color,
          })
        }
        return acc
      }, [])

    const summary = {
      totalExpenses: expenses.length,
      totalAmount,
      pendingCount: expenses.filter(e => e.status === 'Pending').length,
      approvedCount: expenses.filter(e => e.status === 'Approved').length,
      rejectedCount: expenses.filter(e => e.status === 'Rejected').length,
      totalCash: expenses.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amountGNF, 0),
      totalOrangeMoney: expenses.filter(e => e.paymentMethod === 'OrangeMoney').reduce((sum, e) => sum + e.amountGNF, 0),
      totalCard: expenses.filter(e => e.paymentMethod === 'Card').reduce((sum, e) => sum + e.amountGNF, 0),
      todayTotal: todayExpenses.reduce((sum, e) => sum + e.amountGNF, 0),
      monthTotal: monthExpenses.reduce((sum, e) => sum + e.amountGNF, 0),
      previousPeriodTotal,
      expenseChangePercent: Math.round(expenseChangePercent * 10) / 10,
    }

    return NextResponse.json({ expenses, summary, expensesByDay, expensesByCategory })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      restaurantId,
      date,
      categoryId,
      categoryName,
      amountGNF,
      amountEUR = 0,
      paymentMethod,
      description,
      receiptUrl,
      comments,
      transactionRef,
      supplierId,
      isInventoryPurchase = false,
      expenseItems = [], // Array of { inventoryItemId, quantity, unitCostGNF }
    } = body

    // Validate required fields
    if (!restaurantId || !date || !categoryName || amountGNF === undefined || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, date, categoryName, amountGNF, paymentMethod' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amountGNF <= 0) {
      return NextResponse.json(
        { error: 'amountGNF must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse date
    const expenseDate = new Date(date)
    expenseDate.setHours(0, 0, 0, 0)

    // Validate expense items if inventory purchase
    if (isInventoryPurchase && expenseItems.length > 0) {
      // Validate all inventory items exist and belong to the restaurant
      const inventoryItemIds = expenseItems.map((item: { inventoryItemId: string }) => item.inventoryItemId)
      const validItems = await prisma.inventoryItem.findMany({
        where: {
          id: { in: inventoryItemIds },
          restaurantId,
          isActive: true,
        },
        select: { id: true },
      })

      if (validItems.length !== inventoryItemIds.length) {
        return NextResponse.json(
          { error: 'One or more inventory items are invalid or do not belong to this restaurant' },
          { status: 400 }
        )
      }

      // Validate quantities and costs
      for (const item of expenseItems) {
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json({ error: 'Each item must have a quantity greater than 0' }, { status: 400 })
        }
        if (item.unitCostGNF === undefined || item.unitCostGNF < 0) {
          return NextResponse.json({ error: 'Each item must have a valid unit cost' }, { status: 400 })
        }
      }
    }

    // Create expense with items in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      // Create expense
      const newExpense = await tx.expense.create({
        data: {
          restaurantId,
          date: expenseDate,
          categoryId: categoryId || null,
          categoryName,
          amountGNF,
          amountEUR,
          paymentMethod,
          description: description || null,
          receiptUrl: receiptUrl || null,
          comments: comments || null,
          transactionRef: transactionRef || null,
          supplierId: supplierId || null,
          isInventoryPurchase,
          status: 'Pending',
          submittedBy: session.user.id,
          submittedByName: session.user.name || session.user.email,
        },
      })

      // Create expense items if inventory purchase
      if (isInventoryPurchase && expenseItems.length > 0) {
        await tx.expenseItem.createMany({
          data: expenseItems.map((item: { inventoryItemId: string; quantity: number; unitCostGNF: number }) => ({
            expenseId: newExpense.id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitCostGNF: item.unitCostGNF,
          })),
        })
      }

      // Fetch complete expense with relations
      return tx.expense.findUnique({
        where: { id: newExpense.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              color: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          expenseItems: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  nameFr: true,
                  unit: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
