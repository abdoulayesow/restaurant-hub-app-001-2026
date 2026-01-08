import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductionStatus, SubmissionStatus, MovementType, Prisma } from '@prisma/client'

interface IngredientDetail {
  itemId: string
  itemName: string
  quantity: number
  unit: string
  unitCostGNF: number
}

// GET /api/production - List production logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bakeryId = searchParams.get('bakeryId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const status = searchParams.get('status') as SubmissionStatus | null
    const preparationStatus = searchParams.get('preparationStatus') as ProductionStatus | null

    if (!bakeryId) {
      return NextResponse.json({ error: 'bakeryId is required' }, { status: 400 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query filters
    const where: {
      bakeryId: string
      date?: { gte?: Date; lte?: Date }
      status?: SubmissionStatus
      preparationStatus?: ProductionStatus
    } = {
      bakeryId,
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    if (status) {
      where.status = status
    }

    if (preparationStatus) {
      where.preparationStatus = preparationStatus
    }

    const productionLogs = await prisma.productionLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        stockMovements: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ productionLogs })
  } catch (error) {
    console.error('Error fetching production logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/production - Create production log with auto stock deduction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bakeryId,
      date,
      productName,
      productNameFr,
      quantity,
      ingredients,
      ingredientDetails,
      notes,
      deductStock = true, // Whether to deduct stock immediately
    } = body as {
      bakeryId: string
      date: string
      productName: string
      productNameFr?: string
      quantity: number
      ingredients: string[]
      ingredientDetails: IngredientDetail[]
      notes?: string
      deductStock?: boolean
    }

    // Validate required fields
    if (!bakeryId || !date || !productName || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: bakeryId, date, productName, quantity' },
        { status: 400 }
      )
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch bakery to check stock deduction mode
    const bakery = await prisma.bakery.findUnique({
      where: { id: bakeryId },
      select: { stockDeductionMode: true },
    })

    if (!bakery) {
      return NextResponse.json({ error: 'Bakery not found' }, { status: 404 })
    }

    // Determine if we should deduct stock now based on bakery settings
    const shouldDeductNow =
      deductStock && bakery.stockDeductionMode === 'immediate'

    // If ingredient details provided, verify availability first
    if (shouldDeductNow && ingredientDetails && ingredientDetails.length > 0) {
      const itemIds = ingredientDetails.map((ing) => ing.itemId)
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          id: { in: itemIds },
          bakeryId,
          isActive: true,
        },
      })

      const itemMap = new Map(inventoryItems.map((item) => [item.id, item]))

      // Check for insufficient stock
      for (const ingredient of ingredientDetails) {
        const item = itemMap.get(ingredient.itemId)
        if (!item) {
          return NextResponse.json(
            { error: `Ingredient not found: ${ingredient.itemId}` },
            { status: 400 }
          )
        }
        if (item.currentStock < ingredient.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${item.name}: have ${item.currentStock}, need ${ingredient.quantity}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Calculate estimated cost
    let estimatedCostGNF = 0
    if (ingredientDetails && ingredientDetails.length > 0) {
      estimatedCostGNF = ingredientDetails.reduce(
        (sum, ing) => sum + ing.quantity * ing.unitCostGNF,
        0
      )
    }

    // Create production log with stock deduction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the production log
      const productionLog = await tx.productionLog.create({
        data: {
          bakeryId,
          date: new Date(date),
          productName,
          productNameFr: productNameFr || null,
          quantity,
          ingredients: (ingredients || []) as Prisma.InputJsonValue,
          ingredientDetails: ingredientDetails
            ? (ingredientDetails as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          estimatedCostGNF,
          preparationStatus: ProductionStatus.Planning,
          notes: notes || null,
          status: SubmissionStatus.Pending,
          stockDeducted: shouldDeductNow,
          stockDeductedAt: shouldDeductNow ? new Date() : null,
          createdBy: session.user.id,
          createdByName: session.user.name || session.user.email || undefined,
        },
      })

      // If shouldDeductNow is true and we have ingredient details, create stock movements
      if (shouldDeductNow && ingredientDetails && ingredientDetails.length > 0) {
        for (const ingredient of ingredientDetails) {
          // Create stock movement (negative quantity for usage)
          await tx.stockMovement.create({
            data: {
              bakeryId,
              itemId: ingredient.itemId,
              type: MovementType.Usage,
              quantity: -ingredient.quantity, // Negative for usage
              unitCost: ingredient.unitCostGNF,
              reason: `Production: ${productName} (qty: ${quantity})`,
              productionLogId: productionLog.id,
              createdBy: session.user.id,
              createdByName: session.user.name || session.user.email || undefined,
            },
          })

          // Update inventory item stock
          await tx.inventoryItem.update({
            where: { id: ingredient.itemId },
            data: {
              currentStock: {
                decrement: ingredient.quantity,
              },
            },
          })
        }
      }

      return productionLog
    })

    // Fetch the complete production log with stock movements
    const productionLog = await prisma.productionLog.findUnique({
      where: { id: result.id },
      include: {
        stockMovements: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ productionLog }, { status: 201 })
  } catch (error) {
    console.error('Error creating production log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
