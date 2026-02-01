'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { getTodayDateString, formatDateForInput } from '@/lib/date-utils'

export type PeriodOption = '7' | '30' | 'custom'

interface PeriodSelectorProps {
  period: PeriodOption
  onPeriodChange: (period: PeriodOption) => void
  customStartDate?: string
  customEndDate?: string
  onCustomDatesChange?: (startDate: string, endDate: string) => void
}

export function PeriodSelector({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDatesChange,
}: PeriodSelectorProps) {
  const { t, locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(customStartDate || '')
  const [tempEndDate, setTempEndDate] = useState(customEndDate || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [
    { value: '7' as const, label: t('dashboard.period7Days') },
    { value: '30' as const, label: t('dashboard.period30Days') },
    { value: 'custom' as const, label: t('dashboard.periodCustom') },
  ]

  const getDisplayLabel = () => {
    if (period === 'custom' && customStartDate && customEndDate) {
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
      }
      return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
    }
    return options.find(o => o.value === period)?.label || t('dashboard.period30Days')
  }

  const handleOptionClick = (value: PeriodOption) => {
    if (value === 'custom') {
      setShowDatePicker(true)
      // Initialize with last 30 days if no dates set
      if (!tempStartDate || !tempEndDate) {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 30)
        setTempStartDate(formatDateForInput(start))
        setTempEndDate(formatDateForInput(end))
      }
    } else {
      onPeriodChange(value)
      setIsOpen(false)
      setShowDatePicker(false)
    }
  }

  const handleApplyCustomDates = () => {
    if (tempStartDate && tempEndDate && onCustomDatesChange) {
      onCustomDatesChange(tempStartDate, tempEndDate)
      onPeriodChange('custom')
      setIsOpen(false)
      setShowDatePicker(false)
    }
  }

  const handleClearCustom = () => {
    setTempStartDate('')
    setTempEndDate('')
    setShowDatePicker(false)
    onPeriodChange('30')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500 dark:text-stone-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-stone-300">
          {getDisplayLabel()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-gray-200 dark:border-stone-700 z-50">
          {!showDatePicker ? (
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors ${
                    period === option.value
                      ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-stone-700/50'
                      : 'text-gray-700 dark:text-stone-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('dashboard.selectDateRange')}
                </h4>
                <button
                  onClick={handleClearCustom}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-stone-400 mb-1">
                    {t('common.from')}
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    max={tempEndDate || undefined}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-stone-400 mb-1">
                    {t('common.to')}
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    min={tempStartDate || undefined}
                    max={getTodayDateString()}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleApplyCustomDates}
                  disabled={!tempStartDate || !tempEndDate}
                  className="w-full py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
