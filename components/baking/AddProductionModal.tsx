'use client'

import { useState, useEffect } from 'react'
import { Calendar, X, ChefHat } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProductionLogger } from './ProductionLogger'
import { BottomSheet } from '@/components/ui/BottomSheet'

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
  const { t } = useLocale()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isMobile, setIsMobile] = useState(false)

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

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

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
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-lg
                  border border-gray-300 dark:border-stone-600
                  bg-white dark:bg-stone-700
                  text-gray-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                  font-medium
                "
              />
            </div>
          </div>

          <ProductionLogger
            date={date}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </BottomSheet>
    )
  }

  // Desktop modal
  if (!isOpen) return null

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
                      {formatDateDisplay(date)}
                    </p>
                  </div>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="
                    px-4 py-2.5 rounded-lg
                    border border-gray-300 dark:border-stone-600
                    bg-white dark:bg-stone-700
                    text-gray-900 dark:text-stone-100
                    focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                    font-medium text-sm
                    cursor-pointer hover:border-gray-400 dark:hover:border-stone-500
                    transition-colors
                  "
                />
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
