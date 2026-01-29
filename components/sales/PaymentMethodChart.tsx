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
import { PAYMENT_METHOD_COLORS } from '@/lib/constants/payment-methods'

interface PaymentMethodData {
  name: string
  nameFr: string
  amount: number
  color: string
}

interface PaymentMethodChartProps {
  cash: number
  orangeMoney: number
  card: number
}

// Payment method colors from centralized constants
const PAYMENT_COLORS = {
  cash: PAYMENT_METHOD_COLORS.Cash.hex,
  orangeMoney: PAYMENT_METHOD_COLORS.OrangeMoney.hex,
  card: PAYMENT_METHOD_COLORS.Card.hex,
}

export function PaymentMethodChart({ cash, orangeMoney, card }: PaymentMethodChartProps) {
  const { locale, t } = useLocale()

  // Build data array
  const data: PaymentMethodData[] = [
    { name: 'Cash', nameFr: 'Espèces', amount: cash, color: PAYMENT_COLORS.cash },
    { name: 'Orange Money', nameFr: 'Orange Money', amount: orangeMoney, color: PAYMENT_COLORS.orangeMoney },
    { name: 'Card', nameFr: 'Carte', amount: card, color: PAYMENT_COLORS.card },
  ].filter(item => item.amount > 0) // Only show payment methods with amounts

  // Format GNF amount
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
  }

  // Get localized name
  const getLocalizedName = (item: PaymentMethodData) => {
    return locale === 'fr' ? item.nameFr : item.name
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{ payload: PaymentMethodData }>
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
  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string; payload: PaymentMethodData }> }) => {
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
