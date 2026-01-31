'use client'

import { PieChart } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ExpenseGroup {
  key: string
  label: string
  labelFr: string
  amount: number
  color: string
}

interface ExpenseBreakdownCardProps {
  expensesByGroup: ExpenseGroup[]
  totalExpenses: number
  loading?: boolean
}

export function ExpenseBreakdownCard({
  expensesByGroup,
  totalExpenses,
  loading = false,
}: ExpenseBreakdownCardProps) {
  const { t, locale } = useLocale()

  const formatGNF = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const getLocalizedLabel = (group: ExpenseGroup) => {
    return locale === 'fr' ? group.labelFr : group.label
  }

  // Icon mapping for expense groups
  const groupIcons: Record<string, string> = {
    food: '🍞',
    transport: '🚚',
    utilities: '💡',
    salaries: '👤',
    other: '📦',
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-stone-700 rounded w-1/2"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-stone-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-stone-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!expensesByGroup || expensesByGroup.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-stone-700">
            <PieChart className="w-5 h-5 text-gray-600 dark:text-stone-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-stone-300">
            {t('dashboard.expenseBreakdown')}
          </h3>
        </div>
        <div className="text-center py-6 text-gray-500 dark:text-stone-400">
          {t('dashboard.noExpenses')}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-stone-700">
            <PieChart className="w-5 h-5 text-gray-600 dark:text-stone-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-stone-300">
            {t('dashboard.expenseBreakdown')}
          </h3>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {formatGNF(totalExpenses)} GNF
        </span>
      </div>

      {/* Expense bars */}
      <div className="space-y-4">
        {expensesByGroup.map((group) => {
          const percentage = totalExpenses > 0 ? Math.round((group.amount / totalExpenses) * 100) : 0

          return (
            <div key={group.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{groupIcons[group.key] || '📋'}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-stone-300">
                    {getLocalizedLabel(group)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-stone-400">
                    {percentage}%
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[70px] text-right">
                    {formatGNF(group.amount)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: group.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
