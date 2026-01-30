import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// PUT /api/categories/[id] - Update category
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
        { error: 'Only owners can update categories' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    if (!body.expenseGroupId) {
      return NextResponse.json(
        { error: 'Expense group is required' },
        { status: 400 }
      )
    }

    if (!body.color || !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return NextResponse.json(
        { error: 'Valid color is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name.trim(),
        nameFr: body.nameFr?.trim() || null,
        color: body.color,
        expenseGroupId: body.expenseGroupId
      },
      include: {
        expenseGroup: {
          select: {
            id: true,
            key: true,
            label: true,
            labelFr: true,
            icon: true,
            color: true,
            sortOrder: true
          }
        }
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/categories/[id] - Toggle category active status (soft delete)
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
        { error: 'Only owners can delete categories' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Toggle isActive status
    const category = await prisma.category.update({
      where: { id },
      data: {
        isActive: !existingCategory.isActive
      },
      include: {
        expenseGroup: {
          select: {
            id: true,
            key: true,
            label: true,
            labelFr: true,
            icon: true,
            color: true,
            sortOrder: true
          }
        }
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
