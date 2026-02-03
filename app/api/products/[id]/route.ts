import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'
import { isValidProductCategory, ProductCategoryValue } from '@/lib/constants/product-categories'
import { ProductCategory, Prisma } from '@prisma/client'

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: product.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/products/[id] - Update product (Manager only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Manager role required' }, { status: 403 })
    }

    const { id } = await params

    // First, get the existing product to check restaurant access
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingProduct.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      nameFr,
      category,
      unit,
      priceGNF,
      standardRecipe,
      isActive,
      sortOrder,
    } = body as {
      name?: string
      nameFr?: string | null
      category?: ProductCategoryValue
      unit?: string
      priceGNF?: number | null
      standardRecipe?: unknown
      isActive?: boolean
      sortOrder?: number
    }

    // Validate category if provided
    if (category !== undefined && !isValidProductCategory(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be Patisserie or Boulangerie' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: Prisma.ProductUpdateInput = {}
    if (name !== undefined) updateData.name = name
    if (nameFr !== undefined) updateData.nameFr = nameFr
    if (category !== undefined) updateData.category = category as ProductCategory
    if (unit !== undefined) updateData.unit = unit
    if (priceGNF !== undefined) updateData.priceGNF = priceGNF
    if (standardRecipe !== undefined) {
      updateData.standardRecipe = standardRecipe === null
        ? Prisma.JsonNull
        : (standardRecipe as Prisma.InputJsonValue)
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Soft delete product (Manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Manager role
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Manager role required' }, { status: 403 })
    }

    const { id } = await params

    // First, get the existing product to check restaurant access
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: existingProduct.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
