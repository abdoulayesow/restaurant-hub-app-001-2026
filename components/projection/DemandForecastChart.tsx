'use client'

import { useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, BarChart3 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { DemandForecast } from '@/lib/projection-utils'
import { formatCurrencyCompact } from '@/lib/currency-utils'
import { formatDateForDisplay } from '@/lib/date-utils'

interface DemandForecastChartProps {
  forecasts: DemandForecast[]
  historicalData: Array<{ date: string; revenue: number; expenses: number }>
  palette: 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
}

export function DemandForecastChart({ forecasts, historicalData = [], palette }: DemandForecastChartProps) {
  const { t, locale } = useLocale()

  // Format currency for axis ticks (compact, no GNF suffix for space)
  const formatAxisValue = (value: number) => {
    return formatCurrencyCompact(value, locale).replace(' GNF', '')
  }

  const paletteColors = {
    terracotta: { primary: '#C45C26', light: '#E67E5C', dark: '#A04A1E' },
    warmBrown: { primary: '#8B4513', light: '#B8722D', dark: '#6B330F' },
    burntSienna: { primary: '#A0522D', light: '#C97D52', dark: '#7D3F22' },
    gold: { primary: '#D4AF37', light: '#E5C96A', dark: '#B8922A' }
  }

  const colors = paletteColors[palette]

  const chartData = useMemo(() => {
    const data: Array<{
      date: string
      label: string
      revenue?: number
      expenses?: number
      forecast?: number
      confidenceLow?: number
      confidenceHigh?: number
    }> = []

    // Add historical data (last 30 days only for cleaner chart)
    const recentHistorical = historicalData.slice(-30)

    recentHistorical.forEach((point) => {
      data.push({
        date: point.date,
        label: formatDateForDisplay(point.date, locale === 'fr' ? 'fr-GN' : 'en-GN', { month: 'short', day: 'numeric' }),
        revenue: point.revenue,
        expenses: point.expenses
      })
    })

    // Add forecast points (using 30d forecast for projection line)
    const forecast30d = forecasts.find(f => f.period === '30d')

    if (forecast30d) {
      const today = new Date()
      const dailyForecast = forecast30d.expectedRevenue / 30

      // Add 7 future points (weekly intervals for 30 days)
      for (let i = 1; i <= 4; i++) {
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + (i * 7))

        const dateStr = futureDate.toISOString().split('T')[0]
        const label = formatDateForDisplay(futureDate, locale === 'fr' ? 'fr-GN' : 'en-GN', { month: 'short', day: 'numeric' })

        data.push({
          date: dateStr,
          label,
          forecast: dailyForecast * i * 7,
          confidenceLow: (forecast30d.confidenceInterval.low / 30) * i * 7,
          confidenceHigh: (forecast30d.confidenceInterval.high / 30) * i * 7
        })
      }
    }

    return data
  }, [historicalData, forecasts, locale])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; color?: string; name?: string; dataKey?: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            if (!entry.value || entry.dataKey === 'confidenceLow' || entry.dataKey === 'confidenceHigh') return null
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-stone-600 dark:text-stone-400">
                    {entry.name}
                  </span>
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrencyCompact(entry.value, locale)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-700">
            <BarChart3 className="w-12 h-12 text-stone-400 dark:text-stone-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t('projection.noChartData') || 'No Data Available'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('projection.noChartDataDescription') || 'Need at least 7 days of sales data to generate forecasts'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-500/10">
            <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {t('projection.revenueExpenseProjection') || 'Revenue & Expense Trends'}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
              {t('projection.chartDescription') || 'Historical performance and forecast'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200 dark:stroke-stone-700" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-stone-600 dark:text-stone-400"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatAxisValue}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-stone-600 dark:text-stone-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              iconType="circle"
            />

            {/* Confidence Interval (shaded area for forecast) */}
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              stroke="transparent"
              fill="#8b5cf6"
              fillOpacity={0.1}
              name={t('projection.confidenceInterval') || 'Confidence Range'}
            />
            <Area
              type="monotone"
              dataKey="confidenceLow"
              stroke="transparent"
              fill="#8b5cf6"
              fillOpacity={0.1}
            />

            {/* Expenses (Red) */}
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#colorExpenses)"
              name={t('projection.expenses') || 'Expenses'}
              dot={false}
            />

            {/* Revenue (Brand Color) */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={colors.primary}
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
              name={t('projection.revenue') || 'Revenue'}
              dot={false}
            />

            {/* Forecast (Violet, Dashed) */}
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorForecast)"
              name={t('projection.forecast') || 'Forecast'}
              dot={{ fill: '#8b5cf6', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend/Key */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: colors.primary }} />
            <span className="text-stone-700 dark:text-stone-300 font-medium">
              {t('projection.actualRevenue') || 'Actual Revenue'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded bg-red-500" />
            <span className="text-stone-700 dark:text-stone-300 font-medium">
              {t('projection.actualExpenses') || 'Actual Expenses'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded bg-violet-500" style={{ borderTop: '2px dashed #8b5cf6' }} />
            <span className="text-stone-700 dark:text-stone-300 font-medium">
              {t('projection.projectedRevenue') || 'Revenue Forecast'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
