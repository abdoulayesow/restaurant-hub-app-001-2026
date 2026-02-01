import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, authorizeRestaurantAccess } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/roles'
import { sendNotification } from '@/lib/notification-service'

// POST /api/expenses/[id]/approve - Approve or reject an expense (Manager only)
export async function POST(
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

    // Validate user has access and permission to approve expenses
    const auth = await authorizeRestaurantAccess(
      session.user.id,
      existingExpense.restaurantId,
      canApprove,
      'Your role does not have permission to approve expenses'
    )
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected'

    // Update expense status
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: session.user.id,
        approvedByName: session.user.name || session.user.email,
        approvedAt: new Date(),
        // Optionally append rejection reason to comments
        comments: action === 'reject' && reason
          ? `${existingExpense.comments ? existingExpense.comments + '\n' : ''}[Rejected: ${reason}]`
          : existingExpense.comments,
      },
      include: {
        restaurant: true,
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
      },
    })

    // If approved, create stock movements for inventory purchases
    // Note: DailySummary is now updated at payment time (when money actually moves)
    if (action === 'approve') {
      // Create stock movements for inventory purchases
      if (existingExpense.isInventoryPurchase) {
        const expenseItems = await prisma.expenseItem.findMany({
          where: { expenseId: expense.id },
          include: { inventoryItem: true },
        })

        if (expenseItems.length > 0) {
          // Create stock movements and update inventory in a transaction
          await prisma.$transaction(async (tx) => {
            for (const item of expenseItems) {
              // Create Purchase stock movement
              await tx.stockMovement.create({
                data: {
                  restaurantId: expense.restaurantId,
                  itemId: item.inventoryItemId,
                  type: 'Purchase',
                  quantity: item.quantity,
                  unitCost: item.unitCostGNF,
                  reason: `Expense: ${expense.categoryName}`,
                  expenseId: expense.id,
                  createdBy: session.user.id,
                  createdByName: session.user.name || session.user.email,
                },
              })

              // Update inventory currentStock and unitCostGNF
              await tx.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: {
                  currentStock: { increment: item.quantity },
                  unitCostGNF: item.unitCostGNF, // Update to latest cost
                },
              })
            }
          })
        }
      }
    }

    // Send SMS notification to submitter
    if (expense.submittedBy) {
      const notificationType = action === 'approve' ? 'expense_approved' : 'expense_rejected'
      await sendNotification({
        restaurantId: expense.restaurantId,
        type: notificationType,
        recipientUserId: expense.submittedBy,
        data: {
          amount: expense.amountGNF,
          category: expense.categoryName || 'General',
          reason: reason || '',
        },
      }).catch(err => console.error('Failed to send SMS notification:', err))
    }

    // Notify manager if large expense (threshold: 500,000 GNF)
    if (expense.amountGNF >= 500000) {
      await sendNotification({
        restaurantId: expense.restaurantId,
        type: 'large_expense',
        recipientType: 'manager',
        data: {
          amount: expense.amountGNF,
          category: expense.categoryName || 'General',
          submitter: session.user.name || session.user.email,
        },
      }).catch(err => console.error('Failed to send large expense alert:', err))
    }

    return NextResponse.json({
      expense,
      message: `Expense ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      stockMovementsCreated: action === 'approve' && existingExpense.isInventoryPurchase,
    })
  } catch (error) {
    console.error('Error approving/rejecting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
