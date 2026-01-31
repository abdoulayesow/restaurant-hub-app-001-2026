/**
 * Inventory Helper Functions
 *
 * Utilities for calculating expiry dates, stock status, and restock predictions
 */

import { InventoryItem, StockMovement } from '@prisma/client'

export type ExpiryStatus = 'fresh' | 'warning' | 'expired' | 'non-perishable'

export interface ExpiryInfo {
  expiryDate: Date | null
  status: ExpiryStatus
  daysUntilExpiry: number | null
  isExpiringSoon: boolean
}

/**
 * Calculate expiry date from purchase date and item's expiryDays
 *
 * @param item - InventoryItem with expiryDays field
 * @param purchaseDate - Date of the purchase/stock addition
 * @returns Calculated expiry date or null if non-perishable
 */
export function calculateExpiryDate(
  item: Pick<InventoryItem, 'expiryDays'>,
  purchaseDate: Date
): Date | null {
  if (!item.expiryDays || item.expiryDays <= 0) {
    return null // Non-perishable item
  }

  const expiryDate = new Date(purchaseDate)
  expiryDate.setDate(expiryDate.getDate() + item.expiryDays)
  return expiryDate
}

/**
 * Calculate days until expiry from a given date
 *
 * @param expiryDate - The expiry date to check
 * @returns Number of days until expiry (negative if expired), or null if non-perishable
 */
export function getDaysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) {
    return null
  }

  const now = new Date()
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Determine expiry status based on expiry date and warning threshold
 *
 * @param expiryDate - The expiry date to check (null for non-perishable)
 * @param warningDays - Days before expiry to trigger warning (default: 7)
 * @returns ExpiryStatus enum value
 */
export function getExpiryStatus(
  expiryDate: Date | null,
  warningDays: number = 7
): ExpiryStatus {
  if (!expiryDate) {
    return 'non-perishable'
  }

  const daysRemaining = getDaysUntilExpiry(expiryDate)

  if (daysRemaining === null) {
    return 'non-perishable'
  }

  if (daysRemaining < 0) {
    return 'expired'
  }

  if (daysRemaining <= warningDays) {
    return 'warning'
  }

  return 'fresh'
}

/**
 * Get comprehensive expiry information for an inventory item
 *
 * @param item - InventoryItem with expiryDays field
 * @param lastPurchaseDate - Date of most recent stock purchase
 * @param warningDays - Days before expiry to trigger warning (default: 7)
 * @returns Complete expiry information object
 */
export function getExpiryInfo(
  item: Pick<InventoryItem, 'expiryDays'>,
  lastPurchaseDate: Date | null,
  warningDays: number = 7
): ExpiryInfo {
  if (!lastPurchaseDate || !item.expiryDays) {
    return {
      expiryDate: null,
      status: 'non-perishable',
      daysUntilExpiry: null,
      isExpiringSoon: false,
    }
  }

  const expiryDate = calculateExpiryDate(item, lastPurchaseDate)
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
  const status = getExpiryStatus(expiryDate, warningDays)
  const isExpiringSoon = status === 'warning' || status === 'expired'

  return {
    expiryDate,
    status,
    daysUntilExpiry,
    isExpiringSoon,
  }
}

/**
 * Find the most recent purchase movement for an item
 *
 * @param movements - Array of stock movements for an item
 * @returns Most recent Purchase movement or null
 */
export function getLastPurchaseMovement(
  movements: StockMovement[]
): StockMovement | null {
  const purchases = movements
    .filter(m => m.type === 'Purchase')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return purchases[0] || null
}

/**
 * Check if an item is perishable (has expiryDays configured)
 *
 * @param item - InventoryItem to check
 * @returns true if item is perishable
 */
export function isPerishable(item: Pick<InventoryItem, 'expiryDays'>): boolean {
  return !!item.expiryDays && item.expiryDays > 0
}

// ============================================================================
// RESTOCK PREDICTION
// ============================================================================

export type RestockStatus = 'reorder_now' | 'reorder_soon' | 'stable' | 'no_data'
export type RestockConfidence = 'high' | 'medium' | 'low'

export interface RestockPrediction {
  dailyUsage: number
  daysUntilReorder: number | null
  status: RestockStatus
  confidence: RestockConfidence
  dataPoints: number
}

/**
 * Calculate restock prediction based on usage history
 *
 * Algorithm:
 * - dailyUsage = sum(Usage movements over periodDays) / periodDays
 * - daysUntilReorder = (currentStock - reorderPoint) / dailyUsage
 *
 * Edge cases:
 * - No usage history → "No usage data"
 * - Zero/negative usage → "Stock stable"
 * - Already below reorder point → "Reorder now"
 *
 * @param item - InventoryItem with currentStock and reorderPoint
 * @param movements - Recent stock movements (should include Usage type)
 * @param periodDays - Period to analyze (default: 30 days)
 * @returns RestockPrediction with status and confidence
 */
export function calculateRestockPrediction(
  item: Pick<InventoryItem, 'currentStock' | 'reorderPoint'>,
  movements: Pick<StockMovement, 'type' | 'quantity' | 'createdAt'>[],
  periodDays: number = 30
): RestockPrediction {
  const now = new Date()
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  // Filter usage movements within the period
  const usageMovements = movements.filter(
    m => m.type === 'Usage' && new Date(m.createdAt) >= periodStart
  )

  const dataPoints = usageMovements.length

  // No usage data
  if (dataPoints === 0) {
    return {
      dailyUsage: 0,
      daysUntilReorder: null,
      status: 'no_data',
      confidence: 'low',
      dataPoints: 0,
    }
  }

  // Calculate total usage (usage quantities are negative)
  const totalUsage = usageMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
  const dailyUsage = totalUsage / periodDays

  // No meaningful usage (stock stable)
  if (dailyUsage <= 0.001) {
    return {
      dailyUsage: 0,
      daysUntilReorder: null,
      status: 'stable',
      confidence: dataPoints >= 10 ? 'high' : dataPoints >= 5 ? 'medium' : 'low',
      dataPoints,
    }
  }

  // Already below or at reorder point
  if (item.currentStock <= item.reorderPoint) {
    return {
      dailyUsage,
      daysUntilReorder: 0,
      status: 'reorder_now',
      confidence: dataPoints >= 10 ? 'high' : dataPoints >= 5 ? 'medium' : 'low',
      dataPoints,
    }
  }

  // Calculate days until reorder point is reached
  const stockAboveReorder = item.currentStock - item.reorderPoint
  const daysUntilReorder = Math.floor(stockAboveReorder / dailyUsage)

  // Determine status based on days
  let status: RestockStatus
  if (daysUntilReorder <= 0) {
    status = 'reorder_now'
  } else if (daysUntilReorder <= 7) {
    status = 'reorder_soon'
  } else {
    status = 'stable'
  }

  // Confidence based on data points
  let confidence: RestockConfidence
  if (dataPoints >= 10) {
    confidence = 'high'
  } else if (dataPoints >= 5) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    dailyUsage,
    daysUntilReorder,
    status,
    confidence,
    dataPoints,
  }
}
