'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ExpenseCategoryData {
  name: string
  nameFr: string
  amount: number
  color: string
}

interface ExpensesPieChartProps {
  data: ExpenseCategoryData[]
}

export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  const { locale, t } = useLocale()

  // Format GNF amount
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
  }

  // Get localized name
  const getLocalizedName = (item: ExpenseCategoryData) => {
    return locale === 'fr' ? item.nameFr : item.name
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{ payload: ExpenseCategoryData }>
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percentage = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0'
      return (
        <div className="bg-cream-100 dark:bg-dark-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100 mb-1">
            {getLocalizedName(item)}
          </p>
          <p className="text-lg font-bold text-terracotta-900 dark:text-cream-100">
            {formatAmount(item.amount)} GNF
          </p>
          <p className="text-sm text-terracotta-600 dark:text-cream-300">
            {percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string; payload: ExpenseCategoryData }> }) => {
    if (!payload) return null
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm">
        {payload.map((entry, index) => {
          const item = entry.payload
          const percentage = total > 0 ? ((item.amount / total) * 100).toFixed(0) : '0'
          return (
            <li key={`legend-${index}`} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-terracotta-700 dark:text-cream-200">
                {getLocalizedName(item)} ({percentage}%)
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-terracotta-600/60 dark:text-cream-300/60">
        <p>{t('common.noData')}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="amount"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
