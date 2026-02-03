'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProfitabilityData } from '@/lib/projection-utils'

interface ProfitabilityCardProps {
  data: ProfitabilityData
  palette: 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
}

export function ProfitabilityCard({ data }: ProfitabilityCardProps) {
  const { t } = useLocale()

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'GROWING':
        return <TrendingUp className="w-4 h-4" />
      case 'DECLINING':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    switch (data.trend) {
      case 'GROWING':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      case 'DECLINING':
        return 'text-red-600 dark:text-red-400 bg-red-500/10'
      default:
        return 'text-stone-600 dark:text-stone-400 bg-stone-500/10'
    }
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-lg ${getTrendColor()}`}>
          {getTrendIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
            {t('projection.profitMargin') || 'Profit Margin'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {data.trend === 'GROWING' ? (t('projection.improving') || 'Improving') :
             data.trend === 'DECLINING' ? (t('projection.declining') || 'Declining') :
             (t('projection.stable') || 'Stable')}
          </p>
        </div>
      </div>

      {/* Current Margin - Large Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            {data.currentMargin.toFixed(1)}
          </span>
          <span className="text-lg text-stone-500 dark:text-stone-400">%</span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {t('projection.currentMargin') || 'Current margin'}
        </p>
      </div>

      {/* Period Comparison - Compact */}
      <div className="space-y-2">
        {data.periodComparison.map((period, index) => {
          const isFirst = index === 0
          const change = isFirst && data.periodComparison[1]
            ? period.margin - data.periodComparison[1].margin
            : 0
          const showChange = isFirst && data.periodComparison.length > 1

          return (
            <div
              key={period.period}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-stone-600 dark:text-stone-300">
                {period.period === '30d' ? (t('projection.last30d') || 'Last 30d') :
                 period.period === '60d' ? (t('projection.last60d') || 'Last 60d') :
                 period.period}
              </span>
              <div className="flex items-center gap-2">
                {showChange && Math.abs(change) > 0.1 && (
                  <span className={`text-xs font-medium ${
                    change > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                )}
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {period.margin.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
