'use client'

import { ChevronRight, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { InventoryCard, InventoryItem } from './InventoryCard'

interface CategorySectionProps {
  categoryLabel: string
  items: InventoryItem[]
  isExpanded: boolean
  onToggle: () => void
  isManager: boolean
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
  onItemClick: (item: InventoryItem) => void
}

export function CategorySection({
  categoryLabel,
  items,
  isExpanded,
  onToggle,
  isManager,
  onEdit,
  onDelete,
  onAdjust,
  onViewHistory,
  onItemClick,
}: CategorySectionProps) {
  const { t } = useLocale()

  // Count items with low or critical stock
  const lowStockCount = items.filter(
    (item) => item.stockStatus === 'low' || item.stockStatus === 'critical'
  ).length

  // Sort items by name within category
  const sortedItems = [...items].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 bg-terracotta-50/40 dark:bg-dark-800/40 hover:bg-terracotta-100/50 dark:hover:bg-dark-700/50 rounded-xl mb-4 transition-all duration-300 group border border-terracotta-200/30 dark:border-terracotta-700/20 warm-shadow-sm"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={`w-5 h-5 text-terracotta-500 dark:text-terracotta-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <h3
            className="font-semibold text-terracotta-900 dark:text-cream-100"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            {categoryLabel}
          </h3>
          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/40 dark:border-terracotta-700/40">
            {items.length} {items.length === 1 ? t('inventory.item') || 'item' : t('inventory.items') || 'items'}
          </span>
        </div>

        {/* Low Stock Warning Badge */}
        {lowStockCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-700/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">
              {lowStockCount} {lowStockCount === 1 ? (t('inventory.lowStock') || 'Low Stock') : (t('inventory.lowStock') || 'Low Stock')}
            </span>
          </div>
        )}
      </button>

      {/* Collapsible Content - Card Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {sortedItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              isManager={isManager}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdjust={onAdjust}
              onViewHistory={onViewHistory}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
