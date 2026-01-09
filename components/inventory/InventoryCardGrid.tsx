'use client'

import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { INVENTORY_CATEGORIES, getCategoryLabel } from './CategoryFilter'
import { CategorySection } from './CategorySection'
import { InventoryItem } from './InventoryCard'

interface InventoryCardGridProps {
  items: InventoryItem[]
  isManager: boolean
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
  onView: (item: InventoryItem) => void
}

export function InventoryCardGrid({
  items,
  isManager,
  onEdit,
  onDelete,
  onAdjust,
  onViewHistory,
  onView,
}: InventoryCardGridProps) {
  const { t } = useLocale()

  // Track expanded state for each category (default: all expanded)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    return new Set(INVENTORY_CATEGORIES.map((c) => c.key))
  })

  // Group items by category
  const itemsByCategory = INVENTORY_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.key] = items.filter((item) => item.category === category.key)
      return acc
    },
    {} as Record<string, InventoryItem[]>
  )

  // Handle category toggle
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryKey)) {
        next.delete(categoryKey)
      } else {
        next.add(categoryKey)
      }
      return next
    })
  }

  // Handle item click to open view modal
  const handleItemClick = (item: InventoryItem) => {
    onView(item)
  }

  // Get categories that have items
  const categoriesWithItems = INVENTORY_CATEGORIES.filter(
    (category) => itemsByCategory[category.key]?.length > 0
  )

  // If no items at all
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">
          {t('inventory.noItems') || 'No inventory items found'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Expand/Collapse All Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            if (expandedCategories.size === categoriesWithItems.length) {
              // All expanded, collapse all
              setExpandedCategories(new Set())
            } else {
              // Some collapsed, expand all
              setExpandedCategories(new Set(INVENTORY_CATEGORIES.map((c) => c.key)))
            }
          }}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {expandedCategories.size === categoriesWithItems.length
            ? t('inventory.collapseAll') || 'Collapse All'
            : t('inventory.expandAll') || 'Expand All'}
        </button>
      </div>

      {/* Category Sections */}
      {categoriesWithItems.map((category) => (
        <CategorySection
          key={category.key}
          categoryLabel={getCategoryLabel(category.key, t)}
          items={itemsByCategory[category.key]}
          isExpanded={expandedCategories.has(category.key)}
          onToggle={() => toggleCategory(category.key)}
          isManager={isManager}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdjust={onAdjust}
          onViewHistory={onViewHistory}
          onItemClick={handleItemClick}
        />
      ))}
    </div>
  )
}
