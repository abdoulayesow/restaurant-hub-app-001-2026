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

interface ExpenseTrendDataPoint {
  date: string
  amount: number
}

interface ExpenseTrendChartProps {
  data: ExpenseTrendDataPoint[]
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  const { locale, t } = useLocale()

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
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
        <div className="bg-cream-50 dark:bg-plum-800 border-2 border-plum-200 dark:border-plum-600 rounded-xl shadow-lg p-3">
          <p className="bliss-body text-sm text-plum-600 dark:text-plum-300 mb-1">
            {formatDate(label)}
          </p>
          <p className="bliss-body text-lg font-bold text-plum-800 dark:text-cream-100">
            {new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(payload[0].value)} GNF
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-plum-600/60 dark:text-plum-300/60">
        <p className="bliss-body">{t('common.noData') || 'No data available'}</p>
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
            <stop offset="5%" stopColor="#3D1B4D" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3D1B4D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E1D4EB" className="dark:stroke-plum-700" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#6B5744"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatAmount}
          stroke="#6B5744"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#3D1B4D"
          strokeWidth={2}
          fill="url(#expensesGradient)"
          dot={false}
          activeDot={{ r: 6, fill: '#3D1B4D', stroke: '#FFFEFE', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
