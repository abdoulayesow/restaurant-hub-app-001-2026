import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface IngredientInput {
  itemId: string
  quantity: number
}

interface AvailabilityResult {
  itemId: string
  itemName: string
  unit: string
  required: number
  currentStock: number
  afterProduction: number
  unitCostGNF: number
  status: 'ok' | 'low' | 'insufficient'
}

// POST /api/production/check-availability
// Check if ingredients are available for production and calculate costs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bakeryId, ingredients } = body as {
      bakeryId: string
      ingredients: IngredientInput[]
    }

    if (!bakeryId) {
      return NextResponse.json({ error: 'bakeryId is required' }, { status: 400 })
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'ingredients array is required' }, { status: 400 })
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

    // Get all requested inventory items
    const itemIds = ingredients.map((ing) => ing.itemId)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: itemIds },
        bakeryId,
        isActive: true,
      },
    })

    // Create a map for quick lookup
    const itemMap = new Map(inventoryItems.map((item) => [item.id, item]))

    // Check availability for each ingredient
    const results: AvailabilityResult[] = []
    let allAvailable = true
    let totalEstimatedCostGNF = 0

    for (const ingredient of ingredients) {
      const item = itemMap.get(ingredient.itemId)

      if (!item) {
        // Item not found or doesn't belong to this bakery
        results.push({
          itemId: ingredient.itemId,
          itemName: 'Unknown Item',
          unit: '',
          required: ingredient.quantity,
          currentStock: 0,
          afterProduction: -ingredient.quantity,
          unitCostGNF: 0,
          status: 'insufficient',
        })
        allAvailable = false
        continue
      }

      const afterProduction = item.currentStock - ingredient.quantity
      const ingredientCost = ingredient.quantity * item.unitCostGNF
      totalEstimatedCostGNF += ingredientCost

      let status: 'ok' | 'low' | 'insufficient' = 'ok'
      if (afterProduction < 0) {
        status = 'insufficient'
        allAvailable = false
      } else if (afterProduction < item.minStock) {
        status = 'low'
      }

      results.push({
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        required: ingredient.quantity,
        currentStock: item.currentStock,
        afterProduction,
        unitCostGNF: item.unitCostGNF,
        status,
      })
    }

    return NextResponse.json({
      available: allAvailable,
      estimatedCostGNF: totalEstimatedCostGNF,
      items: results,
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
