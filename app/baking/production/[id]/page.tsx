import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductionDetail from '@/components/production/ProductionDetail'

export const metadata: Metadata = {
  title: 'Production Details | Bakery Hub',
  description: 'View detailed production log information',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductionDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user's default restaurant and role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultRestaurantId: true, role: true },
  })

  if (!user?.defaultRestaurantId) {
    redirect('/dashboard')
  }

  const restaurantId = user.defaultRestaurantId
  const isManager = user.role === 'Manager'

  // Fetch production log with all details
  const productionLog = await prisma.productionLog.findUnique({
    where: {
      id,
    },
    include: {
      stockMovements: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              currentStock: true,
              unit: true,
            },
          },
        },
      },
    },
  })

  // Verify the production log belongs to the user's restaurant
  if (!productionLog || productionLog.restaurantId !== restaurantId) {
    redirect('/baking/production')
  }

  // Parse ingredient details
  const ingredientDetails = productionLog.ingredientDetails as any[] || []

  // Fetch current stock for each ingredient
  const ingredientIds = ingredientDetails.map((ing: any) => ing.itemId).filter(Boolean)

  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      id: { in: ingredientIds },
      restaurantId: restaurantId,
    },
    select: {
      id: true,
      currentStock: true,
    },
  })

  const inventoryMap = new Map(
    inventoryItems.map((item) => [item.id, item.currentStock])
  )

  // Enhance ingredient details with current stock
  const enhancedIngredients = ingredientDetails.map((ing: any) => ({
    ...ing,
    currentStock: inventoryMap.get(ing.itemId),
  }))

  // Serialize production data for client
  const serializedProduction = {
    id: productionLog.id,
    productName: productionLog.productName,
    productNameFr: productionLog.productNameFr,
    quantity: productionLog.quantity,
    date: productionLog.date.toISOString(),
    estimatedCostGNF: productionLog.estimatedCostGNF,
    preparationStatus: productionLog.preparationStatus,
    status: productionLog.status,
    notes: productionLog.notes,
    stockDeducted: productionLog.stockDeducted,
    stockDeductedAt: productionLog.stockDeductedAt?.toISOString() || null,
    createdByName: productionLog.createdByName,
    createdAt: productionLog.createdAt.toISOString(),
    updatedAt: productionLog.updatedAt.toISOString(),
    ingredientDetails: enhancedIngredients,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Link */}
      <Link
        href="/baking/production"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Production
      </Link>

      {/* Production Detail Component */}
      <ProductionDetail
        production={serializedProduction}
        canEdit={isManager}
      />
    </div>
  )
}
