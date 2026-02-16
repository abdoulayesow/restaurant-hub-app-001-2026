import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, authorizeRestaurantAccess } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseToUTCDate, parseToUTCEndOfDay, extractDatePart } from '@/lib/date-utils'
import { canRecordSales } from '@/lib/roles'

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
      status?: 'Pending' | 'Approved' | 'Rejected' | { not: 'Deleted' }
      date?: { gte?: Date; lte?: Date }
    } = {
      restaurantId,
    }

    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      where.status = status as 'Pending' | 'Approved' | 'Rejected'
    } else {
      // Exclude deleted sales by default
      where.status = { not: 'Deleted' }
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
        bankTransactions: {
          select: {
            id: true,
            status: true,
            confirmedAt: true,
            method: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                category: true,
                unit: true
              }
            }
          }
        },
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
            dueDate: true,
            description: true,
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

      const previousAggregate = await prisma.sale.aggregate({
        where: {
          restaurantId,
          date: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
        _sum: { totalGNF: true },
      })

      previousPeriodRevenue = previousAggregate._sum.totalGNF ?? 0

      if (previousPeriodRevenue > 0) {
        revenueChangePercent = ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      } else if (totalRevenue > 0) {
        revenueChangePercent = 100 // New revenue from zero
      }
    }

    // Build salesByDay for trend chart using Map for O(n) aggregation
    // Use extractDatePart to avoid timezone conversion issues on the server
    const salesByDayMap = new Map<string, number>()
    for (const sale of sales) {
      const dateStr = extractDatePart(sale.date)
      salesByDayMap.set(dateStr, (salesByDayMap.get(dateStr) ?? 0) + sale.totalGNF)
    }
    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([date, amount]) => ({ date, amount }))
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
      saleItems = [], // Optional product sales tracking
    } = body

    if (!restaurantId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, date' },
        { status: 400 }
      )
    }

    // Validate user has access to this restaurant and permission to record sales
    const auth = await authorizeRestaurantAccess(
      session.user.id,
      restaurantId,
      canRecordSales,
      'Your role does not have permission to record sales'
    )
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
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

    // Validate debts if provided - batch fetch all customers and their outstanding debts
    if (debts.length > 0) {
      // First validate basic fields
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
      }

      // Batch fetch all customers in one query
      const customerIds = debts.map((d: { customerId: string }) => d.customerId)
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, restaurantId: true, creditLimit: true }
      })
      const customerMap = new Map(customers.map((c) => [c.id, c]))

      // Batch fetch outstanding debt aggregations for customers with credit limits
      const customersWithLimits = customers.filter((c) => c.creditLimit !== null && c.creditLimit !== undefined)
      const debtAggregations = customersWithLimits.length > 0
        ? await prisma.debt.groupBy({
            by: ['customerId'],
            where: {
              customerId: { in: customersWithLimits.map((c) => c.id) },
              status: { in: ['Outstanding', 'PartiallyPaid', 'Overdue'] }
            },
            _sum: { remainingAmount: true }
          })
        : []
      const outstandingByCustomer = new Map(
        debtAggregations.map((agg) => [agg.customerId, agg._sum.remainingAmount ?? 0])
      )

      // Validate each debt
      for (const debt of debts) {
        const customer = customerMap.get(debt.customerId)

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
          const currentOutstanding = outstandingByCustomer.get(debt.customerId) ?? 0
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

    // Validate saleItems if provided - batch fetch all products
    if (saleItems.length > 0) {
      // First validate basic fields
      for (const item of saleItems) {
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json(
            { error: 'Each sale item must have a positive quantity' },
            { status: 400 }
          )
        }
      }

      // Batch fetch all products in one query
      const productIds = saleItems
        .filter((item: { productId?: string }) => item.productId)
        .map((item: { productId: string }) => item.productId)

      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, restaurantId: true }
        })
        const productMap = new Map(products.map((p) => [p.id, p]))

        // Validate each product
        for (const item of saleItems) {
          if (item.productId) {
            const product = productMap.get(item.productId)

            if (!product) {
              return NextResponse.json(
                { error: `Product not found: ${item.productId}` },
                { status: 404 }
              )
            }

            if (product.restaurantId !== restaurantId) {
              return NextResponse.json(
                { error: 'Product does not belong to this restaurant' },
                { status: 400 }
              )
            }
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

      // Create sale items if any (optional product tracking)
      if (saleItems.length > 0) {
        await tx.saleItem.createMany({
          data: saleItems.map((item: { productId?: string; productName?: string; productNameFr?: string; quantity: number; unitPrice?: number }) => ({
            saleId: sale.id,
            productId: item.productId || null,
            productName: item.productName?.trim() || null,
            productNameFr: item.productNameFr?.trim() || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice || null
          }))
        })
      }

      // Fetch created sale with relations
      const saleWithRelations = await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          bankTransactions: {
            select: {
              id: true,
              status: true,
              confirmedAt: true,
              method: true
            }
          },
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameFr: true,
                  category: true,
                  unit: true
                }
              }
            }
          },
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
