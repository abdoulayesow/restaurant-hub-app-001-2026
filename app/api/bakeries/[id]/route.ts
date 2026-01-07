import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/bakeries/[id] - Fetch bakery details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: id
        }
      }
    })

    if (!userBakery) {
      return NextResponse.json(
        { error: 'You do not have access to this bakery' },
        { status: 403 }
      )
    }

    // Fetch bakery details
    const bakery = await prisma.bakery.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        openingDate: true,
        trackingStartDate: true,
        initialCapital: true,
        initialCashBalance: true,
        initialOrangeBalance: true,
        initialCardBalance: true,
        contactPhone: true,
        contactEmail: true,
        managerName: true,
        currency: true
      }
    })

    if (!bakery) {
      return NextResponse.json(
        { error: 'Bakery not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ bakery })
  } catch (error) {
    console.error('Error fetching bakery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/bakeries/[id] - Update bakery configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user has access to this bakery AND check Manager role (combined query)
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: id
        }
      },
      include: {
        user: {
          select: { role: true }
        }
      }
    })

    if (!userBakery) {
      return NextResponse.json(
        { error: 'You do not have access to this bakery' },
        { status: 403 }
      )
    }

    if (userBakery.user.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can update bakery configuration' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Bakery name is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (body.contactEmail) {
      const trimmedEmail = body.contactEmail.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate financial fields only if provided
    if (body.initialCapital !== undefined && body.initialCapital < 0) {
      return NextResponse.json(
        { error: 'Initial capital must be positive or zero' },
        { status: 400 }
      )
    }
    if (body.initialCashBalance !== undefined && body.initialCashBalance < 0) {
      return NextResponse.json(
        { error: 'Initial cash balance must be positive or zero' },
        { status: 400 }
      )
    }
    if (body.initialOrangeBalance !== undefined && body.initialOrangeBalance < 0) {
      return NextResponse.json(
        { error: 'Initial Orange Money balance must be positive or zero' },
        { status: 400 }
      )
    }
    if (body.initialCardBalance !== undefined && body.initialCardBalance < 0) {
      return NextResponse.json(
        { error: 'Initial card balance must be positive or zero' },
        { status: 400 }
      )
    }

    // Validate currency if provided
    const VALID_CURRENCIES = ['GNF', 'EUR', 'USD']
    if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Must be GNF, EUR, or USD' },
        { status: 400 }
      )
    }

    // Validate stockDeductionMode if provided
    if (body.stockDeductionMode && !['immediate', 'deferred'].includes(body.stockDeductionMode)) {
      return NextResponse.json(
        { error: 'Invalid stock deduction mode. Must be "immediate" or "deferred"' },
        { status: 400 }
      )
    }

    // Validate dates if provided
    if (body.openingDate) {
      const date = new Date(body.openingDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid openingDate format' },
          { status: 400 }
        )
      }
    }
    if (body.trackingStartDate) {
      const date = new Date(body.trackingStartDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid trackingStartDate format' },
          { status: 400 }
        )
      }
    }

    // Update bakery with conditional spread pattern
    const updatedBakery = await prisma.bakery.update({
      where: { id },
      data: {
        name: body.name.trim(),
        ...(body.location !== undefined && { location: body.location?.trim() || null }),
        ...(body.openingDate !== undefined && {
          openingDate: body.openingDate ? new Date(body.openingDate) : null
        }),
        ...(body.trackingStartDate !== undefined && {
          trackingStartDate: body.trackingStartDate ? new Date(body.trackingStartDate) : null
        }),
        ...(body.initialCapital !== undefined && { initialCapital: body.initialCapital }),
        ...(body.initialCashBalance !== undefined && { initialCashBalance: body.initialCashBalance }),
        ...(body.initialOrangeBalance !== undefined && { initialOrangeBalance: body.initialOrangeBalance }),
        ...(body.initialCardBalance !== undefined && { initialCardBalance: body.initialCardBalance }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone?.trim() || null }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail?.trim() || null }),
        ...(body.managerName !== undefined && { managerName: body.managerName?.trim() || null }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.stockDeductionMode !== undefined && { stockDeductionMode: body.stockDeductionMode }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      select: {
        id: true,
        name: true,
        location: true,
        openingDate: true,
        trackingStartDate: true,
        initialCapital: true,
        initialCashBalance: true,
        initialOrangeBalance: true,
        initialCardBalance: true,
        contactPhone: true,
        contactEmail: true,
        managerName: true,
        currency: true,
        stockDeductionMode: true,
        isActive: true
      }
    })

    return NextResponse.json({ bakery: updatedBakery })
  } catch (error) {
    console.error('Error updating bakery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
