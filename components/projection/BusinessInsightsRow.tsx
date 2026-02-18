'use client'

import { useMemo } from 'react'
import { Minus, ArrowUpRight, ArrowDownRight, Receipt, Banknote, Scale } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatCurrencyCompact } from '@/lib/currency-utils'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

interface HistoricalDataPoint {
  date: string
  revenue: number
  expenses: number
}

interface BusinessInsightsRowProps {
  historicalData: HistoricalDataPoint[]
}

function computeWeeklyTrend(values: number[]): { percentage: number; direction: 'up' | 'down' | 'flat' } {
  if (values.length < 14) {
    return { percentage: 0, direction: 'flat' }
  }

  const recent7 = values.slice(-7)
  const previous7 = values.slice(-14, -7)

  const recentAvg = recent7.reduce((a, b) => a + b, 0) / recent7.length
  const previousAvg = previous7.reduce((a, b) => a + b, 0) / previous7.length

  if (previousAvg === 0) return { percentage: 0, direction: 'flat' }

  const change = ((recentAvg - previousAvg) / previousAvg) * 100

  return {
    percentage: Math.abs(change),
    direction: change > 2 ? 'up' : change < -2 ? 'down' : 'flat'
  }
}

function findPeakDay(data: HistoricalDataPoint[], field: 'revenue' | 'expenses') {
  if (data.length === 0) return null

  let peak = data[0]
  for (const point of data) {
    if (point[field] > peak[field]) {
      peak = point
    }
  }

  return { date: peak.date, value: peak[field] }
}

export function BusinessInsightsRow({ historicalData }: BusinessInsightsRowProps) {
  const { t, locale } = useLocale()

  const insights = useMemo(() => {
    if (historicalData.length === 0) {
      return {
        avgRevenue: 0,
        avgExpenses: 0,
        avgNetIncome: 0,
        netMargin: 0,
        revenueTrend: { percentage: 0, direction: 'flat' as const },
        expenseTrend: { percentage: 0, direction: 'flat' as const },
        bestRevenueDay: null as ReturnType<typeof findPeakDay>,
        highestExpenseDay: null as ReturnType<typeof findPeakDay>,
        revenueRatio: 50
      }
    }

    const totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0)
    const totalExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0)
    const days = historicalData.length

    const avgRevenue = totalRevenue / days
    const avgExpenses = totalExpenses / days
    const avgNetIncome = avgRevenue - avgExpenses
    const netMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0

    const revenueValues = historicalData.map(d => d.revenue)
    const expenseValues = historicalData.map(d => d.expenses)

    const revenueRatio = totalRevenue + totalExpenses > 0
      ? (totalRevenue / (totalRevenue + totalExpenses)) * 100
      : 50

    return {
      avgRevenue,
      avgExpenses,
      avgNetIncome,
      netMargin,
      revenueTrend: computeWeeklyTrend(revenueValues),
      expenseTrend: computeWeeklyTrend(expenseValues),
      bestRevenueDay: findPeakDay(historicalData, 'revenue'),
      highestExpenseDay: findPeakDay(historicalData, 'expenses'),
      revenueRatio
    }
  }, [historicalData])

  const formatDateLabel = (dateStr: string) =>
    formatUTCDateForDisplay(dateStr + 'T00:00:00.000Z', locale === 'fr' ? 'fr-GN' : 'en-GN', { month: 'short', day: 'numeric' })

  const TrendBadge = ({ trend }: { trend: { percentage: number; direction: 'up' | 'down' | 'flat' } }) => {
    if (trend.direction === 'flat') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400">
          <Minus className="w-3 h-3" />
          {t('projection.stable') || 'Stable'}
        </span>
      )
    }

    const isUp = trend.direction === 'up'
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
        isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend.percentage.toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Revenue Insights */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10">
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
              {t('projection.revenueInsights') || 'Revenue Insights'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('projection.dailyAverage') || 'Daily average'}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {formatCurrencyCompact(insights.avgRevenue, locale)}
            </span>
            <TrendBadge trend={insights.revenueTrend} />
          </div>
        </div>

        {insights.bestRevenueDay && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {t('projection.bestDay') || 'Best day'}
              </span>
              <div className="text-right">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyCompact(insights.bestRevenueDay.value, locale)}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 ml-1.5">
                  {formatDateLabel(insights.bestRevenueDay.date)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Insights */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-red-500/10">
            <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
              {t('projection.expenseInsights') || 'Expense Insights'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('projection.dailyAverage') || 'Daily average'}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {formatCurrencyCompact(insights.avgExpenses, locale)}
            </span>
            <TrendBadge trend={insights.expenseTrend} />
          </div>
        </div>

        {insights.highestExpenseDay && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {t('projection.highestDay') || 'Highest day'}
              </span>
              <div className="text-right">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatCurrencyCompact(insights.highestExpenseDay.value, locale)}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 ml-1.5">
                  {formatDateLabel(insights.highestExpenseDay.date)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Net Income Overview */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${
            insights.avgNetIncome >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            <Scale className={`w-4 h-4 ${
              insights.avgNetIncome >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
              {t('projection.netIncomeOverview') || 'Net Income'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('projection.dailyAverage') || 'Daily average'}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              insights.avgNetIncome >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrencyCompact(insights.avgNetIncome, locale)}
            </span>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              {insights.netMargin.toFixed(1)}% {t('projection.margin') || 'margin'}
            </span>
          </div>
        </div>

        {/* Revenue vs Expense ratio bar */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-700">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span>{t('projection.revenue') || 'Revenue'}</span>
            <span>{t('dashboard.expenses') || 'Expenses'}</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-700">
            <div
              className="bg-emerald-500 dark:bg-emerald-400 rounded-l-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, insights.revenueRatio))}%` }}
            />
            <div
              className="bg-red-400 dark:bg-red-500 rounded-r-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, 100 - insights.revenueRatio))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium mt-1">
            <span className="text-emerald-600 dark:text-emerald-400">
              {insights.revenueRatio.toFixed(0)}%
            </span>
            <span className="text-red-600 dark:text-red-400">
              {(100 - insights.revenueRatio).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
