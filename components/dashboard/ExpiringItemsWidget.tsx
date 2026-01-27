'use client'

import { AlertTriangle, ChevronRight, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ExpiryStatusBadge } from '@/components/inventory/ExpiryStatusBadge'
import { ExpiryStatus } from '@/lib/inventory-helpers'

interface ExpiringItem {
  id: string
  name: string
  nameFr: string
  category: string | null
  currentStock: number
  unit: string
  expiryDate: string | null
  status: ExpiryStatus
  daysUntilExpiry: number | null
}

interface ExpiringItemsWidgetProps {
  items: ExpiringItem[]
  expiredCount: number
  warningCount: number
  loading?: boolean
}

export function ExpiringItemsWidget({
  items,
  expiredCount,
  warningCount,
  loading = false,
}: ExpiringItemsWidgetProps) {
  const { t, locale } = useLocale()
  const router = useRouter()

  const getName = (item: ExpiringItem) => {
    return locale === 'fr' && item.nameFr ? item.nameFr : item.name
  }

  const formatStock = (stock: number, unit: string) => {
    return `${stock} ${unit}`
  }

  const totalCount = expiredCount + warningCount

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          {t('dashboard.expiringItems') || 'Expiring Items'}
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          totalCount > 0
            ? expiredCount > 0
              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        }`}>
          {totalCount}
        </span>
      </div>

      {/* Summary Stats */}
      {totalCount > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {expiredCount > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800/50">
              <div className="text-xs text-rose-700 dark:text-rose-400 mb-1">
                {t('dashboard.expired') || 'Expired'}
              </div>
              <div className="text-lg font-bold text-rose-700 dark:text-rose-400">
                {expiredCount}
              </div>
            </div>
          )}
          {warningCount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <div className="text-xs text-amber-700 dark:text-amber-400 mb-1">
                {t('dashboard.expiringSoon') || 'Expiring Soon'}
              </div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {warningCount}
              </div>
            </div>
          )}
        </div>
      )}

      {totalCount > 0 ? (
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              onClick={() => router.push(`/baking/inventory?search=${encodeURIComponent(item.name)}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  item.status === 'expired' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getName(item)}
                    {item.category && (
                      <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                        • {item.category}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{formatStock(item.currentStock, item.unit)}</span>
                    {item.daysUntilExpiry !== null && (
                      <span className={item.status === 'expired' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                        {item.daysUntilExpiry < 0
                          ? `${Math.abs(item.daysUntilExpiry)}${t('inventory.expiry.daysAgo') || 'd ago'}`
                          : item.daysUntilExpiry === 0
                          ? t('inventory.expiry.today') || 'Today'
                          : `${item.daysUntilExpiry}${t('inventory.expiry.daysLeft') || 'd'}`
                        }
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExpiryStatusBadge
                  status={item.status}
                  daysUntilExpiry={item.daysUntilExpiry}
                  showDays={false}
                />
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
            </div>
          ))}
          {totalCount > 5 && (
            <button
              onClick={() => router.push('/baking/inventory?view=expiry')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 py-2 transition-colors"
            >
              {t('dashboard.viewAll') || 'View all'} ({totalCount})
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('dashboard.allItemsFresh') || 'All items are fresh!'}</p>
        </div>
      )}
    </div>
  )
}
