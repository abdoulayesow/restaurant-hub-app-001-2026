import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/cash-deposits - List cash deposits for a bakery
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bakeryId = searchParams.get('bakeryId')
    const status = searchParams.get('status') // "Pending" | "Deposited"

    if (!bakeryId) {
      return NextResponse.json(
        { error: 'Bakery ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: bakeryId
        }
      }
    })

    if (!userBakery) {
      return NextResponse.json(
        { error: 'Access denied to this bakery' },
        { status: 403 }
      )
    }

    // Build where clause
    const whereClause: any = { bakeryId }
    if (status === 'Pending' || status === 'Deposited') {
      whereClause.status = status
    }

    // Fetch deposits
    const deposits = await prisma.cashDeposit.findMany({
      where: whereClause,
      include: {
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error('Error fetching cash deposits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cash-deposits - Create new cash deposit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true }
    })

    if (user?.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Only managers can create cash deposits' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.bakeryId) {
      return NextResponse.json(
        { error: 'Bakery ID is required' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }

    // Verify user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: body.bakeryId
        }
      }
    })

    if (!userBakery) {
      return NextResponse.json(
        { error: 'Access denied to this bakery' },
        { status: 403 }
      )
    }

    // If saleId provided, check it's not already linked to another deposit
    if (body.saleId) {
      const existingDeposit = await prisma.cashDeposit.findUnique({
        where: { saleId: body.saleId }
      })

      if (existingDeposit) {
        return NextResponse.json(
          { error: 'This sale is already linked to another deposit' },
          { status: 400 }
        )
      }
    }

    // Parse date
    const depositDate = new Date(body.date)
    if (isNaN(depositDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Create deposit
    const deposit = await prisma.cashDeposit.create({
      data: {
        bakeryId: body.bakeryId,
        date: depositDate,
        amount: body.amount,
        status: 'Pending',
        saleId: body.saleId || null,
        comments: body.comments?.trim() || null,
        depositedBy: session.user.id,
        depositedByName: user.name || null
      },
      include: {
        sale: {
          select: {
            id: true,
            date: true,
            totalGNF: true
          }
        }
      }
    })

    return NextResponse.json({ deposit }, { status: 201 })
  } catch (error) {
    console.error('Error creating cash deposit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
