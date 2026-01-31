import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// PUT /api/expense-groups/[id] - Update expense group
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
        { error: 'Only owners can update expense groups' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields (key cannot be changed)
    if (!body.label || !body.label.trim()) {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 }
      )
    }

    if (!body.labelFr || !body.labelFr.trim()) {
      return NextResponse.json(
        { error: 'French label is required' },
        { status: 400 }
      )
    }

    if (!body.icon) {
      return NextResponse.json(
        { error: 'Icon is required' },
        { status: 400 }
      )
    }

    if (!body.color || !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return NextResponse.json(
        { error: 'Valid color is required' },
        { status: 400 }
      )
    }

    // Check if expense group exists
    const existingGroup = await prisma.expenseGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Expense group not found' },
        { status: 404 }
      )
    }

    // Update expense group (key is immutable)
    const expenseGroup = await prisma.expenseGroup.update({
      where: { id },
      data: {
        label: body.label.trim(),
        labelFr: body.labelFr.trim(),
        icon: body.icon,
        color: body.color
      }
    })

    return NextResponse.json({ expenseGroup })
  } catch (error) {
    console.error('Error updating expense group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/expense-groups/[id] - Toggle expense group active status (soft delete)
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
        { error: 'Only owners can delete expense groups' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if expense group exists
    const existingGroup = await prisma.expenseGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Expense group not found' },
        { status: 404 }
      )
    }

    // Toggle isActive status
    const expenseGroup = await prisma.expenseGroup.update({
      where: { id },
      data: {
        isActive: !existingGroup.isActive
      }
    })

    return NextResponse.json({ expenseGroup })
  } catch (error) {
    console.error('Error deleting expense group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
