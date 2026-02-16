'use client'

import { useMemo, useState } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, BarChart3, Eye, EyeOff } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { DemandForecast } from '@/lib/projection-utils'
import { formatCurrencyCompact } from '@/lib/currency-utils'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

export type ForecastPeriod = '7d' | '14d' | '30d'

interface DemandForecastChartProps {
  forecasts: DemandForecast[]
  historicalData: Array<{ date: string; revenue: number; expenses: number }>
  palette: 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
  selectedPeriod?: ForecastPeriod
}

interface SeriesVisibility {
  revenue: boolean
  expenses: boolean
}

// Symmetrical: show same number of historical days as forecast days
const PERIOD_CONFIG: Record<ForecastPeriod, { days: number; intervals: number; intervalDays: number }> = {
  '7d': { days: 7, intervals: 7, intervalDays: 1 },
  '14d': { days: 14, intervals: 14, intervalDays: 1 },
  '30d': { days: 30, intervals: 10, intervalDays: 3 }
}

export function DemandForecastChart({
  forecasts,
  historicalData = [],
  palette,
  selectedPeriod = '7d'
}: DemandForecastChartProps) {
  const { t, locale } = useLocale()
  const [visibility, setVisibility] = useState<SeriesVisibility>({
    revenue: true,
    expenses: false
  })

  const toggleVisibility = (series: keyof SeriesVisibility) => {
    setVisibility(prev => ({ ...prev, [series]: !prev[series] }))
  }

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

  // Pre-compute translated labels for legend
  const labels = {
    revenue: t('projection.actualSales') || 'Actual Sales',
    expenses: t('dashboard.expenses') || 'Expenses'
  }

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

    const config = PERIOD_CONFIG[selectedPeriod]
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create a map of historical data by date for quick lookup
    const historicalMap = new Map<string, { revenue: number; expenses: number }>()
    historicalData.forEach((point) => {
      historicalMap.set(point.date, { revenue: point.revenue, expenses: point.expenses })
    })

    // Generate complete calendar for past N days (with 0 for missing days)
    for (let i = config.days; i >= 1; i--) {
      const pastDate = new Date(today)
      pastDate.setDate(pastDate.getDate() - i)
      // Use local date components directly (no UTC conversion) to match API date strings
      const dateStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`
      const label = formatUTCDateForDisplay(dateStr, locale === 'fr' ? 'fr-GN' : 'en-GN', { month: 'short', day: 'numeric' })

      // Get data from map, or default to 0
      const dayData = historicalMap.get(dateStr)

      data.push({
        date: dateStr,
        label,
        revenue: dayData?.revenue ?? 0,
        expenses: dayData?.expenses ?? 0
      })
    }

    // Add forecast points based on selected period
    const selectedForecast = forecasts.find(f => f.period === selectedPeriod)

    if (selectedForecast) {
      // Daily forecast value (not cumulative!)
      const dailyForecast = selectedForecast.expectedRevenue / config.days
      const dailyConfidenceLow = selectedForecast.confidenceInterval.low / config.days
      const dailyConfidenceHigh = selectedForecast.confidenceInterval.high / config.days

      // Add forecast points at configured intervals - showing DAILY values
      for (let i = 1; i <= config.intervals; i++) {
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + (i * config.intervalDays))

        const dateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`
        const label = formatUTCDateForDisplay(dateStr, locale === 'fr' ? 'fr-GN' : 'en-GN', { month: 'short', day: 'numeric' })

        // Show daily value (averaged over interval days if interval > 1)
        data.push({
          date: dateStr,
          label,
          forecast: dailyForecast * config.intervalDays,
          confidenceLow: dailyConfidenceLow * config.intervalDays,
          confidenceHigh: dailyConfidenceHigh * config.intervalDays
        })
      }
    }

    return data
  }, [historicalData, forecasts, locale, selectedPeriod])

  // Map dataKey to translated label for tooltip
  const getDataKeyLabel = (dataKey: string) => {
    switch (dataKey) {
      case 'revenue': return labels.revenue
      case 'expenses': return labels.expenses
      case 'forecast': return t('projection.forecastedData') || 'Forecast'
      default: return dataKey
    }
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; color?: string; name?: string; dataKey?: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl p-4 min-w-[180px]">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3 pb-2 border-b border-stone-200 dark:border-stone-700">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            if (!entry.value || entry.dataKey === 'confidenceLow' || entry.dataKey === 'confidenceHigh') return null
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-stone-800"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-stone-600 dark:text-stone-400">
                    {getDataKeyLabel(entry.dataKey || '')}
                  </span>
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatCurrencyCompact(entry.value, locale)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Check if there's any actual historical data in the selected period
  const hasRecentData = chartData.some(d => (d.revenue ?? 0) > 0 || (d.expenses ?? 0) > 0)

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
      {/* Header with integrated legend and period selector */}
      <div className="p-6 border-b border-stone-200 dark:border-stone-700">
        <div className="flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('projection.revenueProjection') || 'Revenue Projection'}
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('projection.revenueProjectionDescription') || 'Historical performance and future demand forecasts'}
              </p>
            </div>
          </div>

          {/* Legend row with toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {/* Revenue toggle */}
            <button
              onClick={() => toggleVisibility('revenue')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200
                ${visibility.revenue
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 bg-transparent hover:bg-stone-100 dark:hover:bg-stone-700/50'
                }
              `}
              style={visibility.revenue ? { backgroundColor: colors.primary } : undefined}
            >
              {visibility.revenue ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{labels.revenue}</span>
            </button>

            {/* Expenses toggle */}
            <button
              onClick={() => toggleVisibility('expenses')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200
                ${visibility.expenses
                  ? 'bg-red-500 border-transparent text-white shadow-sm'
                  : 'border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 bg-transparent hover:bg-stone-100 dark:hover:bg-stone-700/50'
                }
              `}
            >
              {visibility.expenses ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{labels.expenses}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 relative">
        {!hasRecentData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-stone-800/80 rounded-b-2xl">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 text-stone-400 dark:text-stone-500" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                {t('projection.noRecentSalesData') || 'No sales data in this period'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {t('projection.tryLongerPeriod') || 'Try selecting a longer time period'}
              </p>
            </div>
          </div>
        )}
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
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
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

            {/* Expenses (Red) */}
            {visibility.expenses && (
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorExpenses)"
                dot={false}
              />
            )}

            {/* Revenue (Brand Color) */}
            {visibility.revenue && (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={colors.primary}
                strokeWidth={2.5}
                fill="url(#colorRevenue)"
                dot={false}
              />
            )}

            {/* Revenue Forecast (Violet, Dashed) - shows automatically when revenue is visible */}
            {visibility.revenue && (
              <>
                {/* Confidence Interval (shaded area) */}
                <Area
                  type="monotone"
                  dataKey="confidenceHigh"
                  stroke="transparent"
                  fill={colors.primary}
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="confidenceLow"
                  stroke="transparent"
                  fill={colors.primary}
                  fillOpacity={0.1}
                />
                {/* Forecast line */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#colorForecast)"
                  dot={{ fill: colors.primary, r: 3 }}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
