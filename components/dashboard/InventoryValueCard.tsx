'use client'

import { Package, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CategoryBreakdown {
  category: string
  value: number
  itemCount: number
  percentOfTotal: number
}

interface InventoryValueCardProps {
  totalValue: number
  byCategory: CategoryBreakdown[]
  loading?: boolean
}

export function InventoryValueCard({
  totalValue,
  byCategory,
  loading = false,
}: InventoryValueCardProps) {
  const { t, locale } = useLocale()
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const topCategories = byCategory.slice(0, 3)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => router.push('/baking/inventory?view=valuation')}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-gold-600 dark:text-gold-400" />
          {t('inventory.inventoryValue') || 'Inventory Value'}
        </h3>
        <TrendingUp className="w-5 h-5 text-gold-600 dark:text-gold-400 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Total Value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(totalValue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('inventory.totalValue') || 'Total inventory value'}
        </p>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
          {topCategories.map((cat, idx) => (
            <div key={cat.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  idx === 0 ? 'bg-gold-600' :
                  idx === 1 ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
                <span className="text-gray-700 dark:text-gray-300">
                  {cat.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {cat.percentOfTotal}%
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(cat.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
