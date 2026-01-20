import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/customers - List customers for a restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

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

    // Fetch customers with optional debt summary
    const customers = await prisma.customer.findMany({
      where: {
        restaurantId,
        ...(includeInactive ? {} : { isActive: true })
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        company: true,
        customerType: true,
        creditLimit: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            debts: {
              where: {
                status: {
                  in: ['Outstanding', 'PartiallyPaid', 'Overdue']
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate outstanding debt for each customer
    const customersWithDebt = await Promise.all(
      customers.map(async (customer) => {
        const debts = await prisma.debt.findMany({
          where: {
            customerId: customer.id,
            status: {
              in: ['Outstanding', 'PartiallyPaid', 'Overdue']
            }
          },
          select: {
            remainingAmount: true
          }
        })

        const outstandingDebt = debts.reduce(
          (sum, debt) => sum + debt.remainingAmount,
          0
        )

        return {
          ...customer,
          outstandingDebt,
          activeDebtsCount: customer._count.debts
        }
      })
    )

    return NextResponse.json({ customers: customersWithDebt })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
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
        { error: 'Only managers can create customers' },
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
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

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate customer type if provided
    const validCustomerTypes = ['Individual', 'Corporate', 'Wholesale']
    if (body.customerType && !validCustomerTypes.includes(body.customerType)) {
      return NextResponse.json(
        { error: 'Invalid customer type' },
        { status: 400 }
      )
    }

    // Validate credit limit if provided
    if (body.creditLimit && body.creditLimit < 0) {
      return NextResponse.json(
        { error: 'Credit limit must be positive' },
        { status: 400 }
      )
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        restaurantId: body.restaurantId,
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        company: body.company?.trim() || null,
        customerType: body.customerType || 'Individual',
        creditLimit: body.creditLimit || null,
        notes: body.notes?.trim() || null,
        isActive: true
      }
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
