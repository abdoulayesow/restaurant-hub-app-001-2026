'use client'

import { useRouter } from 'next/navigation'
import { Bell, Package, Clock, ChevronRight, CheckCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ExpiryStatus } from '@/lib/inventory-helpers'

interface LowStockItem {
  id: string
  name: string
  nameFr: string
  currentStock: number
  minStock: number
  unit: string
  status: 'critical' | 'low'
}

interface ExpiringItem {
  id: string
  name: string
  nameFr: string
  status: ExpiryStatus
  daysUntilExpiry: number | null
}

interface AlertsCardProps {
  lowStockItems: LowStockItem[]
  expiringItems: ExpiringItem[]
  pendingApprovals: { sales: number; expenses: number }
  loading?: boolean
}

export function AlertsCard({
  lowStockItems,
  expiringItems,
  pendingApprovals,
  loading = false,
}: AlertsCardProps) {
  const { t, locale } = useLocale()
  const router = useRouter()

  const getLocalizedName = (item: { name: string; nameFr: string }) => {
    return locale === 'fr' ? item.nameFr : item.name
  }

  const totalAlerts = lowStockItems.length + expiringItems.length
  const totalPending = pendingApprovals.sales + pendingApprovals.expenses

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-stone-700 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-stone-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const hasNoAlerts = totalAlerts === 0 && totalPending === 0

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${totalAlerts > 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-stone-700'}`}>
            <Bell className={`w-5 h-5 ${totalAlerts > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-stone-400'}`} />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-stone-300">
            {t('dashboard.alertsAndTasks')}
          </h3>
        </div>
        {totalAlerts + totalPending > 0 && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            totalAlerts > 0
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300'
          }`}>
            {totalAlerts + totalPending}
          </span>
        )}
      </div>

      {hasNoAlerts ? (
        <div className="text-center py-8 text-gray-400 dark:text-stone-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('dashboard.allGood')}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {/* Critical stock items */}
          {lowStockItems.filter(i => i.status === 'critical').slice(0, 2).map((item) => (
            <div
              key={`stock-${item.id}`}
              onClick={() => router.push('/baking/inventory')}
              className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getLocalizedName(item)}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {t('dashboard.criticalStock')}: {item.currentStock}/{item.minStock} {item.unit}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300" />
            </div>
          ))}

          {/* Expiring items */}
          {expiringItems.filter(i => i.status === 'expired' || i.status === 'warning').slice(0, 2).map((item) => (
            <div
              key={`expiry-${item.id}`}
              onClick={() => router.push('/baking/inventory')}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group ${
                item.status === 'expired'
                  ? 'bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                  : 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 ${item.status === 'expired' ? 'text-rose-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getLocalizedName(item)}
                  </p>
                  <p className={`text-xs ${item.status === 'expired' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {item.status === 'expired'
                      ? t('dashboard.expired')
                      : `${t('dashboard.expiringSoon')}: ${item.daysUntilExpiry ?? 0} ${t('common.days')}`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300" />
            </div>
          ))}

          {/* Low stock items (non-critical) */}
          {lowStockItems.filter(i => i.status === 'low').slice(0, 2).map((item) => (
            <div
              key={`low-${item.id}`}
              onClick={() => router.push('/baking/inventory')}
              className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getLocalizedName(item)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t('dashboard.lowStock')}: {item.currentStock}/{item.minStock} {item.unit}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300" />
            </div>
          ))}

          {/* Pending approvals */}
          {pendingApprovals.sales > 0 && (
            <div
              onClick={() => router.push('/finances/sales?status=Pending')}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('nav.sales')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-stone-400">
                    {pendingApprovals.sales} {t('common.pending').toLowerCase()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300" />
            </div>
          )}

          {pendingApprovals.expenses > 0 && (
            <div
              onClick={() => router.push('/finances/expenses?status=Pending')}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('nav.expenses')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-stone-400">
                    {pendingApprovals.expenses} {t('common.pending').toLowerCase()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300" />
            </div>
          )}

          {/* View all link */}
          {totalAlerts > 4 && (
            <button
              onClick={() => router.push('/baking/inventory')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-gray-300 py-2 transition-colors"
            >
              {t('dashboard.viewAll')} ({totalAlerts})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
