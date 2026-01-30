import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'

// PUT /api/expense-groups/reorder - Bulk update sortOrder
export async function PUT(request: NextRequest) {
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
        { error: 'Only owners can reorder expense groups' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.updates || !Array.isArray(body.updates)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Validate updates structure
    for (const update of body.updates) {
      if (!update.id || typeof update.sortOrder !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id and sortOrder' },
          { status: 400 }
        )
      }
    }

    // Execute updates in transaction
    await prisma.$transaction(
      body.updates.map((update: { id: string; sortOrder: number }) =>
        prisma.expenseGroup.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering expense groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
