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
          {/* Date Selector - Enhanced */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-500 dark:text-terracotta-400 mb-2">
              <Calendar className="w-4 h-4" />
              {t('production.date') || 'Production Date'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  border-2 border-terracotta-200 dark:border-dark-600
                  bg-cream-50 dark:bg-dark-800
                  text-terracotta-900 dark:text-cream-100
                  focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
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
      {/* Backdrop - Enhanced with gradient */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/50 via-black/40 to-terracotta-900/30 backdrop-blur-sm z-50"
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
            border border-terracotta-500/10 dark:border-terracotta-400/10
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header - Enhanced with gradient and icon */}
          <div className="sticky top-0 bg-gradient-to-b from-cream-100 to-cream-50 dark:from-dark-800 dark:to-dark-900 p-6 border-b border-terracotta-500/15 dark:border-terracotta-400/20 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Decorative icon container */}
                <div className="relative">
                  <div className="absolute inset-0 bg-terracotta-500/20 rounded-xl blur-lg" />
                  <div className="relative p-3 bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-xl shadow-lg shadow-terracotta-500/25">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2
                    id="modal-title"
                    className="text-xl font-bold text-terracotta-900 dark:text-cream-100"
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  >
                    {t('production.logProduction') || 'Log Production'}
                  </h2>
                  <p className="text-sm text-terracotta-500 dark:text-cream-400 mt-0.5">
                    {t('production.logProductionDesc') || 'Record your bakery production'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-cream-200 dark:hover:bg-dark-700 transition-all hover:scale-105 active:scale-95"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-5 h-5 text-terracotta-600 dark:text-cream-300" />
              </button>
            </div>

            {/* Date Selector - Enhanced card style */}
            <div className="mt-5 p-4 rounded-xl bg-cream-50/80 dark:bg-dark-800/80 border border-terracotta-200/50 dark:border-dark-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-terracotta-100 dark:bg-terracotta-900/30">
                    <Calendar className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-500 dark:text-terracotta-400">
                      {t('production.date') || 'Production Date'}
                    </p>
                    <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100 mt-0.5">
                      {formatDateDisplay(date)}
                    </p>
                  </div>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="
                    px-4 py-2.5 rounded-xl
                    border-2 border-terracotta-200 dark:border-dark-600
                    bg-white dark:bg-dark-700
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                    font-medium text-sm
                    cursor-pointer hover:border-terracotta-300 dark:hover:border-dark-500
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
