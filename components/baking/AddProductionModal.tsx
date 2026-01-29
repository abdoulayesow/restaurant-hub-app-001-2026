'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, X, ChefHat } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProductionLogger } from './ProductionLogger'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { formatDateForDisplay, getTodayDateString, parseDateInput } from '@/lib/date-utils'

// Format date as DD/MM/YYYY for French or MM/DD/YYYY for English
function formatDateShort(dateString: string, locale: string): string {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return locale === 'fr' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`
}

interface AddProductionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddProductionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddProductionModalProps) {
  const { t, locale } = useLocale()
  // Initialize with empty string to avoid server/client timezone mismatch
  const [date, setDate] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Set initial date on client side only to ensure correct timezone
  useEffect(() => {
    if (!date) {
      setDate(getTodayDateString())
    }
  }, [date])

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  // Get the max date (today) to prevent future date selection
  const maxDate = getTodayDateString()

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={t('production.logProduction') || 'Log Production'}
        maxHeight="90vh"
      >
        <div className="p-4 pb-safe">
          {/* Date Selector */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
              <Calendar className="w-4 h-4" />
              {t('production.date') || 'Production Date'}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker()}
                className="
                  w-full px-4 py-3 rounded-lg
                  border border-gray-300 dark:border-stone-600
                  bg-white dark:bg-stone-700
                  text-gray-900 dark:text-stone-100
                  font-medium text-left
                  flex items-center justify-between
                "
              >
                {formatDateShort(date, locale)}
                <Calendar className="w-4 h-4 text-gray-400" />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0"
                tabIndex={-1}
              />
            </div>
          </div>

          {date && (
            <ProductionLogger
              date={date}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          )}
        </div>
      </BottomSheet>
    )
  }

  // Desktop modal
  if (!isOpen || !date) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="
            animate-fade-in-up
            w-full max-w-2xl max-h-[90vh] overflow-y-auto
            bg-white dark:bg-stone-900
            rounded-xl shadow-xl
            border border-gray-200 dark:border-stone-700
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 dark:bg-stone-800 p-6 border-b border-gray-200 dark:border-stone-700 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Icon container */}
                <div className="p-3 bg-gray-900 dark:bg-white rounded-lg">
                  <ChefHat className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h2
                    id="modal-title"
                    className="text-xl font-bold text-gray-900 dark:text-stone-100"
                  >
                    {t('production.logProduction') || 'Log Production'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                    {t('production.logProductionDesc') || 'Record your bakery production'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-stone-700 transition-all"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>

            {/* Date Selector */}
            <div className="mt-5 p-4 rounded-lg bg-white dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-stone-600">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-stone-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-stone-400">
                      {t('production.date') || 'Production Date'}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-stone-100 mt-0.5">
                      {formatDateForDisplay(parseDateInput(date), locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="
                      px-4 py-2.5 rounded-lg
                      border border-gray-300 dark:border-stone-600
                      bg-white dark:bg-stone-700
                      text-gray-900 dark:text-stone-100
                      hover:border-gray-400 dark:hover:border-stone-500
                      font-medium text-sm
                      cursor-pointer
                      transition-colors
                      flex items-center gap-2
                    "
                  >
                    {formatDateShort(date, locale)}
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    max={maxDate}
                    onChange={(e) => setDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <ProductionLogger
              date={date}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default AddProductionModal
