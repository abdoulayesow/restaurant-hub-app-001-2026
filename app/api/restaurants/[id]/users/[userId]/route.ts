import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string; userId: string }>
}

// PATCH - Change user's role at restaurant
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: restaurantId, userId } = await context.params
    const body = await request.json()
    const { role } = body

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify requester is Owner of this restaurant
    const requesterRestaurant = await prisma.userRestaurant.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
        role: 'Owner',
      },
    })

    if (!requesterRestaurant) {
      return NextResponse.json(
        { error: 'Only owners can manage staff' },
        { status: 403 }
      )
    }

    // Get current assignment
    const currentAssignment = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    })

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'User is not assigned to this restaurant' },
        { status: 404 }
      )
    }

    // If changing from Owner role, check if this is the last Owner
    if (currentAssignment.role === 'Owner' && role !== 'Owner') {
      const ownerCount = await prisma.userRestaurant.count({
        where: {
          restaurantId,
          role: 'Owner',
        },
      })

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Cannot change role of last Owner' },
          { status: 400 }
        )
      }
    }

    // Update role
    const updatedAssignment = await prisma.userRestaurant.update({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
      data: { role },
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
        id: updatedAssignment.user.id,
        name: updatedAssignment.user.name,
        email: updatedAssignment.user.email,
        image: updatedAssignment.user.image,
        role: updatedAssignment.role,
        assignedAt: updatedAssignment.createdAt,
      },
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove user from restaurant
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: restaurantId, userId } = await context.params

    // Verify requester is Owner of this restaurant
    const requesterRestaurant = await prisma.userRestaurant.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: restaurantId,
        role: 'Owner',
      },
    })

    if (!requesterRestaurant) {
      return NextResponse.json(
        { error: 'Only owners can manage staff' },
        { status: 403 }
      )
    }

    // Get current assignment
    const currentAssignment = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    })

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'User is not assigned to this restaurant' },
        { status: 404 }
      )
    }

    // If removing Owner, check if this is the last Owner
    if (currentAssignment.role === 'Owner') {
      const ownerCount = await prisma.userRestaurant.count({
        where: {
          restaurantId,
          role: 'Owner',
        },
      })

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last Owner' },
          { status: 400 }
        )
      }
    }

    // Delete assignment
    await prisma.userRestaurant.delete({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
