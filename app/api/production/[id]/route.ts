import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductionStatus, SubmissionStatus } from '@prisma/client'
import { isManagerRole } from '@/lib/roles'

// GET /api/production/[id] - Get single production log
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

    const productionLog = await prisma.productionLog.findUnique({
      where: { id },
      include: {
        bakery: {
          select: {
            id: true,
            name: true,
          },
        },
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

    if (!productionLog) {
      return NextResponse.json({ error: 'Production log not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: productionLog.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ productionLog })
  } catch (error) {
    console.error('Error fetching production log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/production/[id] - Update production log
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Find the production log
    const existingLog = await prisma.productionLog.findUnique({
      where: { id },
      include: {
        stockMovements: true,
      },
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'Production log not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: existingLog.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      preparationStatus,
      status,
      notes,
      productName,
      productNameFr,
      quantity,
    } = body as {
      preparationStatus?: ProductionStatus
      status?: SubmissionStatus
      notes?: string
      productName?: string
      productNameFr?: string
      quantity?: number
    }

    // Build update data
    const updateData: {
      preparationStatus?: ProductionStatus
      status?: SubmissionStatus
      notes?: string
      productName?: string
      productNameFr?: string
      quantity?: number
    } = {}

    if (preparationStatus) {
      updateData.preparationStatus = preparationStatus
    }

    // Only managers can approve/reject
    if (status) {
      if (
        (status === SubmissionStatus.Approved || status === SubmissionStatus.Rejected) &&
        !isManagerRole(session.user.role)
      ) {
        return NextResponse.json(
          { error: 'Only managers can approve or reject production logs' },
          { status: 403 }
        )
      }
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (productName) {
      updateData.productName = productName
    }

    if (productNameFr !== undefined) {
      updateData.productNameFr = productNameFr
    }

    if (quantity !== undefined) {
      updateData.quantity = quantity
    }

    // Check if we're changing status to Complete and stock hasn't been deducted yet
    const isChangingToComplete =
      preparationStatus === ProductionStatus.Complete &&
      existingLog.preparationStatus !== ProductionStatus.Complete

    const needsDeferredDeduction = isChangingToComplete && !existingLog.stockDeducted

    // If deferred deduction is needed, execute it in a transaction
    if (needsDeferredDeduction) {
      const ingredientDetails = existingLog.ingredientDetails as any[]

      if (ingredientDetails && ingredientDetails.length > 0) {
        await prisma.$transaction(async (tx) => {
          // Re-validate ingredient availability
          const itemIds = ingredientDetails.map((ing) => ing.itemId)
          const inventoryItems = await tx.inventoryItem.findMany({
            where: {
              id: { in: itemIds },
              bakeryId: existingLog.bakeryId,
              isActive: true,
            },
          })

          const itemMap = new Map(inventoryItems.map((item) => [item.id, item]))

          // Check for insufficient stock
          for (const ingredient of ingredientDetails) {
            const item = itemMap.get(ingredient.itemId)
            if (!item) {
              throw new Error(`Ingredient not found: ${ingredient.itemName}`)
            }
            if (item.currentStock < ingredient.quantity) {
              throw new Error(
                `Insufficient stock for ${item.name}: have ${item.currentStock}, need ${ingredient.quantity}`
              )
            }
          }

          // Create stock movements and update inventory
          for (const ingredient of ingredientDetails) {
            await tx.stockMovement.create({
              data: {
                bakeryId: existingLog.bakeryId,
                itemId: ingredient.itemId,
                type: 'Usage' as any,
                quantity: -ingredient.quantity,
                unitCost: ingredient.unitCostGNF,
                reason: `Production: ${existingLog.productName} (qty: ${existingLog.quantity})`,
                productionLogId: id,
                createdBy: session.user.id,
                createdByName: session.user.name || session.user.email || undefined,
              },
            })

            await tx.inventoryItem.update({
              where: { id: ingredient.itemId },
              data: {
                currentStock: {
                  decrement: ingredient.quantity,
                },
              },
            })
          }

          // Update production log to mark stock as deducted
          await tx.productionLog.update({
            where: { id },
            data: {
              stockDeducted: true,
              stockDeductedAt: new Date(),
              ...updateData,
            },
          })
        })

        // Fetch the updated production log
        const productionLog = await prisma.productionLog.findUnique({
          where: { id },
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

        return NextResponse.json({ productionLog })
      }
    }

    // Normal update (no deferred deduction needed)
    const productionLog = await prisma.productionLog.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ productionLog })
  } catch (error) {
    console.error('Error updating production log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/production/[id] - Delete production log (Manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isManagerRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Find the production log
    const existingLog = await prisma.productionLog.findUnique({
      where: { id },
      include: {
        stockMovements: true,
      },
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'Production log not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: existingLog.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Reverse stock movements if any exist, then delete
    await prisma.$transaction(async (tx) => {
      // Reverse stock deductions
      for (const movement of existingLog.stockMovements) {
        // If it was a usage (negative), add it back
        if (movement.quantity < 0) {
          await tx.inventoryItem.update({
            where: { id: movement.itemId },
            data: {
              currentStock: {
                increment: Math.abs(movement.quantity),
              },
            },
          })
        }
      }

      // Delete stock movements
      await tx.stockMovement.deleteMany({
        where: { productionLogId: id },
      })

      // Delete production log
      await tx.productionLog.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting production log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
