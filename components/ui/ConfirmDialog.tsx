'use client'

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

type DialogVariant = 'info' | 'warning' | 'danger' | 'success'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
  loading?: boolean
}

const VARIANT_STYLES: Record<DialogVariant, { icon: React.ElementType; iconBg: string; iconColor: string; buttonBg: string }> = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600',
  },
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600',
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useLocale()

  if (!isOpen) return null

  const styles = VARIANT_STYLES[variant]
  const Icon = styles.icon

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="animate-fade-in-up w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 pb-0">
            <div className={`p-3 rounded-full ${styles.iconBg}`}>
              <Icon className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-900 dark:text-stone-100"
              >
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-stone-400">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              aria-label={t('common.close') || 'Close'}
            >
              <X className="w-5 h-5 text-gray-500 dark:text-stone-400" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 font-medium hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {cancelText || t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors disabled:opacity-50 ${styles.buttonBg}`}
            >
              {loading ? (t('common.processing') || 'Processing...') : (confirmText || t('common.confirm') || 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
