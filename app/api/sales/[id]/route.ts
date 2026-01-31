import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, authorizeRestaurantAccess } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canEditApproved, canRecordSales } from '@/lib/roles'

// GET /api/sales/[id] - Get a single sale
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

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        restaurant: true,
        bankTransaction: {
          select: {
            id: true,
            status: true,
            confirmedAt: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                category: true,
                unit: true
              }
            }
          }
        },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: sale.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ sale })
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/sales/[id] - Update a sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant and permission to record sales
    const auth = await authorizeRestaurantAccess(
      session.user.id,
      existingSale.restaurantId,
      canRecordSales,
      'Your role does not have permission to edit sales'
    )
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Non-owners can only edit Pending sales
    if (!canEditApproved(auth.role) && existingSale.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Only pending sales can be edited. Contact the owner to modify approved records.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      cashGNF,
      orangeMoneyGNF,
      cardGNF,
      itemsCount,
      customersCount,
      receiptUrl,
      openingTime,
      closingTime,
      comments,
      saleItems, // Optional: array of sale items to replace existing
    } = body

    // Calculate new total
    const newCashGNF = cashGNF !== undefined ? cashGNF : existingSale.cashGNF
    const newOrangeMoneyGNF = orangeMoneyGNF !== undefined ? orangeMoneyGNF : existingSale.orangeMoneyGNF
    const newCardGNF = cardGNF !== undefined ? cardGNF : existingSale.cardGNF
    const totalGNF = newCashGNF + newOrangeMoneyGNF + newCardGNF

    // Validate saleItems if provided
    if (saleItems !== undefined && Array.isArray(saleItems)) {
      for (const item of saleItems) {
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json(
            { error: 'Each sale item must have a positive quantity' },
            { status: 400 }
          )
        }

        // If productId is provided, verify it exists and belongs to this restaurant
        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId }
          })

          if (!product) {
            return NextResponse.json(
              { error: `Product not found: ${item.productId}` },
              { status: 404 }
            )
          }

          if (product.restaurantId !== existingSale.restaurantId) {
            return NextResponse.json(
              { error: 'Product does not belong to this restaurant' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Use transaction to update sale and saleItems atomically
    const sale = await prisma.$transaction(async (tx) => {
      // Update sale
      await tx.sale.update({
        where: { id },
        data: {
          totalGNF,
          cashGNF: newCashGNF,
          orangeMoneyGNF: newOrangeMoneyGNF,
          cardGNF: newCardGNF,
          itemsCount: itemsCount !== undefined ? itemsCount : existingSale.itemsCount,
          customersCount: customersCount !== undefined ? customersCount : existingSale.customersCount,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : existingSale.receiptUrl,
          openingTime: openingTime !== undefined ? openingTime : existingSale.openingTime,
          closingTime: closingTime !== undefined ? closingTime : existingSale.closingTime,
          comments: comments !== undefined ? comments : existingSale.comments,
          // Keep existing status (editors can only edit Pending records anyway)
          status: existingSale.status,
          lastModifiedBy: session.user.id,
          lastModifiedByName: session.user.name || session.user.email,
        },
      })

      // Update saleItems if provided (replace strategy)
      if (saleItems !== undefined && Array.isArray(saleItems)) {
        // Delete existing saleItems
        await tx.saleItem.deleteMany({
          where: { saleId: id }
        })

        // Create new saleItems if any
        if (saleItems.length > 0) {
          await tx.saleItem.createMany({
            data: saleItems.map((item: { productId?: string; productName?: string; productNameFr?: string; quantity: number; unitPrice?: number }) => ({
              saleId: id,
              productId: item.productId || null,
              productName: item.productName?.trim() || null,
              productNameFr: item.productNameFr?.trim() || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice || null
            }))
          })
        }
      }

      // Fetch updated sale with relations
      return tx.sale.findUnique({
        where: { id },
        include: {
          bankTransaction: {
            select: {
              id: true,
              status: true,
              confirmedAt: true
            }
          },
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameFr: true,
                  category: true,
                  unit: true
                }
              }
            }
          },
        },
      })
    })

    return NextResponse.json({ sale })
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: DELETE is intentionally not implemented
// Sales should be rejected, not deleted, for audit trail
