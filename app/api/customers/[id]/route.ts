import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// GET /api/customers/[id] - Get customer details with debt summary
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

    // Fetch customer with debt information
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        debts: {
          where: {
            status: {
              in: ['Outstanding', 'PartiallyPaid', 'Overdue']
            }
          },
          select: {
            id: true,
            principalAmount: true,
            paidAmount: true,
            remainingAmount: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: customer.restaurantId
        }
      }
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Access denied to this restaurant' },
        { status: 403 }
      )
    }

    // Calculate total outstanding debt
    const outstandingDebt = customer.debts.reduce(
      (sum, debt) => sum + debt.remainingAmount,
      0
    )

    return NextResponse.json({
      customer: {
        ...customer,
        outstandingDebt
      }
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/customers/[id] - Update customer
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
    const body = await request.json()

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this restaurant and check role
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingCustomer.restaurantId
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

    // Only Owner can update customers
    if (!canApprove(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can update customers' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
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
    if (body.creditLimit !== undefined && body.creditLimit !== null && body.creditLimit < 0) {
      return NextResponse.json(
        { error: 'Credit limit must be positive' },
        { status: 400 }
      )
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        company: body.company?.trim() || null,
        customerType: body.customerType || existingCustomer.customerType,
        creditLimit: body.creditLimit !== undefined ? body.creditLimit : existingCustomer.creditLimit,
        notes: body.notes?.trim() || null
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/customers/[id] - Toggle customer active status (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        debts: {
          where: {
            status: {
              in: ['Outstanding', 'PartiallyPaid', 'Overdue']
            }
          }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this restaurant and check role
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingCustomer.restaurantId
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

    // Only Owner can delete customers
    if (!canApprove(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can delete customers' },
        { status: 403 }
      )
    }

    // Prevent deactivating customer with outstanding debts
    if (existingCustomer.isActive && existingCustomer.debts.length > 0) {
      const totalOutstanding = existingCustomer.debts.reduce(
        (sum, debt) => sum + debt.remainingAmount,
        0
      )

      return NextResponse.json(
        {
          error: `Cannot deactivate customer with outstanding debts (${totalOutstanding} GNF remaining). Please collect or write off debts first.`
        },
        { status: 400 }
      )
    }

    // Toggle isActive status
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        isActive: !existingCustomer.isActive
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
