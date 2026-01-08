import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/expense-groups - List expense groups (active or all)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Fetch expense groups
    const expenseGroups = await prisma.expenseGroup.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ expenseGroups })
  } catch (error) {
    console.error('Error fetching expense groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/expense-groups - Create new expense group
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
        { error: 'Only managers can create expense groups' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.key || !body.key.trim()) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z_]+$/.test(body.key)) {
      return NextResponse.json(
        { error: 'Key must contain only letters and underscores' },
        { status: 400 }
      )
    }

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

    // Check if key already exists
    const existingGroup = await prisma.expenseGroup.findUnique({
      where: { key: body.key }
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'An expense group with this key already exists' },
        { status: 400 }
      )
    }

    // Get max sortOrder and increment
    const maxSortOrder = await prisma.expenseGroup.findFirst({
      select: { sortOrder: true },
      orderBy: { sortOrder: 'desc' }
    })

    const sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1

    // Create expense group
    const expenseGroup = await prisma.expenseGroup.create({
      data: {
        key: body.key.trim(),
        label: body.label.trim(),
        labelFr: body.labelFr.trim(),
        icon: body.icon,
        color: body.color,
        sortOrder,
        isActive: true
      }
    })

    return NextResponse.json({ expenseGroup }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
