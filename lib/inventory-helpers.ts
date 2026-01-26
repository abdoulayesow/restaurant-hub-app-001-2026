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
