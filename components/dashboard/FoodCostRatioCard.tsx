'use client'

import { UtensilsCrossed, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface FoodCostRatioCardProps {
  ratio: number        // Current food cost ratio (percentage)
  target: number       // Target percentage (e.g., 30)
  foodExpenses: number // Total food expenses in GNF
  revenue: number      // Total revenue for context
  loading?: boolean
}

export function FoodCostRatioCard({
  ratio,
  target,
  foodExpenses,
  revenue,
  loading = false,
}: FoodCostRatioCardProps) {
  const { t, locale } = useLocale()

  const formatGNF = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  // Determine status based on ratio vs target
  const getStatus = () => {
    if (ratio <= target - 5) return 'excellent'
    if (ratio <= target) return 'good'
    if (ratio <= target + 5) return 'warning'
    return 'high'
  }

  const status = getStatus()

  const statusConfig = {
    excellent: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      progressColor: 'bg-emerald-500',
      icon: TrendingDown,
      label: t('dashboard.foodCostExcellent'),
    },
    good: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      progressColor: 'bg-emerald-500',
      icon: Minus,
      label: t('dashboard.foodCostGood'),
    },
    warning: {
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      progressColor: 'bg-amber-500',
      icon: TrendingUp,
      label: t('dashboard.foodCostWarning'),
    },
    high: {
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-900/30',
      borderColor: 'border-rose-200 dark:border-rose-800',
      progressColor: 'bg-rose-500',
      icon: TrendingUp,
      label: t('dashboard.foodCostHigh'),
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  // Calculate progress bar width (cap at 100% for visual)
  const progressWidth = Math.min((ratio / (target * 1.5)) * 100, 100)
  const targetPosition = (target / (target * 1.5)) * 100

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-stone-700 rounded w-1/2"></div>
          <div className="h-16 bg-gray-200 dark:bg-stone-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-stone-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-stone-800 rounded-xl shadow-sm border ${config.borderColor} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <UtensilsCrossed className={`w-5 h-5 ${config.color}`} />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-stone-300">
            {t('dashboard.foodCostRatio')}
          </h3>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>

      {/* Main value */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${config.color}`}>
            {ratio}%
          </span>
          <span className="text-sm text-gray-500 dark:text-stone-400">
            / {target}% {t('dashboard.target')}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-3 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.progressColor} rounded-full transition-all duration-500`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        {/* Target marker */}
        <div
          className="absolute top-0 h-3 w-0.5 bg-gray-400 dark:bg-stone-500"
          style={{ left: `${targetPosition}%` }}
        />
        <div
          className="absolute -top-1 text-[10px] text-gray-500 dark:text-stone-400 transform -translate-x-1/2"
          style={{ left: `${targetPosition}%` }}
        >
          {target}%
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-500 dark:text-stone-400">{t('dashboard.foodExpenses')}: </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatGNF(foodExpenses)} GNF
          </span>
        </div>
        {revenue > 0 && (
          <div className="text-gray-500 dark:text-stone-400">
            {formatGNF(revenue)} GNF {t('dashboard.ofRevenue')}
          </div>
        )}
      </div>
    </div>
  )
}
