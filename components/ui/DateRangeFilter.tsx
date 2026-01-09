'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

export type DateRangeValue = '7days' | '30days' | '90days' | 'all'

interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { t } = useLocale()

  const options: { value: DateRangeValue; label: string }[] = [
    { value: '7days', label: t('sales.last7Days') || '7 Days' },
    { value: '30days', label: t('sales.last30Days') || '30 Days' },
    { value: '90days', label: t('sales.last90Days') || '90 Days' },
    { value: 'all', label: t('sales.allTime') || 'All' },
  ]

  return (
    <div className="flex bg-cream-200 dark:bg-dark-700 rounded-xl p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            value === option.value
              ? 'bg-terracotta-500 text-white'
              : 'text-terracotta-700 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-dark-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Helper function to get date range from filter value
export function getDateRangeFromFilter(filterValue: DateRangeValue): { startDate: Date | null; endDate: Date } {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  let startDate: Date | null = null

  switch (filterValue) {
    case '7days':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      break
    case '30days':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      break
    case '90days':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'all':
      startDate = null
      break
  }

  return { startDate, endDate }
}
