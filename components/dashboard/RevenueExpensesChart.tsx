'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

interface DataPoint {
  date: string
  revenue: number
  expenses: number
}

interface RevenueExpensesChartProps {
  data: DataPoint[]
}

export function RevenueExpensesChart({ data }: RevenueExpensesChartProps) {
  const { locale, t } = useLocale()

  // Debug: Log chart data
  if (typeof window !== 'undefined') {
    const nonZeroData = data.filter(d => d.revenue > 0 || d.expenses > 0)
    console.log('[RevenueExpensesChart] Total points:', data.length, 'Non-zero:', nonZeroData.length)
    if (nonZeroData.length > 0) {
      console.log('[RevenueExpensesChart] Sample data:', nonZeroData.slice(0, 3))
    }
  }

  // Format date for display (using UTC version to avoid timezone shifts)
  const formatDate = (dateString: string) => {
    return formatUTCDateForDisplay(dateString, locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Format GNF amount
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const formatFullAmount = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; dataKey: string; color: string }>
    label?: string
  }) => {
    if (active && payload && payload.length && label) {
      const revenue = payload.find(p => p.dataKey === 'revenue')?.value || 0
      const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0
      const profit = revenue - expenses

      return (
        <div className="bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-600 rounded-lg shadow-lg p-3 min-w-[160px]">
          <p className="text-sm text-gray-600 dark:text-stone-300 mb-2 font-medium">
            {formatDate(label)}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {t('dashboard.revenue')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatFullAmount(revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {t('dashboard.expenses')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatFullAmount(expenses)}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-stone-600 pt-1.5 mt-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600 dark:text-stone-400">
                  {t('dashboard.profit')}
                </span>
                <span className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {profit >= 0 ? '+' : ''}{formatFullAmount(profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const CustomLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-2">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
        <span className="text-xs text-gray-600 dark:text-stone-400">{t('dashboard.revenue')}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
        <span className="text-xs text-gray-600 dark:text-stone-400">{t('dashboard.expenses')}</span>
      </div>
    </div>
  )

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-stone-400">
        <p>{t('dashboard.noData')}</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-stone-700" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatAmount}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={60}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#F43F5E"
            strokeWidth={2}
            fill="url(#expensesGradient)"
            dot={{ r: 3, fill: '#F43F5E', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  )
}
