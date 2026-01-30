import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// PUT /api/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an Owner (via any restaurant)
    const userRestaurant = await prisma.userRestaurant.findFirst({
      where: { userId: session.user.id },
      select: { role: true }
    })

    if (!userRestaurant || !canApprove(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can update suppliers' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
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

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Update supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        paymentTerms: body.paymentTerms?.trim() || null,
      }
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/suppliers/[id] - Toggle supplier active status (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an Owner (via any restaurant)
    const userRestaurant = await prisma.userRestaurant.findFirst({
      where: { userId: session.user.id },
      select: { role: true }
    })

    if (!userRestaurant || !canApprove(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can delete suppliers' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Toggle isActive status
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        isActive: !existingSupplier.isActive
      }
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
