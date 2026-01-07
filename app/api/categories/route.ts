import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/categories - List all categories with expense groups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Fetch categories with their expense groups
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        expenseGroup: {
          select: {
            id: true,
            key: true,
            label: true,
            labelFr: true,
            icon: true,
            color: true,
            sortOrder: true,
          },
        },
      },
      orderBy: [
        { expenseGroup: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
    })

    // Also fetch expense groups for grouping in UI
    const expenseGroups = await prisma.expenseGroup.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ categories, expenseGroups })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/categories - Create new category
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
        { error: 'Only managers can create categories' },
        { status: 403 }
      )
    }

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

    // Create category
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        nameFr: body.nameFr?.trim() || null,
        color: body.color,
        expenseGroupId: body.expenseGroupId,
        isActive: true
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

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
