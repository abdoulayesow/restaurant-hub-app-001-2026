import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseToUTCDate, parseToUTCEndOfDay } from '@/lib/date-utils'

// GET /api/sales - List sales for a bakery
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')
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
      date?: { gte?: Date; lte?: Date }
    } = {
      restaurantId,
    }

    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      where.status = status as 'Pending' | 'Approved' | 'Rejected'
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = parseToUTCDate(startDate)
      }
      if (endDate) {
        where.date.lte = parseToUTCEndOfDay(endDate)
      }
    }

    // Fetch sales
    const salesData = await prisma.sale.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        cashDeposit: true,
        debts: {
          where: {
            status: {
              in: ['Outstanding', 'PartiallyPaid', 'Overdue']
            }
          },
          select: {
            id: true,
            customerId: true,
            principalAmount: true,
            remainingAmount: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                customerType: true
              }
            }
          }
        }
      },
    })

    // Transform sales to include activeDebtsCount and outstandingDebtAmount
    const sales = salesData.map(sale => ({
      ...sale,
      activeDebtsCount: sale.debts.length,
      outstandingDebtAmount: sale.debts.reduce((sum, debt) => sum + debt.remainingAmount, 0)
    }))

    // Calculate summary statistics
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalGNF, 0)
    const totalCash = sales.reduce((sum, s) => sum + s.cashGNF, 0)
    const totalOrangeMoney = sales.reduce((sum, s) => sum + s.orangeMoneyGNF, 0)
    const totalCard = sales.reduce((sum, s) => sum + s.cardGNF, 0)

    // Calculate previous period revenue for comparison
    let previousPeriodRevenue = 0
    let revenueChangePercent = 0

    if (startDate) {
      const currentStart = new Date(startDate)
      const currentEnd = endDate ? new Date(endDate) : new Date()
      const periodDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24))

      const previousEnd = new Date(currentStart)
      previousEnd.setDate(previousEnd.getDate() - 1)
      const previousStart = new Date(previousEnd)
      previousStart.setDate(previousStart.getDate() - periodDays)

      const previousSales = await prisma.sale.findMany({
        where: {
          restaurantId,
          date: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
        select: { totalGNF: true },
      })

      previousPeriodRevenue = previousSales.reduce((sum, s) => sum + s.totalGNF, 0)

      if (previousPeriodRevenue > 0) {
        revenueChangePercent = ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      } else if (totalRevenue > 0) {
        revenueChangePercent = 100 // New revenue from zero
      }
    }

    // Build salesByDay for trend chart (sorted ascending for chart)
    const salesByDay = sales
      .reduce((acc: { date: string; amount: number }[], sale) => {
        const dateStr = new Date(sale.date).toISOString().split('T')[0]
        const existing = acc.find(d => d.date === dateStr)
        if (existing) {
          existing.amount += sale.totalGNF
        } else {
          acc.push({ date: dateStr, amount: sale.totalGNF })
        }
        return acc
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const summary = {
      totalSales: sales.length,
      totalRevenue,
      pendingCount: sales.filter(s => s.status === 'Pending').length,
      approvedCount: sales.filter(s => s.status === 'Approved').length,
      rejectedCount: sales.filter(s => s.status === 'Rejected').length,
      totalCash,
      totalOrangeMoney,
      totalCard,
      previousPeriodRevenue,
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,
    }

    return NextResponse.json({ sales, summary, salesByDay })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sales - Create a new sale
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
      cashGNF = 0,
      orangeMoneyGNF = 0,
      cardGNF = 0,
      itemsCount,
      customersCount,
      receiptUrl,
      openingTime,
      closingTime,
      comments,
      debts = [], // Optional debts array
    } = body

    if (!restaurantId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, date' },
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

    // Get user details for debt creation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    // Check for existing sale on the same date (one sale per day per restaurant)
    const saleDate = parseToUTCDate(date)

    const existingSale = await prisma.sale.findUnique({
      where: {
        restaurantId_date: {
          restaurantId,
          date: saleDate,
        },
      },
    })

    if (existingSale) {
      return NextResponse.json(
        {
          error: 'A sale already exists for this date. Please edit the existing record.',
          code: 'SALE_DUPLICATE_DATE',
          existingSaleId: existingSale.id
        },
        { status: 409 }
      )
    }

    // Validate debts if provided
    if (debts.length > 0) {
      for (const debt of debts) {
        if (!debt.customerId) {
          return NextResponse.json(
            { error: 'Each debt must have a customerId' },
            { status: 400 }
          )
        }

        if (!debt.amountGNF || debt.amountGNF <= 0) {
          return NextResponse.json(
            { error: 'Each debt must have a positive amount' },
            { status: 400 }
          )
        }

        // Verify customer exists and belongs to this restaurant
        const customer = await prisma.customer.findUnique({
          where: { id: debt.customerId }
        })

        if (!customer) {
          return NextResponse.json(
            { error: `Customer not found: ${debt.customerId}` },
            { status: 404 }
          )
        }

        if (customer.restaurantId !== restaurantId) {
          return NextResponse.json(
            { error: 'Customer does not belong to this restaurant' },
            { status: 400 }
          )
        }

        // Check credit limit if set
        if (customer.creditLimit !== null && customer.creditLimit !== undefined) {
          const existingDebts = await prisma.debt.findMany({
            where: {
              customerId: debt.customerId,
              status: {
                in: ['Outstanding', 'PartiallyPaid', 'Overdue']
              }
            },
            select: {
              remainingAmount: true
            }
          })

          const currentOutstanding = existingDebts.reduce(
            (sum, d) => sum + d.remainingAmount,
            0
          )

          const newTotalOutstanding = currentOutstanding + debt.amountGNF

          if (newTotalOutstanding > customer.creditLimit) {
            return NextResponse.json(
              {
                error: `Credit limit exceeded for customer ${customer.name}. Limit: ${customer.creditLimit} GNF, Current outstanding: ${currentOutstanding} GNF, New total would be: ${newTotalOutstanding} GNF`
              },
              { status: 400 }
            )
          }
        }
      }
    }

    // Calculate credit total
    const creditTotal = debts.reduce((sum: number, debt: { amountGNF: number }) => sum + debt.amountGNF, 0)

    // Calculate total including immediate payments and credit sales
    const totalGNF = cashGNF + orangeMoneyGNF + cardGNF + creditTotal

    // Use transaction to create sale and debts atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          restaurantId,
          date: saleDate,
          totalGNF,
          cashGNF,
          orangeMoneyGNF,
          cardGNF,
          itemsCount: itemsCount || null,
          customersCount: customersCount || null,
          receiptUrl: receiptUrl || null,
          openingTime: openingTime || null,
          closingTime: closingTime || null,
          comments: comments || null,
          status: 'Pending',
          submittedBy: session.user.id,
          submittedByName: session.user.name || session.user.email,
        }
      })

      // Create debts if any
      if (debts.length > 0) {
        await tx.debt.createMany({
          data: debts.map((debt: { customerId: string; amountGNF: number; dueDate?: string; description?: string; notes?: string }) => ({
            restaurantId,
            saleId: sale.id,
            customerId: debt.customerId,
            principalAmount: debt.amountGNF,
            paidAmount: 0,
            remainingAmount: debt.amountGNF,
            dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
            status: 'Outstanding',
            description: debt.description?.trim() || null,
            notes: debt.notes?.trim() || null,
            createdBy: session.user.id,
            createdByName: user?.name || null
          }))
        })
      }

      // Fetch created sale with relations
      const saleWithRelations = await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          cashDeposit: true,
          debts: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  customerType: true
                }
              }
            }
          }
        }
      })

      return saleWithRelations
    })

    return NextResponse.json({ sale: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
