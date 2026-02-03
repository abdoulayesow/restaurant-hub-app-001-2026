import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOwner } from '@/lib/roles'

// Data types that can be reset
type ResetType = 'sales' | 'expenses' | 'debts' | 'bank' | 'production' | 'inventory'

const VALID_RESET_TYPES: ResetType[] = ['sales', 'expenses', 'debts', 'bank', 'production', 'inventory']

// GET /api/admin/reset - Preview counts (dry-run)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    // Verify user has access to this restaurant and is Owner
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: restaurantId,
        },
      },
      select: { role: true },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!isOwner(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can access data reset' },
        { status: 403 }
      )
    }

    // Count records for each type
    const [
      salesCount,
      saleItemsCount,
      expensesCount,
      expensePaymentsCount,
      debtsCount,
      debtPaymentsCount,
      bankTransactionsCount,
      productionLogsCount,
      productionItemsCount,
      stockMovementsCount,
      inventoryItemsCount,
    ] = await Promise.all([
      prisma.sale.count({ where: { restaurantId } }),
      prisma.saleItem.count({ where: { sale: { restaurantId } } }),
      prisma.expense.count({ where: { restaurantId } }),
      prisma.expensePayment.count({ where: { expense: { restaurantId } } }),
      prisma.debt.count({ where: { restaurantId } }),
      prisma.debtPayment.count({ where: { debt: { restaurantId } } }),
      prisma.bankTransaction.count({ where: { restaurantId } }),
      prisma.productionLog.count({ where: { restaurantId } }),
      prisma.productionItem.count({ where: { productionLog: { restaurantId } } }),
      prisma.stockMovement.count({ where: { restaurantId } }),
      prisma.inventoryItem.count({ where: { restaurantId } }),
    ])

    return NextResponse.json({
      sales: {
        records: salesCount,
        relatedRecords: saleItemsCount,
        description: 'Sales and sale items',
      },
      expenses: {
        records: expensesCount,
        relatedRecords: expensePaymentsCount,
        description: 'Expenses and expense payments',
      },
      debts: {
        records: debtsCount,
        relatedRecords: debtPaymentsCount,
        description: 'Debts and debt payments',
      },
      bank: {
        records: bankTransactionsCount,
        relatedRecords: 0,
        description: 'Bank transactions',
      },
      production: {
        records: productionLogsCount,
        relatedRecords: productionItemsCount,
        description: 'Production logs and production items',
      },
      inventory: {
        records: stockMovementsCount,
        relatedRecords: inventoryItemsCount,
        description: 'Stock movements (items preserved)',
      },
    })
  } catch (error) {
    console.error('Error fetching reset preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reset preview' },
      { status: 500 }
    )
  }
}

// POST /api/admin/reset - Execute reset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantId, types, confirmationPhrase } = body as {
      restaurantId: string
      types: ResetType[]
      confirmationPhrase: string
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    if (!types || !Array.isArray(types) || types.length === 0) {
      return NextResponse.json({ error: 'At least one reset type is required' }, { status: 400 })
    }

    // Validate reset types
    const invalidTypes = types.filter(t => !VALID_RESET_TYPES.includes(t))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid reset types: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify user has access to this restaurant and is Owner
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId: restaurantId,
        },
      },
      include: {
        restaurant: { select: { name: true } },
      },
    })

    if (!userRestaurant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!isOwner(userRestaurant.role)) {
      return NextResponse.json(
        { error: 'Only owners can reset data' },
        { status: 403 }
      )
    }

    // Validate confirmation phrase
    const expectedPhrase = userRestaurant.restaurant.name.toUpperCase()
    if (confirmationPhrase?.toUpperCase() !== expectedPhrase) {
      return NextResponse.json(
        { error: 'Confirmation phrase does not match restaurant name' },
        { status: 400 }
      )
    }

    // Execute reset in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const deleted: Record<string, { count: number; related?: number }> = {}

      // Order matters due to foreign keys
      // 1. Delete dependent records first

      if (types.includes('sales')) {
        // Delete sale items first
        const saleItemsResult = await tx.saleItem.deleteMany({
          where: { sale: { restaurantId } },
        })
        // Delete sales
        const salesResult = await tx.sale.deleteMany({
          where: { restaurantId },
        })
        deleted.sales = { count: salesResult.count, related: saleItemsResult.count }
      }

      if (types.includes('expenses')) {
        // Delete expense payments first
        const expensePaymentsResult = await tx.expensePayment.deleteMany({
          where: { expense: { restaurantId } },
        })
        // Delete expenses
        const expensesResult = await tx.expense.deleteMany({
          where: { restaurantId },
        })
        deleted.expenses = { count: expensesResult.count, related: expensePaymentsResult.count }
      }

      if (types.includes('debts')) {
        // Delete debt payments first
        const debtPaymentsResult = await tx.debtPayment.deleteMany({
          where: { debt: { restaurantId } },
        })
        // Delete debts
        const debtsResult = await tx.debt.deleteMany({
          where: { restaurantId },
        })
        deleted.debts = { count: debtsResult.count, related: debtPaymentsResult.count }
      }

      if (types.includes('production')) {
        // Delete production items first
        const productionItemsResult = await tx.productionItem.deleteMany({
          where: { productionLog: { restaurantId } },
        })
        // Delete production logs
        const productionLogsResult = await tx.productionLog.deleteMany({
          where: { restaurantId },
        })
        deleted.production = { count: productionLogsResult.count, related: productionItemsResult.count }
      }

      if (types.includes('inventory')) {
        // Delete stock movements
        const stockMovementsResult = await tx.stockMovement.deleteMany({
          where: { restaurantId },
        })
        // Reset inventory item quantities to minimal stock
        const inventoryResult = await tx.inventoryItem.updateMany({
          where: { restaurantId },
          data: { currentStock: 0 },
        })
        deleted.inventory = { count: stockMovementsResult.count, related: inventoryResult.count }
      }

      if (types.includes('bank')) {
        // Delete bank transactions
        const bankResult = await tx.bankTransaction.deleteMany({
          where: { restaurantId },
        })
        deleted.bank = { count: bankResult.count }
      }

      return deleted
    })

    return NextResponse.json({
      success: true,
      message: 'Data reset completed successfully',
      deleted: result,
    })
  } catch (error) {
    console.error('Error executing reset:', error)
    return NextResponse.json(
      { error: 'Failed to execute reset' },
      { status: 500 }
    )
  }
}
