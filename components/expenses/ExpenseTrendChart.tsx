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

interface ExpenseTrendDataPoint {
  date: string
  amount: number
}

interface ExpenseTrendChartProps {
  data: ExpenseTrendDataPoint[]
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  const { locale, t } = useLocale()

  // Format date for display (using UTC version to avoid timezone shifts)
  const formatDate = (dateString: string) => {
    return formatUTCDateForDisplay(dateString, locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Format GNF amount for axis
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
  }) => {
    if (active && payload && payload.length && label) {
      return (
        <div className="bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-600 rounded-xl shadow-lg p-3">
          <p className="text-sm text-gray-600 dark:text-stone-300 mb-1">
            {formatDate(label)}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-stone-100">
            {new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(payload[0].value)} GNF
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-stone-400">
        <p>{t('common.noData') || 'No data available'}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#374151" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#374151" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-stone-600" />
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#374151"
          strokeWidth={2}
          fill="url(#expensesGradient)"
          dot={false}
          activeDot={{ r: 6, fill: '#374151', stroke: '#ffffff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
