import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, authorizeRestaurantAccess } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductionStatus, SubmissionStatus, MovementType, Prisma, ProductCategory } from '@prisma/client'
import { isValidProductCategory } from '@/lib/constants/product-categories'
import { parseToUTCDate, parseToUTCEndOfDay } from '@/lib/date-utils'
import { canRecordProduction } from '@/lib/roles'

interface IngredientDetail {
  itemId: string
  itemName: string
  quantity: number
  unit: string
  unitCostGNF: number
}

interface ProductionItemInput {
  productId: string
  quantity: number
}

// GET /api/production - List production logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const status = searchParams.get('status') as SubmissionStatus | null
    const preparationStatus = searchParams.get('preparationStatus') as ProductionStatus | null
    const productionType = searchParams.get('productionType') as ProductCategory | null

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Validate user has access to this bakery
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query filters
    const where: {
      restaurantId: string
      date?: { gte?: Date; lte?: Date }
      status?: SubmissionStatus
      preparationStatus?: ProductionStatus
      productionType?: ProductCategory
    } = {
      restaurantId,
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = parseToUTCDate(dateFrom)
      }
      if (dateTo) {
        where.date.lte = parseToUTCEndOfDay(dateTo)
      }
    }

    if (status) {
      where.status = status
    }

    if (preparationStatus) {
      where.preparationStatus = preparationStatus
    }

    if (productionType && isValidProductCategory(productionType)) {
      where.productionType = productionType
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
        productionItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                category: true,
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
      restaurantId,
      date,
      productionType,
      productionItems,
      productName,
      productNameFr,
      quantity,
      ingredients,
      ingredientDetails,
      notes,
      deductStock = true, // Whether to deduct stock immediately
    } = body as {
      restaurantId: string
      date: string
      productionType?: string
      productionItems?: ProductionItemInput[]
      productName?: string
      productNameFr?: string
      quantity?: number
      ingredients?: string[]
      ingredientDetails?: IngredientDetail[]
      notes?: string
      deductStock?: boolean
    }

    // Validate required fields
    if (!restaurantId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, date' },
        { status: 400 }
      )
    }

    // Validate productionType if provided
    if (productionType && !isValidProductCategory(productionType)) {
      return NextResponse.json(
        { error: 'Invalid productionType. Must be Patisserie or Boulangerie' },
        { status: 400 }
      )
    }

    // If using new multi-product format, validate productionItems
    const useMultiProduct = productionItems && productionItems.length > 0

    if (useMultiProduct) {
      // New format: productionType and productionItems required
      if (!productionType) {
        return NextResponse.json(
          { error: 'productionType is required when using productionItems' },
          { status: 400 }
        )
      }

      // Validate all products exist and are active
      const productIds = productionItems.map(item => item.productId)
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          restaurantId,
          isActive: true,
        },
      })

      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: 'One or more products not found or inactive' },
          { status: 400 }
        )
      }

      // Validate quantities
      for (const item of productionItems) {
        if (item.quantity < 1) {
          return NextResponse.json(
            { error: 'Product quantities must be at least 1' },
            { status: 400 }
          )
        }
      }
    } else {
      // Legacy format: productName and quantity required
      if (!productName || !quantity) {
        return NextResponse.json(
          { error: 'Missing required fields: productName, quantity (or use productionItems)' },
          { status: 400 }
        )
      }
    }

    // Validate user has access to this bakery and permission to record production
    const auth = await authorizeRestaurantAccess(
      session.user.id,
      restaurantId,
      canRecordProduction,
      'Your role does not have permission to record production'
    )
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Fetch bakery to check stock deduction mode
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { stockDeductionMode: true },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Determine if we should deduct stock now based on bakery settings
    const shouldDeductNow =
      deductStock && restaurant.stockDeductionMode === 'immediate'

    // If ingredient details provided, verify availability first
    if (shouldDeductNow && ingredientDetails && ingredientDetails.length > 0) {
      const itemIds = ingredientDetails.map((ing) => ing.itemId)
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          id: { in: itemIds },
          restaurantId,
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

    // Determine productName for display (first product name if multi-product)
    let displayProductName = productName || ''
    let displayQuantity = quantity || 0

    if (useMultiProduct && productionItems) {
      // Fetch first product name for legacy display
      const firstProduct = await prisma.product.findUnique({
        where: { id: productionItems[0].productId },
        select: { name: true, nameFr: true },
      })
      displayProductName = firstProduct?.name || 'Multiple Products'
      displayQuantity = productionItems.reduce((sum, item) => sum + item.quantity, 0)
    }

    // Create production log with stock deduction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the production log
      const productionLog = await tx.productionLog.create({
        data: {
          restaurantId,
          date: parseToUTCDate(date),
          productionType: productionType ? (productionType as ProductCategory) : null,
          productName: displayProductName,
          productNameFr: productNameFr || null,
          quantity: displayQuantity,
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

      // Create ProductionItem records for multi-product support
      if (useMultiProduct && productionItems) {
        for (const item of productionItems) {
          await tx.productionItem.create({
            data: {
              productionLogId: productionLog.id,
              productId: item.productId,
              quantity: item.quantity,
            },
          })
        }
      }

      // If shouldDeductNow is true and we have ingredient details, create stock movements
      if (shouldDeductNow && ingredientDetails && ingredientDetails.length > 0) {
        for (const ingredient of ingredientDetails) {
          // Create stock movement (negative quantity for usage)
          await tx.stockMovement.create({
            data: {
              restaurantId,
              itemId: ingredient.itemId,
              type: MovementType.Usage,
              quantity: -ingredient.quantity, // Negative for usage
              unitCost: ingredient.unitCostGNF,
              reason: `Production: ${displayProductName} (qty: ${displayQuantity})`,
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

    // Fetch the complete production log with stock movements and production items
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
        productionItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                category: true,
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
