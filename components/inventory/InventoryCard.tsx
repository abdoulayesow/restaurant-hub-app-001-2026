'use client'

import { Edit2, Trash2, Plus, History, Eye } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { StockStatusBadge, StockStatus, getStockStatus } from './StockStatusBadge'
import { getCategoryLabel } from './CategoryFilter'
import { ExpiryStatus } from '@/lib/inventory-helpers'

export interface InventoryItem {
  id: string
  name: string
  nameFr: string | null
  category: string
  unit: string
  currentStock: number
  minStock: number
  reorderPoint: number
  unitCostGNF: number
  supplierId: string | null
  supplier: { id: string; name: string } | null
  expiryDays: number | null
  isActive: boolean
  stockStatus: StockStatus
  expiryStatus?: ExpiryStatus | null
  expiryDate?: string | null
  daysUntilExpiry?: number | null
  lastPurchaseDate?: string | null
  createdAt: string
  updatedAt: string
}

interface InventoryCardProps {
  item: InventoryItem
  isManager: boolean
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
  onClick: (item: InventoryItem) => void
}

export function InventoryCard({
  item,
  isManager,
  onEdit,
  onDelete,
  onAdjust,
  onViewHistory,
  onClick,
}: InventoryCardProps) {
  const { t, locale } = useLocale()

  // Calculate stock meter percentage
  const stockRatio = item.minStock > 0 ? (item.currentStock / item.minStock) * 100 : 100
  const meterWidth = Math.min(Math.max(stockRatio, 0), 100)

  // Get status color classes
  const status = item.stockStatus || getStockStatus(item.currentStock, item.minStock)
  const statusColors = {
    critical: {
      border: 'border-l-red-500 dark:border-l-red-400',
      meter: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    low: {
      border: 'border-l-amber-500 dark:border-l-amber-400',
      meter: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    ok: {
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      meter: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  }
  const colors = statusColors[status]

  // Get display name based on locale
  const displayName = locale === 'fr' && item.nameFr ? item.nameFr : item.name

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-GN') + ' GNF'
  }

  return (
    <div
      className={`
        group relative
        bg-white dark:bg-stone-800
        rounded-xl
        border border-gray-200 dark:border-stone-700
        border-l-4 ${colors.border}
        overflow-hidden
        hover:border-gray-300 dark:hover:border-stone-600
        transition-all duration-200
        cursor-pointer
        shadow-sm hover:shadow-md
      `}
      onClick={() => onClick(item)}
    >

      {/* Card Header */}
      <div className="p-5">
        {/* Name and Category */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-stone-100 truncate text-lg mb-2">
              {displayName}
            </h3>
            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300">
              {getCategoryLabel(item.category, t)}
            </span>
          </div>
          <StockStatusBadge status={status} />
        </div>

        {/* Stock Meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-stone-400 font-medium">
              {t('inventory.stockLevel') || 'Stock Level'}
            </span>
            <span className="font-bold text-gray-900 dark:text-stone-100 tabular-nums">
              {Math.round(stockRatio)}%
            </span>
          </div>
          <div className="relative h-2 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${colors.meter}`}
              style={{ width: `${meterWidth}%` }}
            />
          </div>
        </div>

        {/* Stock Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <div className="text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
              {t('inventory.current') || 'Current'}
            </div>
            <div className="font-bold text-gray-900 dark:text-stone-100 tabular-nums">
              {item.currentStock} <span className="text-xs font-normal opacity-70">{item.unit}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50">
            <div className="text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
              {t('inventory.minimum') || 'Minimum'}
            </div>
            <div className="font-semibold text-gray-700 dark:text-stone-200 tabular-nums">
              {item.minStock} <span className="text-xs font-normal opacity-70">{item.unit}</span>
            </div>
          </div>
        </div>

        {/* Unit Cost */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-stone-700/50">
          <span className="text-xs text-gray-500 dark:text-stone-400 font-medium">
            {t('inventory.unitCost') || 'Unit cost'}
          </span>
          <span className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
            {formatCurrency(item.unitCostGNF)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-stone-700/50 border-t border-gray-200 dark:border-stone-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick(item)
              }}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-gray-200 dark:hover:bg-stone-600 rounded-lg transition-colors"
              title={t('common.view') || 'View'}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAdjust(item)
              }}
              className="p-2 text-gray-600 hover:text-blue-700 dark:text-stone-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title={t('inventory.adjustStock') || 'Adjust Stock'}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewHistory(item)
              }}
              className="p-2 text-gray-600 hover:text-purple-700 dark:text-stone-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              title={t('inventory.history') || 'History'}
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          {isManager && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-gray-200 dark:hover:bg-stone-600 rounded-lg transition-colors"
                title={t('common.edit') || 'Edit'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="p-2 text-gray-600 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title={t('common.delete') || 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
