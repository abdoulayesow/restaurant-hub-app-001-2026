import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// GET /api/expenses/[id] - Get a single expense
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

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        bakery: true,
        category: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            color: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        expenseItems: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: expense.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/expenses/[id] - Update an expense
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

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: existingExpense.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isManager = isManagerRole(session.user.role)

    // Editors can only edit Pending expenses, Managers can edit any
    if (!isManager && existingExpense.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Only pending expenses can be edited by non-managers' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      categoryId,
      categoryName,
      amountGNF,
      amountEUR,
      paymentMethod,
      description,
      receiptUrl,
      comments,
      transactionRef,
      supplierId,
      isInventoryPurchase,
      expenseItems, // Array of { inventoryItemId, quantity, unitCostGNF } or undefined to keep existing
    } = body

    // Validate payment method if provided
    if (paymentMethod && !['Cash', 'OrangeMoney', 'Card'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid paymentMethod. Must be Cash, OrangeMoney, or Card' },
        { status: 400 }
      )
    }

    // Validate amount if provided
    if (amountGNF !== undefined && amountGNF <= 0) {
      return NextResponse.json(
        { error: 'amountGNF must be greater than 0' },
        { status: 400 }
      )
    }

    // Determine final isInventoryPurchase value
    const finalIsInventoryPurchase = isInventoryPurchase !== undefined ? isInventoryPurchase : existingExpense.isInventoryPurchase

    // Validate expense items if provided
    if (expenseItems !== undefined && finalIsInventoryPurchase && expenseItems.length > 0) {
      const inventoryItemIds = expenseItems.map((item: { inventoryItemId: string }) => item.inventoryItemId)
      const validItems = await prisma.inventoryItem.findMany({
        where: {
          id: { in: inventoryItemIds },
          bakeryId: existingExpense.bakeryId,
          isActive: true,
        },
        select: { id: true },
      })

      if (validItems.length !== inventoryItemIds.length) {
        return NextResponse.json(
          { error: 'One or more inventory items are invalid or do not belong to this bakery' },
          { status: 400 }
        )
      }

      for (const item of expenseItems) {
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json({ error: 'Each item must have a quantity greater than 0' }, { status: 400 })
        }
        if (item.unitCostGNF === undefined || item.unitCostGNF < 0) {
          return NextResponse.json({ error: 'Each item must have a valid unit cost' }, { status: 400 })
        }
      }
    }

    // Update expense with items in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      // Update expense
      await tx.expense.update({
        where: { id },
        data: {
          categoryId: categoryId !== undefined ? (categoryId || null) : existingExpense.categoryId,
          categoryName: categoryName !== undefined ? categoryName : existingExpense.categoryName,
          amountGNF: amountGNF !== undefined ? amountGNF : existingExpense.amountGNF,
          amountEUR: amountEUR !== undefined ? amountEUR : existingExpense.amountEUR,
          paymentMethod: paymentMethod !== undefined ? paymentMethod : existingExpense.paymentMethod,
          description: description !== undefined ? (description || null) : existingExpense.description,
          receiptUrl: receiptUrl !== undefined ? (receiptUrl || null) : existingExpense.receiptUrl,
          comments: comments !== undefined ? (comments || null) : existingExpense.comments,
          transactionRef: transactionRef !== undefined ? (transactionRef || null) : existingExpense.transactionRef,
          supplierId: supplierId !== undefined ? (supplierId || null) : existingExpense.supplierId,
          isInventoryPurchase: finalIsInventoryPurchase,
          // If a non-manager edits, reset to Pending for re-approval
          status: !isManager && existingExpense.status === 'Pending' ? 'Pending' : existingExpense.status,
          lastModifiedBy: session.user.id,
          lastModifiedByName: session.user.name || session.user.email,
          lastModifiedAt: new Date(),
        },
      })

      // Update expense items if provided
      if (expenseItems !== undefined) {
        // Delete existing items
        await tx.expenseItem.deleteMany({ where: { expenseId: id } })

        // Create new items if inventory purchase
        if (finalIsInventoryPurchase && expenseItems.length > 0) {
          await tx.expenseItem.createMany({
            data: expenseItems.map((item: { inventoryItemId: string; quantity: number; unitCostGNF: number }) => ({
              expenseId: id,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitCostGNF: item.unitCostGNF,
            })),
          })
        }
      }

      // Fetch complete expense with relations
      return tx.expense.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              color: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          expenseItems: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  nameFr: true,
                  unit: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: DELETE is intentionally not implemented
// Expenses should be rejected, not deleted, for audit trail
