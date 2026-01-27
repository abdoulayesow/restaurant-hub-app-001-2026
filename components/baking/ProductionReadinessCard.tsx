'use client'

import { ChefHat, Clock, CheckCircle2, PlayCircle, FileEdit } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

type ProductionStatus = 'Planning' | 'Ready' | 'InProgress' | 'Complete'

interface ProductionLog {
  id: string
  productName: string
  productNameFr?: string | null
  quantity: number
  preparationStatus: ProductionStatus
  date: string
}

interface ProductionReadinessCardProps {
  productionLogs: ProductionLog[]
  loading?: boolean
  onStatusChange?: (id: string, newStatus: ProductionStatus) => void
}

const statusConfig: Record<
  ProductionStatus,
  {
    icon: typeof ChefHat
    color: string
    bgColor: string
    borderColor: string
  }
> = {
  Planning: {
    icon: FileEdit,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  Ready: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  InProgress: {
    icon: PlayCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  Complete: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
}

export function ProductionReadinessCard({
  productionLogs,
  loading = false,
  onStatusChange,
}: ProductionReadinessCardProps) {
  const { t, locale } = useLocale()

  // Count by status
  const statusCounts = productionLogs.reduce(
    (acc, log) => {
      acc[log.preparationStatus] = (acc[log.preparationStatus] || 0) + 1
      return acc
    },
    {} as Record<ProductionStatus, number>
  )

  // Get today's logs (for the mini list)
  const today = new Date().toISOString().split('T')[0]
  const todaysLogs = productionLogs.filter(
    (log) => log.date.split('T')[0] === today
  )

  const getStatusLabel = (status: ProductionStatus) => {
    const labels: Record<ProductionStatus, string> = {
      Planning: t('production.statusPlanning') || 'Planning',
      Ready: t('production.statusReady') || 'Ready',
      InProgress: t('production.statusInProgress') || 'In Progress',
      Complete: t('production.statusComplete') || 'Complete',
    }
    return labels[status]
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-stone-700 rounded w-1/2 mb-4" />
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-stone-700 rounded" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 dark:bg-stone-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-stone-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
          <ChefHat className="w-5 h-5 text-gray-700 dark:text-stone-300" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-stone-100">
            {t('production.productionStatus') || 'Production Status'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-stone-400">
            {todaysLogs.length} {t('production.itemsToday') || "items today"}
          </p>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(['Planning', 'Ready', 'InProgress', 'Complete'] as ProductionStatus[]).map(
          (status) => {
            const config = statusConfig[status]
            const Icon = config.icon
            const count = statusCounts[status] || 0

            return (
              <div
                key={status}
                className={`
                  p-3 rounded-lg text-center
                  ${config.bgColor}
                  border ${config.borderColor}
                `}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${config.color}`} />
                <p className="text-lg font-bold text-gray-900 dark:text-stone-100">
                  {count}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-stone-400 truncate">
                  {getStatusLabel(status)}
                </p>
              </div>
            )
          }
        )}
      </div>

      {/* Today's Production List */}
      {todaysLogs.length === 0 ? (
        <div className="py-6 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-stone-600" />
          <p className="text-sm text-gray-500 dark:text-stone-400">
            {t('production.noProductionToday') || 'No production logged today'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {todaysLogs.slice(0, 4).map((log) => {
            const config = statusConfig[log.preparationStatus]
            const Icon = config.icon

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                      {locale === 'fr' && log.productNameFr
                        ? log.productNameFr
                        : log.productName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-stone-400">
                      {t('production.quantity') || 'Qty'}: {log.quantity}
                    </p>
                  </div>
                </div>

                {/* Status selector */}
                {onStatusChange && log.preparationStatus !== 'Complete' && (
                  <select
                    value={log.preparationStatus}
                    onChange={(e) =>
                      onStatusChange(log.id, e.target.value as ProductionStatus)
                    }
                    className={`
                      text-xs px-2 py-1 rounded-lg border
                      bg-transparent ${config.color} ${config.borderColor}
                      focus:ring-1 focus:ring-gray-500
                    `}
                  >
                    <option value="Planning">{getStatusLabel('Planning')}</option>
                    <option value="Ready">{getStatusLabel('Ready')}</option>
                    <option value="InProgress">{getStatusLabel('InProgress')}</option>
                    <option value="Complete">{getStatusLabel('Complete')}</option>
                  </select>
                )}

                {log.preparationStatus === 'Complete' && (
                  <span
                    className={`text-xs px-2 py-1 rounded-lg ${config.bgColor} ${config.color}`}
                  >
                    {getStatusLabel('Complete')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProductionReadinessCard
