import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/bakery/settings - Fetch bakery settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bakeryId = searchParams.get('bakeryId')

    if (!bakeryId) {
      return NextResponse.json({ error: 'Bakery ID is required' }, { status: 400 })
    }

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch bakery settings
    const bakery = await prisma.bakery.findUnique({
      where: { id: bakeryId },
      select: {
        id: true,
        name: true,
        stockDeductionMode: true,
      },
    })

    if (!bakery) {
      return NextResponse.json({ error: 'Bakery not found' }, { status: 404 })
    }

    return NextResponse.json({
      bakeryId: bakery.id,
      bakeryName: bakery.name,
      stockDeductionMode: bakery.stockDeductionMode,
    })
  } catch (error) {
    console.error('Error fetching bakery settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bakery settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/bakery/settings - Update bakery settings (Manager only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a Manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can update bakery settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bakeryId, stockDeductionMode } = body

    if (!bakeryId) {
      return NextResponse.json({ error: 'Bakery ID is required' }, { status: 400 })
    }

    if (!stockDeductionMode) {
      return NextResponse.json(
        { error: 'Stock deduction mode is required' },
        { status: 400 }
      )
    }

    // Validate stock deduction mode
    if (!['immediate', 'deferred'].includes(stockDeductionMode)) {
      return NextResponse.json(
        { error: 'Invalid stock deduction mode. Must be "immediate" or "deferred"' },
        { status: 400 }
      )
    }

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update bakery settings
    const updatedBakery = await prisma.bakery.update({
      where: { id: bakeryId },
      data: { stockDeductionMode },
      select: {
        id: true,
        name: true,
        stockDeductionMode: true,
      },
    })

    return NextResponse.json({
      message: 'Bakery settings updated successfully',
      bakery: {
        bakeryId: updatedBakery.id,
        bakeryName: updatedBakery.name,
        stockDeductionMode: updatedBakery.stockDeductionMode,
      },
    })
  } catch (error) {
    console.error('Error updating bakery settings:', error)
    return NextResponse.json(
      { error: 'Failed to update bakery settings' },
      { status: 500 }
    )
  }
}
