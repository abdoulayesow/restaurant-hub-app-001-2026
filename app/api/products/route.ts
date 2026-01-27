import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'
import { isValidProductCategory, ProductCategoryValue } from '@/lib/constants/product-categories'
import { ProductCategory, Prisma } from '@prisma/client'

// GET /api/products - List products for a restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const category = searchParams.get('category') as ProductCategoryValue | null
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default to true

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Validate user has access to this restaurant
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
      isActive?: boolean
      category?: ProductCategory
    } = {
      restaurantId,
    }

    if (activeOnly) {
      where.isActive = true
    }

    if (category && isValidProductCategory(category)) {
      where.category = category as ProductCategory
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/products - Create new product (Manager only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Manager role required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      restaurantId,
      name,
      nameFr,
      category,
      unit = 'piece',
      standardRecipe,
      sortOrder = 0,
    } = body as {
      restaurantId: string
      name: string
      nameFr?: string
      category: ProductCategoryValue
      unit?: string
      standardRecipe?: unknown
      sortOrder?: number
    }

    if (!restaurantId || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, name, category' },
        { status: 400 }
      )
    }

    // Validate category
    if (!isValidProductCategory(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be Patisserie or Boulangerie' },
        { status: 400 }
      )
    }

    // Validate user has access to this restaurant
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

    // Create product
    const product = await prisma.product.create({
      data: {
        restaurantId,
        name,
        nameFr: nameFr || null,
        category: category as ProductCategory,
        unit,
        standardRecipe: standardRecipe
          ? (standardRecipe as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        sortOrder,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
