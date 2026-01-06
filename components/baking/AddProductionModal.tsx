'use client'

import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
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

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  // Use BottomSheet for mobile, modal for desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

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
            <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
              <Calendar className="w-4 h-4" />
              {t('production.date') || 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-terracotta-200 dark:border-dark-600
                bg-cream-50 dark:bg-dark-800
                text-terracotta-900 dark:text-cream-100
                focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
              "
            />
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="
            animate-fade-in-up
            w-full max-w-2xl max-h-[90vh] overflow-y-auto
            bg-cream-50 dark:bg-dark-900
            rounded-2xl warm-shadow-lg grain-overlay
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="sticky top-0 bg-cream-50 dark:bg-dark-900 p-6 border-b border-terracotta-500/15 dark:border-terracotta-400/20 z-10">
            <div className="flex items-center justify-between">
              <h2
                id="modal-title"
                className="text-xl font-bold text-terracotta-900 dark:text-cream-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {t('production.logProduction') || 'Log Production'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-cream-200 dark:hover:bg-dark-700 transition-colors"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-5 h-5 text-terracotta-600 dark:text-cream-300" />
              </button>
            </div>

            {/* Date Selector in header for desktop */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('production.date') || 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="
                  w-48 px-4 py-2 rounded-xl
                  border border-terracotta-200 dark:border-dark-600
                  bg-cream-100 dark:bg-dark-800
                  text-terracotta-900 dark:text-cream-100
                  focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                "
              />
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
