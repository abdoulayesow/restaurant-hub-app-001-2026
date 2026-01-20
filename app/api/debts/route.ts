import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/debts - List debts with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const saleId = searchParams.get('saleId')
    const overdue = searchParams.get('overdue') === 'true'

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Build filter conditions
    const where: any = { restaurantId }

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    if (saleId) {
      where.saleId = saleId
    }

    if (overdue) {
      where.status = 'Overdue'
      where.dueDate = { lt: new Date() }
    }

    // Fetch debts with customer and payment info
    const debts = await prisma.debt.findMany({
      where,
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
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ debts })
  } catch (error) {
    console.error('Error fetching debts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/debts - Create new debt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Editor or Manager role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true }
    })

    if (!user || (user.role !== 'Manager' && user.role !== 'Editor')) {
      return NextResponse.json(
        { error: 'Only managers and editors can create debts' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    if (!body.customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    if (!body.principalAmount || body.principalAmount <= 0) {
      return NextResponse.json(
        { error: 'principalAmount must be greater than 0' },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: body.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Verify customer exists and belongs to this restaurant
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (customer.restaurantId !== body.restaurantId) {
      return NextResponse.json(
        { error: 'Customer does not belong to this restaurant' },
        { status: 400 }
      )
    }

    // Check credit limit if set
    if (customer.creditLimit !== null && customer.creditLimit !== undefined) {
      // Calculate current outstanding debt
      const existingDebts = await prisma.debt.findMany({
        where: {
          customerId: body.customerId,
          status: {
            in: ['Outstanding', 'PartiallyPaid', 'Overdue']
          }
        },
        select: {
          remainingAmount: true
        }
      })

      const currentOutstanding = existingDebts.reduce(
        (sum, debt) => sum + debt.remainingAmount,
        0
      )

      const newTotalOutstanding = currentOutstanding + body.principalAmount

      if (newTotalOutstanding > customer.creditLimit) {
        return NextResponse.json(
          {
            error: `Credit limit exceeded. Customer limit: ${customer.creditLimit} GNF, Current outstanding: ${currentOutstanding} GNF, New total would be: ${newTotalOutstanding} GNF`
          },
          { status: 400 }
        )
      }
    }

    // Verify sale if provided
    if (body.saleId) {
      const sale = await prisma.sale.findUnique({
        where: { id: body.saleId }
      })

      if (!sale) {
        return NextResponse.json(
          { error: 'Sale not found' },
          { status: 404 }
        )
      }

      if (sale.restaurantId !== body.restaurantId) {
        return NextResponse.json(
          { error: 'Sale does not belong to this restaurant' },
          { status: 400 }
        )
      }
    }

    // Create debt
    const debt = await prisma.debt.create({
      data: {
        restaurantId: body.restaurantId,
        customerId: body.customerId,
        saleId: body.saleId || null,
        principalAmount: body.principalAmount,
        paidAmount: 0,
        remainingAmount: body.principalAmount,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'Outstanding',
        description: body.description?.trim() || null,
        notes: body.notes?.trim() || null,
        createdBy: session.user.id,
        createdByName: user.name || null
      },
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
        }
      }
    })

    return NextResponse.json({ debt }, { status: 201 })
  } catch (error) {
    console.error('Error creating debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
