'use client'

import { X, Package, Plus, History, Edit2, Calendar, DollarSign, Truck } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { StockStatusBadge, getStockStatus } from './StockStatusBadge'
import { getCategoryLabel } from './CategoryFilter'
import { InventoryItem } from './InventoryCard'

interface ViewItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  isManager: boolean
  onEdit: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
}

export function ViewItemModal({
  isOpen,
  onClose,
  item,
  isManager,
  onEdit,
  onAdjust,
  onViewHistory,
}: ViewItemModalProps) {
  const { t, locale } = useLocale()

  if (!isOpen || !item) return null

  // Get display name based on locale
  const displayName = locale === 'fr' && item.nameFr ? item.nameFr : item.name
  const altName = locale === 'fr' ? item.name : item.nameFr

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-GN') + ' GNF'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 dark:bg-stone-800 z-10 p-6 border-b border-gray-200 dark:border-stone-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-3 rounded-lg ${colors.bg} border-l-4 ${colors.border}`}>
                <Package className="w-6 h-6 text-gray-600 dark:text-stone-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-stone-100 truncate">
                  {displayName}
                </h2>
                {altName && (
                  <p className="text-sm text-gray-500 dark:text-stone-400 truncate mt-0.5">
                    {altName}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300">
                    {getCategoryLabel(item.category, t)}
                  </span>
                  <StockStatusBadge status={status} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Meter */}
          <div className={`p-4 rounded-lg ${colors.bg}`}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-stone-400 font-medium">
                {t('inventory.stockLevel') || 'Stock Level'}
              </span>
              <span className="font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                {Math.round(stockRatio)}%
              </span>
            </div>
            <div className="relative h-2.5 bg-gray-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${colors.meter}`}
                style={{ width: `${meterWidth}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                  {item.currentStock}
                </div>
                <div className="text-xs text-gray-500 dark:text-stone-400">
                  {t('inventory.current') || 'Current'} ({item.unit})
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200 dark:bg-stone-700" />
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-gray-700 dark:text-stone-200 tabular-nums">
                  {item.minStock}
                </div>
                <div className="text-xs text-gray-500 dark:text-stone-400">
                  {t('inventory.minimum') || 'Minimum'} ({item.unit})
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Reorder Point */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                <Package className="w-3.5 h-3.5" />
                {t('inventory.reorderPoint') || 'Reorder Point'}
              </div>
              <div className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                {item.reorderPoint} <span className="text-xs font-normal opacity-70">{item.unit}</span>
              </div>
            </div>

            {/* Unit Cost */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                {t('inventory.unitCost') || 'Unit Cost'}
              </div>
              <div className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                {formatCurrency(item.unitCostGNF)}
              </div>
            </div>

            {/* Expiry Days */}
            {item.expiryDays && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('inventory.expiryDays') || 'Expiry Days'}
                </div>
                <div className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                  {item.expiryDays} <span className="text-xs font-normal opacity-70">days</span>
                </div>
              </div>
            )}

            {/* Supplier */}
            {item.supplier && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                  <Truck className="w-3.5 h-3.5" />
                  {t('inventory.supplier') || 'Supplier'}
                </div>
                <div className="font-semibold text-gray-900 dark:text-stone-100 truncate">
                  {item.supplier.name}
                </div>
              </div>
            )}
          </div>

          {/* Total Value */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-100 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
            <span className="text-sm text-gray-600 dark:text-stone-300 font-medium">
              Total Stock Value
            </span>
            <span className="font-bold text-gray-900 dark:text-stone-100 tabular-nums">
              {formatCurrency(item.currentStock * item.unitCostGNF)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-stone-800 p-6 border-t border-gray-200 dark:border-stone-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onAdjust(item)
                  onClose()
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('inventory.adjust') || 'Adjust'}
              </button>
              <button
                onClick={() => {
                  onViewHistory(item)
                  onClose()
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 font-medium transition-colors"
              >
                <History className="w-4 h-4" />
                {t('inventory.history') || 'History'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  onClick={() => {
                    onEdit(item)
                    onClose()
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit') || 'Edit'}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 font-medium transition-colors"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
