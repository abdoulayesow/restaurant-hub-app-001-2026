'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { DemandForecast } from '@/lib/projection-utils'
import { formatCurrencyCompact } from '@/lib/currency-utils'

type ForecastPeriod = '7d' | '14d' | '30d'

interface DemandForecastCardProps {
  forecasts: DemandForecast[]
  selectedPeriod?: ForecastPeriod
}

export function DemandForecastCard({ forecasts, selectedPeriod = '30d' }: DemandForecastCardProps) {
  const { t, locale } = useLocale()

  // Use selected period as the primary display
  const primaryForecast = forecasts.find(f => f.period === selectedPeriod) || forecasts[0]

  if (!primaryForecast) {
    return null
  }

  const getTrendIcon = () => {
    switch (primaryForecast.trend) {
      case 'GROWING':
        return <TrendingUp className="w-4 h-4" />
      case 'DECLINING':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    switch (primaryForecast.trend) {
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
            {t('projection.demandForecast') || 'Revenue Forecast'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {selectedPeriod === '7d' ? (t('projection.next7Days') || 'Next 7 days') :
             selectedPeriod === '14d' ? (t('projection.next14Days') || 'Next 14 days') :
             (t('projection.next30Days') || 'Next 30 days')}
          </p>
        </div>
      </div>

      {/* Primary Forecast - Large Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {formatCurrencyCompact(primaryForecast.expectedRevenue, locale)}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {t('projection.expectedRevenue') || 'Expected revenue'}
        </p>
      </div>

      {/* All Periods - Compact List */}
      <div className="space-y-2">
        {forecasts.map((forecast) => {
          const isPrimary = forecast.period === primaryForecast.period

          return (
            <div
              key={forecast.period}
              className={`flex items-center justify-between text-sm ${
                isPrimary ? 'opacity-50' : ''
              }`}
            >
              <span className="text-stone-600 dark:text-stone-300">
                {forecast.period === '7d' ? (t('projection.next7Days') || '7 days') :
                 forecast.period === '14d' ? (t('projection.next14Days') || '14 days') :
                 (t('projection.next30Days') || '30 days')}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  forecast.trend === 'GROWING'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : forecast.trend === 'DECLINING'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-stone-500'
                }`}>
                  {forecast.trendPercentage > 0 ? '+' : ''}{forecast.trendPercentage.toFixed(0)}%
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrencyCompact(forecast.expectedRevenue, locale)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
