import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getExpiryInfo } from '@/lib/inventory-helpers'

/**
 * GET /api/inventory/expiry-status
 *
 * Get expiry status for all perishable inventory items
 *
 * Query params:
 * - restaurantId (required)
 * - status (optional): 'expired' | 'warning' | 'all' (default: 'all')
 * - warningDays (optional): number of days before expiry to trigger warning (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const statusFilter = searchParams.get('status') as 'expired' | 'warning' | 'all' | null
    const warningDays = parseInt(searchParams.get('warningDays') || '7', 10)

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

    // Fetch all active perishable items (items with expiryDays > 0)
    const items = await prisma.inventoryItem.findMany({
      where: {
        restaurantId,
        isActive: true,
        expiryDays: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        nameFr: true,
        category: true,
        expiryDays: true,
        currentStock: true,
        unit: true,
      },
    })

    // Fetch latest purchase movements for all items
    const itemIds = items.map(item => item.id)

    const purchaseMovements = await prisma.stockMovement.findMany({
      where: {
        itemId: { in: itemIds },
        type: 'Purchase',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        itemId: true,
        createdAt: true,
      },
    })

    // Create a map of itemId -> last purchase date (most recent only)
    const lastPurchaseMap = new Map<string, Date>()
    purchaseMovements.forEach(movement => {
      if (!lastPurchaseMap.has(movement.itemId)) {
        lastPurchaseMap.set(movement.itemId, movement.createdAt)
      }
    })

    // Calculate expiry info for each item
    const itemsWithExpiry = items.map(item => {
      const lastPurchaseDate = lastPurchaseMap.get(item.id) || null
      const expiryInfo = getExpiryInfo(item, lastPurchaseDate, warningDays)

      return {
        id: item.id,
        name: item.name,
        nameFr: item.nameFr,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        expiryDays: item.expiryDays,
        lastPurchaseDate,
        ...expiryInfo,
      }
    })

    // Filter items based on status filter
    const filteredItems = itemsWithExpiry.filter(item => {
      if (!statusFilter || statusFilter === 'all') {
        return true
      }
      return item.status === statusFilter
    })

    // Group items by status
    const expired = filteredItems.filter(item => item.status === 'expired')
    const warning = filteredItems.filter(item => item.status === 'warning')
    const fresh = filteredItems.filter(item => item.status === 'fresh')

    // Sort each group by days until expiry (most urgent first)
    const sortByUrgency = (a: typeof filteredItems[0], b: typeof filteredItems[0]) => {
      if (a.daysUntilExpiry === null) return 1
      if (b.daysUntilExpiry === null) return -1
      return a.daysUntilExpiry - b.daysUntilExpiry
    }

    expired.sort(sortByUrgency)
    warning.sort(sortByUrgency)

    return NextResponse.json({
      items: filteredItems,
      summary: {
        total: itemsWithExpiry.length,
        expired: expired.length,
        warning: warning.length,
        fresh: fresh.length,
      },
      groupedByStatus: {
        expired,
        warning,
        fresh,
      },
      warningDays,
    })
  } catch (error) {
    console.error('Error fetching inventory expiry status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
