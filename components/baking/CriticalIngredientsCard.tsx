'use client'

import { AlertTriangle, Package, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'

interface LowStockItem {
  id: string
  name: string
  nameFr?: string | null
  currentStock: number
  minStock: number
  unit: string
  stockStatus: 'critical' | 'low' | 'ok'
}

interface CriticalIngredientsCardProps {
  items: LowStockItem[]
  loading?: boolean
  maxItems?: number
}

export function CriticalIngredientsCard({
  items,
  loading = false,
  maxItems = 5,
}: CriticalIngredientsCardProps) {
  const router = useRouter()
  const { t, locale } = useLocale()

  // Filter and sort: critical first, then low
  const sortedItems = [...items]
    .filter((item) => item.stockStatus === 'critical' || item.stockStatus === 'low')
    .sort((a, b) => {
      if (a.stockStatus === 'critical' && b.stockStatus !== 'critical') return -1
      if (a.stockStatus !== 'critical' && b.stockStatus === 'critical') return 1
      // Sort by stock percentage (lowest first)
      const aPercent = a.minStock > 0 ? a.currentStock / a.minStock : 0
      const bPercent = b.minStock > 0 ? b.currentStock / b.minStock : 0
      return aPercent - bPercent
    })
    .slice(0, maxItems)

  const criticalCount = items.filter((i) => i.stockStatus === 'critical').length
  const lowCount = items.filter((i) => i.stockStatus === 'low').length

  if (loading) {
    return (
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
        <div className="animate-pulse">
          <div className="h-5 bg-cream-200 dark:bg-dark-700 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-cream-200 dark:bg-dark-700 rounded" />
            <div className="h-12 bg-cream-200 dark:bg-dark-700 rounded" />
            <div className="h-12 bg-cream-200 dark:bg-dark-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3
              className="font-semibold text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('production.lowStockAlerts') || 'Low Stock Alerts'}
            </h3>
            <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
              {criticalCount > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {criticalCount} {t('production.critical') || 'critical'}
                </span>
              )}
              {criticalCount > 0 && lowCount > 0 && ' • '}
              {lowCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {lowCount} {t('production.low') || 'low'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="py-8 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-green-500/40" />
          <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70">
            {t('production.allStockOk') || 'All ingredients are well stocked'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center justify-between p-3 rounded-xl
                transition-colors cursor-pointer
                ${
                  item.stockStatus === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }
              `}
              onClick={() => router.push('/baking/inventory')}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-2 h-2 rounded-full
                    ${item.stockStatus === 'critical' ? 'bg-red-500' : 'bg-amber-500'}
                  `}
                />
                <div>
                  <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                    {locale === 'fr' && item.nameFr ? item.nameFr : item.name}
                  </p>
                  <p className="text-xs text-terracotta-600/70 dark:text-cream-300/70">
                    {item.currentStock.toFixed(1)} / {item.minStock.toFixed(1)} {item.unit}
                  </p>
                </div>
              </div>
              <div
                className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${
                    item.stockStatus === 'critical'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }
                `}
              >
                {item.stockStatus === 'critical'
                  ? t('production.critical') || 'Critical'
                  : t('production.low') || 'Low'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Link */}
      {(criticalCount > 0 || lowCount > 0) && items.length > maxItems && (
        <button
          onClick={() => router.push('/baking/inventory?lowStock=true')}
          className="
            mt-4 w-full flex items-center justify-center gap-2 py-2
            text-sm text-terracotta-600 dark:text-cream-300
            hover:text-terracotta-800 dark:hover:text-cream-100
            transition-colors
          "
        >
          {t('production.viewAllLowStock') || 'View all low stock items'}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default CriticalIngredientsCard
