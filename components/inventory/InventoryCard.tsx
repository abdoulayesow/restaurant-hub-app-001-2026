'use client'

import { Edit2, Trash2, Plus, History, Eye } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { StockStatusBadge, StockStatus, getStockStatus } from './StockStatusBadge'
import { getCategoryLabel } from './CategoryFilter'

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

  // Get status color classes - using terracotta-inspired warm tones
  const status = item.stockStatus || getStockStatus(item.currentStock, item.minStock)
  const statusColors = {
    critical: {
      border: 'border-l-red-500 dark:border-l-red-400',
      meter: 'bg-gradient-to-r from-red-500 to-red-600',
      bg: 'bg-red-50/60 dark:bg-red-900/10',
      glow: 'shadow-red-100/50 dark:shadow-red-900/20',
    },
    low: {
      border: 'border-l-amber-500 dark:border-l-amber-400',
      meter: 'bg-gradient-to-r from-amber-400 to-amber-500',
      bg: 'bg-amber-50/60 dark:bg-amber-900/10',
      glow: 'shadow-amber-100/50 dark:shadow-amber-900/20',
    },
    ok: {
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      meter: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      bg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
      glow: 'shadow-emerald-100/50 dark:shadow-emerald-900/20',
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
        bg-cream-50 dark:bg-dark-800
        rounded-2xl
        border-2 border-terracotta-200/40 dark:border-terracotta-400/20
        border-l-4 ${colors.border}
        overflow-hidden
        hover:border-terracotta-300/60 dark:hover:border-terracotta-400/40
        transition-all duration-300 ease-out
        cursor-pointer
        warm-shadow
        hover:shadow-lg ${colors.glow}
        grain-overlay
      `}
      onClick={() => onClick(item)}
    >
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta-400/20 via-terracotta-500/30 to-terracotta-400/20" />

      {/* Card Header */}
      <div className="p-5">
        {/* Name and Category */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-terracotta-900 dark:text-cream-100 truncate text-lg mb-2"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {displayName}
            </h3>
            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-lg bg-terracotta-100/60 dark:bg-terracotta-900/30 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/40 dark:border-terracotta-700/40">
              {getCategoryLabel(item.category, t)}
            </span>
          </div>
          <StockStatusBadge status={status} />
        </div>

        {/* Stock Meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-terracotta-600/70 dark:text-cream-300/70 font-medium">
              {t('inventory.stockLevel') || 'Stock Level'}
            </span>
            <span className="font-bold text-terracotta-900 dark:text-cream-100 tabular-nums">
              {Math.round(stockRatio)}%
            </span>
          </div>
          <div className="relative h-2.5 bg-terracotta-100/50 dark:bg-dark-700/50 rounded-full overflow-hidden border border-terracotta-200/30 dark:border-dark-600/30">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out ${colors.meter} shadow-sm`}
              style={{ width: `${meterWidth}%` }}
            />
          </div>
        </div>

        {/* Stock Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className={`p-3 rounded-xl ${colors.bg} border border-terracotta-200/20 dark:border-dark-600/20`}>
            <div className="text-terracotta-600/60 dark:text-cream-300/60 text-xs font-medium mb-1">
              {t('inventory.current') || 'Current'}
            </div>
            <div className="font-bold text-terracotta-900 dark:text-cream-100 tabular-nums">
              {item.currentStock} <span className="text-xs font-normal opacity-70">{item.unit}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-terracotta-50/40 dark:bg-dark-700/40 border border-terracotta-200/20 dark:border-dark-600/20">
            <div className="text-terracotta-600/60 dark:text-cream-300/60 text-xs font-medium mb-1">
              {t('inventory.minimum') || 'Minimum'}
            </div>
            <div className="font-semibold text-terracotta-800 dark:text-cream-200 tabular-nums">
              {item.minStock} <span className="text-xs font-normal opacity-70">{item.unit}</span>
            </div>
          </div>
        </div>

        {/* Unit Cost */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-terracotta-50/30 dark:bg-dark-800/30 border border-terracotta-200/20 dark:border-dark-600/20">
          <span className="text-xs text-terracotta-600/60 dark:text-cream-300/60 font-medium">
            {t('inventory.unitCost') || 'Unit cost'}
          </span>
          <span className="font-semibold text-terracotta-900 dark:text-cream-100 tabular-nums">
            {formatCurrency(item.unitCostGNF)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-4 bg-terracotta-50/40 dark:bg-dark-800/40 border-t border-terracotta-200/40 dark:border-terracotta-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick(item)
              }}
              className="p-2.5 text-terracotta-600 hover:text-terracotta-900 dark:text-cream-300 dark:hover:text-cream-100 hover:bg-terracotta-100/60 dark:hover:bg-dark-700 rounded-xl transition-all duration-200 hover:scale-105"
              title={t('common.view') || 'View'}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAdjust(item)
              }}
              className="p-2.5 text-terracotta-600 hover:text-blue-700 dark:text-cream-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-105"
              title={t('inventory.adjustStock') || 'Adjust Stock'}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewHistory(item)
              }}
              className="p-2.5 text-terracotta-600 hover:text-purple-700 dark:text-cream-300 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 hover:scale-105"
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
                className="p-2.5 text-terracotta-600 hover:text-terracotta-900 dark:text-cream-300 dark:hover:text-cream-100 hover:bg-terracotta-100/60 dark:hover:bg-terracotta-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                title={t('common.edit') || 'Edit'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="p-2.5 text-terracotta-600 hover:text-red-700 dark:text-cream-300 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                title={t('common.delete') || 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-terracotta-400/0 via-terracotta-500/0 to-terracotta-600/0 group-hover:from-terracotta-400/5 group-hover:via-terracotta-500/3 group-hover:to-terracotta-600/5 transition-all duration-500 pointer-events-none" />
    </div>
  )
}
