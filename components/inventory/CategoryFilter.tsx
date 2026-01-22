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
      className={`bliss-body px-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100 transition-colors ${className}`}
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
