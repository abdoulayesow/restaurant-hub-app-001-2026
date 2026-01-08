'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

// Inventory categories matching the technical spec
export const INVENTORY_CATEGORIES = [
  { key: 'dry_goods', labelKey: 'categories.dryGoods' },
  { key: 'dairy', labelKey: 'categories.dairy' },
  { key: 'flavorings', labelKey: 'categories.flavorings' },
  { key: 'packaging', labelKey: 'categories.packaging' },
  { key: 'utilities', labelKey: 'categories.utilities' },
] as const

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]['key']

interface CategoryFilterProps {
  value: string
  onChange: (category: string) => void
  className?: string
}

export function CategoryFilter({ value, onChange, className = '' }: CategoryFilterProps) {
  const { t } = useLocale()

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors ${className}`}
    >
      <option value="">{t('common.all')}</option>
      {INVENTORY_CATEGORIES.map((category) => (
        <option key={category.key} value={category.key}>
          {t(category.labelKey)}
        </option>
      ))}
    </select>
  )
}

// Helper to get category label
export function getCategoryLabel(categoryKey: string, t: (key: string) => string): string {
  const category = INVENTORY_CATEGORIES.find((c) => c.key === categoryKey)
  return category ? t(category.labelKey) : categoryKey
}
