'use client'

import { useRouter } from 'next/navigation'
import { Package, AlertTriangle, TrendingDown, ChevronRight } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface TopConsumedItem {
  name: string
  nameFr: string
  quantity: number
  unit: string
}

interface InventoryStatusCardProps {
  totalValue: number
  itemCount: number
  lowStockCount: number
  criticalCount: number
  consumptionValue: number
  topConsumed: TopConsumedItem[]
  loading?: boolean
}

export function InventoryStatusCard({
  totalValue,
  itemCount,
  lowStockCount,
  criticalCount,
  consumptionValue,
  topConsumed,
  loading = false,
}: InventoryStatusCardProps) {
  const { t, locale } = useLocale()
  const router = useRouter()

  const formatGNF = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const getLocalizedName = (item: TopConsumedItem) => {
    return locale === 'fr' ? item.nameFr : item.name
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-stone-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-stone-700 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 dark:bg-stone-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  const hasAlerts = lowStockCount > 0

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-stone-700">
            <Package className="w-5 h-5 text-gray-600 dark:text-stone-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-stone-300">
            {t('dashboard.inventoryStatus')}
          </h3>
        </div>
        {hasAlerts && (
          <button
            onClick={() => router.push('/baking/inventory?lowStock=true')}
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {lowStockCount} {t('dashboard.alerts')}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {/* Total Value */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 text-center">
          <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
            {t('dashboard.inventoryValue')}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatGNF(totalValue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-stone-400">GNF</p>
        </div>

        {/* Item Count */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 text-center">
          <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
            {t('dashboard.totalItems')}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {itemCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-stone-400">{t('common.items')}</p>
        </div>

        {/* Low Stock */}
        <div className={`p-3 rounded-lg text-center ${hasAlerts ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-stone-700/50'}`}>
          <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
            {t('dashboard.lowStock')}
          </p>
          <p className={`text-lg font-bold ${hasAlerts ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
            {lowStockCount}
          </p>
          {criticalCount > 0 && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {criticalCount} {t('dashboard.critical')}
            </p>
          )}
        </div>

        {/* Consumption */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 text-center">
          <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
            {t('dashboard.consumption')}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatGNF(consumptionValue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-stone-400">GNF</p>
        </div>
      </div>

      {/* Top consumed items */}
      {topConsumed.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-stone-400 mb-2">
            <TrendingDown className="w-3.5 h-3.5" />
            {t('dashboard.topConsumed')}:
          </div>
          <div className="flex flex-wrap gap-2">
            {topConsumed.slice(0, 5).map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-stone-700 text-xs text-gray-700 dark:text-stone-300"
              >
                {getLocalizedName(item)} <span className="text-gray-500 dark:text-stone-400">{item.quantity}{item.unit}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
