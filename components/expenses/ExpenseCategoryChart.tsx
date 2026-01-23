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
  categoryName: string
  categoryNameFr?: string | null
  amount: number
  color?: string | null
}

interface ExpenseCategoryChartProps {
  data: ExpenseCategoryData[]
}

// Default category colors (used when category doesn't have a color)
const CATEGORY_COLORS = [
  '#10b981', // green-500
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f59e0b', // amber-500
]

export function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
  const { locale, t } = useLocale()

  // Filter out zero amounts and assign colors
  const chartData = data
    .filter(item => item.amount > 0)
    .map((item, index) => ({
      ...item,
      color: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))

  // Format GNF amount
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
  }

  // Get localized category name
  const getLocalizedName = (item: ExpenseCategoryData) => {
    return locale === 'fr' && item.categoryNameFr ? item.categoryNameFr : item.categoryName
  }

  // Calculate total for percentages
  const total = chartData.reduce((sum, item) => sum + item.amount, 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{ payload: ExpenseCategoryData & { color: string } }>
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percentage = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0'
      return (
        <div className="bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-600 rounded-xl shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-stone-100 mb-1">
            {getLocalizedName(item)}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-stone-100">
            {formatAmount(item.amount)} GNF
          </p>
          <p className="text-sm text-gray-600 dark:text-stone-300">
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
              <span className="text-gray-700 dark:text-stone-200">
                {getLocalizedName(item)} ({percentage}%)
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-stone-400">
        <p>{t('common.noData') || 'No data available'}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="amount"
          nameKey="categoryName"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
