import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/reconciliation/[id] - Get single reconciliation with items
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

    const reconciliation = await prisma.stockReconciliation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                unit: true,
                category: true,
                currentStock: true,
              },
            },
          },
        },
      },
    })

    if (!reconciliation) {
      return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: reconciliation.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ reconciliation })
  } catch (error) {
    console.error('Error fetching reconciliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/reconciliation/[id] - Approve or reject reconciliation (Manager only)
export async function PATCH(
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
    const body = await request.json()
    const { action } = body // 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 })
    }

    // Get reconciliation with items
    const reconciliation = await prisma.stockReconciliation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    if (!reconciliation) {
      return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    }

    if (reconciliation.status !== 'Pending') {
      return NextResponse.json({
        error: `Reconciliation already ${reconciliation.status.toLowerCase()}`
      }, { status: 400 })
    }

    // Validate user has access to this restaurant
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: reconciliation.restaurantId,
        },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'reject') {
      // Simply update status to Rejected
      const updated = await prisma.stockReconciliation.update({
        where: { id },
        data: {
          status: 'Rejected',
          approvedBy: session.user.id,
          approvedByName: session.user.name || undefined,
          approvedAt: new Date(),
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  nameFr: true,
                  unit: true,
                  category: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ reconciliation: updated })
    }

    // Approve: Create adjustment movements and update stock
    const stockMovementsData = reconciliation.items
      .filter(item => item.variance !== 0)
      .map(item => ({
        restaurantId: reconciliation.restaurantId,
        itemId: item.inventoryItemId,
        type: 'Adjustment' as const,
        quantity: item.variance, // Positive for gain, negative for loss
        reason: `Reconciliation: physical count ${item.physicalCount}, system had ${item.systemStock}`,
        createdBy: session.user.id,
        createdByName: session.user.name || undefined,
      }))

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movements for items with variance
      if (stockMovementsData.length > 0) {
        await tx.stockMovement.createMany({
          data: stockMovementsData,
        })
      }

      // Update inventory item stock levels
      for (const item of reconciliation.items) {
        if (item.variance !== 0) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              currentStock: item.physicalCount,
            },
          })
        }

        // Mark reconciliation item as applied
        await tx.reconciliationItem.update({
          where: { id: item.id },
          data: { adjustmentApplied: true },
        })
      }

      // Update reconciliation status
      const updated = await tx.stockReconciliation.update({
        where: { id },
        data: {
          status: 'Approved',
          approvedBy: session.user.id,
          approvedByName: session.user.name || undefined,
          approvedAt: new Date(),
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  nameFr: true,
                  unit: true,
                  category: true,
                },
              },
            },
          },
        },
      })

      return updated
    })

    return NextResponse.json({
      reconciliation: result,
      adjustmentsApplied: stockMovementsData.length
    })
  } catch (error) {
    console.error('Error processing reconciliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
