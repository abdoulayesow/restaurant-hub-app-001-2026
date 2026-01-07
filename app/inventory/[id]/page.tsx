import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ItemDetailClient } from '@/components/inventory/ItemDetailClient'

export const metadata: Metadata = {
  title: 'Inventory Item Details | Bakery Hub',
  description: 'View detailed inventory item information and stock movement history',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function InventoryItemDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user's default restaurant
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultRestaurantId: true },
  })

  if (!user?.defaultRestaurantId) {
    redirect('/dashboard')
  }

  const restaurantId = user.defaultRestaurantId

  // Fetch inventory item with supplier
  const item = await prisma.inventoryItem.findUnique({
    where: {
      id,
      restaurantId: restaurantId, // Ensure user can only access items from their restaurant
    },
    include: {
      supplier: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!item) {
    redirect('/inventory')
  }

  // Fetch stock movements for this item
  const stockMovements = await prisma.stockMovement.findMany({
    where: {
      itemId: id,
      restaurantId: restaurantId,
    },
    include: {
      productionLog: {
        select: {
          id: true,
          productName: true,
        },
      },
      expense: {
        select: {
          id: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate initial stock by working backwards from current stock
  const totalChange = stockMovements.reduce(
    (sum, movement) => sum + movement.quantity,
    0
  )
  const initialStock = item.currentStock - totalChange

  // Helper function to calculate stock status
  const getStockStatus = (itemData: { currentStock: number; minStock: number }) => {
    if (itemData.currentStock <= 0) return 'critical'
    if (itemData.currentStock < itemData.minStock) return 'low'
    return 'ok'
  }

  // Serialize item data for client components
  const serializedItem = {
    id: item.id,
    name: item.name,
    nameFr: item.nameFr,
    category: item.category,
    unit: item.unit,
    currentStock: item.currentStock,
    minStock: item.minStock,
    unitCostGNF: item.unitCostGNF,
    stockStatus: getStockStatus(item) as 'critical' | 'low' | 'ok',
    supplier: item.supplier ? { id: item.id, name: item.supplier.name } : null
  }

  // Serialize movements data for client components
  const serializedMovements = stockMovements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    unitCost: movement.unitCost,
    reason: movement.reason,
    createdByName: movement.createdByName,
    createdAt: movement.createdAt.toISOString(),
    productionLogId: movement.productionLogId,
    expenseId: movement.expenseId,
    productionLog: movement.productionLog ? {
      id: movement.productionLog.id,
      productName: movement.productionLog.productName
    } : null,
    expense: movement.expense ? {
      id: movement.expense.id,
      description: movement.expense.description || ''
    } : null
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Back Link */}
      <Link
        href="/inventory"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inventory
      </Link>

      {/* Item Detail with Stock Adjustment */}
      <ItemDetailClient
        item={serializedItem}
        movements={serializedMovements}
        initialStock={initialStock}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Movements
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stockMovements.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Purchased
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stockMovements
              .filter((m) => m.type === 'Purchase')
              .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              .toFixed(2)}{' '}
            {item.unit}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Used
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stockMovements
              .filter((m) => m.type === 'Usage')
              .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              .toFixed(2)}{' '}
            {item.unit}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Wasted
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {stockMovements
              .filter((m) => m.type === 'Waste')
              .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              .toFixed(2)}{' '}
            {item.unit}
          </p>
        </div>
      </div>
    </div>
  )
}
