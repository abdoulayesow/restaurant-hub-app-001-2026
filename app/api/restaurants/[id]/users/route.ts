import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - List users assigned to restaurant
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: restaurantId } = await context.params

    // Verify user is Owner of this restaurant
    const userRestaurant = await prisma.userRestaurant.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
        role: 'Owner',
      },
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Only owners can manage staff' },
        { status: 403 }
      )
    }

    // Get all users assigned to this restaurant
    const assignments = await prisma.userRestaurant.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const users = assignments.map((assignment) => ({
      id: assignment.user.id,
      name: assignment.user.name,
      email: assignment.user.email,
      image: assignment.user.image,
      role: assignment.role,
      assignedAt: assignment.createdAt,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching restaurant users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Assign user to restaurant
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: restaurantId } = await context.params
    const body = await request.json()
    const { userId, role } = body

    // Validate required fields
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      )
    }

    // Validate role is valid UserRole
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify user is Owner of this restaurant
    const userRestaurant = await prisma.userRestaurant.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
        role: 'Owner',
      },
    })

    if (!userRestaurant) {
      return NextResponse.json(
        { error: 'Only owners can manage staff' },
        { status: 403 }
      )
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already assigned
    const existingAssignment = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this restaurant' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = await prisma.userRestaurant.create({
      data: {
        userId,
        restaurantId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      user: {
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        image: assignment.user.image,
        role: assignment.role,
        assignedAt: assignment.createdAt,
      },
    })
  } catch (error) {
    console.error('Error assigning user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
