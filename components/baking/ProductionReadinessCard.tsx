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
    color: 'text-terracotta-600 dark:text-terracotta-400',
    bgColor: 'bg-terracotta-50 dark:bg-terracotta-900/20',
    borderColor: 'border-terracotta-200 dark:border-terracotta-800',
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
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
        <div className="animate-pulse">
          <div className="h-5 bg-cream-200 dark:bg-dark-700 rounded w-1/2 mb-4" />
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-cream-200 dark:bg-dark-700 rounded" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-10 bg-cream-200 dark:bg-dark-700 rounded" />
            <div className="h-10 bg-cream-200 dark:bg-dark-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
          <ChefHat className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" />
        </div>
        <div>
          <h3
            className="font-semibold text-terracotta-900 dark:text-cream-100"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            {t('production.productionStatus') || 'Production Status'}
          </h3>
          <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
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
                  p-3 rounded-xl text-center
                  ${config.bgColor}
                  border ${config.borderColor}
                `}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${config.color}`} />
                <p className="text-lg font-bold text-terracotta-900 dark:text-cream-100">
                  {count}
                </p>
                <p className="text-[10px] text-terracotta-600/70 dark:text-cream-300/70 truncate">
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
          <Clock className="w-10 h-10 mx-auto mb-3 text-terracotta-300 dark:text-dark-600" />
          <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70">
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
                className="flex items-center justify-between p-3 rounded-xl bg-cream-50 dark:bg-dark-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                      {locale === 'fr' && log.productNameFr
                        ? log.productNameFr
                        : log.productName}
                    </p>
                    <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
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
                      focus:ring-1 focus:ring-terracotta-500
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
