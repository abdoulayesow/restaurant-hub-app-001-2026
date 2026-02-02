'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Trash2, X, Loader2, AlertOctagon, ShieldAlert } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export type DeleteSeverity = 'normal' | 'warning' | 'critical'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  /** Title displayed in the modal header */
  title?: string
  /** Description of what's being deleted */
  description?: string
  /** Name/identifier of the item being deleted (shown prominently) */
  itemName?: string
  /** Type of record being deleted (e.g., "sale", "expense", "debt") */
  itemType?: string
  /** Additional details to show (e.g., date, amount) */
  itemDetails?: Array<{ label: string; value: string }>
  /** Warning message shown in the alert box */
  warningMessage?: string
  /** Severity level affects colors and may require type-to-confirm */
  severity?: DeleteSeverity
  /** If true, user must type the item name to confirm (for critical operations) */
  requireTypeConfirm?: boolean
  /** External loading state */
  isLoading?: boolean
}

const severityConfig = {
  normal: {
    icon: Trash2,
    headerBg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    iconBg: 'bg-red-500',
    iconShadow: 'shadow-red-500/30',
    borderColor: 'border-red-100 dark:border-red-900/30',
    textColor: 'text-red-900 dark:text-red-100',
    subtextColor: 'text-red-600 dark:text-red-300',
    closeHover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
    closeText: 'text-red-500 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    headerBg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    iconBg: 'bg-amber-500',
    iconShadow: 'shadow-amber-500/30',
    borderColor: 'border-amber-100 dark:border-amber-900/30',
    textColor: 'text-amber-900 dark:text-amber-100',
    subtextColor: 'text-amber-600 dark:text-amber-300',
    closeHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
    closeText: 'text-amber-500 dark:text-amber-400',
  },
  critical: {
    icon: ShieldAlert,
    headerBg: 'from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/30',
    iconBg: 'bg-rose-600',
    iconShadow: 'shadow-rose-600/40',
    borderColor: 'border-rose-200 dark:border-rose-800/50',
    textColor: 'text-rose-900 dark:text-rose-100',
    subtextColor: 'text-rose-700 dark:text-rose-300',
    closeHover: 'hover:bg-rose-100 dark:hover:bg-rose-900/40',
    closeText: 'text-rose-600 dark:text-rose-400',
  },
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  itemDetails,
  warningMessage,
  severity = 'normal',
  requireTypeConfirm = false,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const { t } = useLocale()
  const [confirmText, setConfirmText] = useState('')
  const [internalLoading, setInternalLoading] = useState(false)
  const [shakeError, setShakeError] = useState(false)

  const loading = isLoading || internalLoading
  const config = severityConfig[severity]
  const IconComponent = config.icon

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('')
      setShakeError(false)
    }
  }, [isOpen])

  // Check if user can delete
  const canDelete = requireTypeConfirm
    ? confirmText.toLowerCase() === (itemName || '').toLowerCase()
    : true

  const handleClose = useCallback(() => {
    if (loading) return
    setConfirmText('')
    onClose()
  }, [loading, onClose])

  const handleConfirm = async () => {
    if (!canDelete) {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
      return
    }

    setInternalLoading(true)
    try {
      await onConfirm()
      setConfirmText('')
    } finally {
      setInternalLoading(false)
    }
  }

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape' && !loading) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, handleClose])

  if (!isOpen) return null

  // Default translations
  const modalTitle = title || t('common.confirmDelete') || 'Confirm Delete'
  const modalDescription = description || t('common.actionIrreversible') || 'This action cannot be undone'
  const defaultWarning = t('common.deleteWarning') || 'This record will be permanently deleted and cannot be recovered.'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />

        {/* Modal */}
        <div
          className={`
            relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl
            w-full max-w-md border border-stone-200 dark:border-stone-700
            ${shakeError ? 'animate-shake' : ''}
          `}
          style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header with gradient background */}
          <div className={`
            relative px-6 py-5 border-b ${config.borderColor}
            bg-gradient-to-br ${config.headerBg} rounded-t-2xl
          `}>
            <button
              onClick={handleClose}
              disabled={loading}
              className={`
                absolute top-4 right-4 p-2 rounded-xl transition-all
                ${config.closeHover} ${config.closeText}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 pr-10">
              {/* Icon with shadow glow */}
              <div className={`
                p-3 rounded-xl ${config.iconBg} shadow-lg ${config.iconShadow}
                transform transition-transform hover:scale-105
              `}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${config.textColor}`}>
                  {modalTitle}
                </h2>
                <p className={`text-sm ${config.subtextColor}`}>
                  {modalDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Item info card */}
            {(itemName || itemType || itemDetails) && (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600">
                {itemType && (
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                    {itemType}
                  </p>
                )}
                {itemName && (
                  <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {itemName}
                  </p>
                )}
                {itemDetails && itemDetails.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-600 space-y-1.5">
                    {itemDetails.map((detail, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-stone-500 dark:text-stone-400">
                          {detail.label}
                        </span>
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warning message */}
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <div className="flex gap-3">
                <AlertOctagon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  {warningMessage || defaultWarning}
                </p>
              </div>
            </div>

            {/* Type-to-confirm input (for critical operations) */}
            {requireTypeConfirm && itemName && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                  {t('common.typeToConfirm') || `Type "${itemName}" to confirm`}
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={loading}
                  className={`
                    w-full px-4 py-3 rounded-xl transition-all
                    border-2 ${confirmText && !canDelete
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                      : 'border-stone-200 dark:border-stone-600 focus:ring-red-500'
                    }
                    bg-white dark:bg-stone-700
                    text-stone-900 dark:text-stone-100
                    focus:ring-2 focus:border-transparent
                    placeholder:text-stone-400 dark:placeholder:text-stone-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  placeholder={itemName}
                  autoComplete="off"
                  spellCheck="false"
                />
                {confirmText && !canDelete && (
                  <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t('common.textDoesNotMatch') || 'Text does not match'}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="
                  flex-1 px-4 py-3 rounded-xl font-medium transition-all
                  border border-stone-200 dark:border-stone-600
                  text-stone-700 dark:text-stone-300
                  hover:bg-stone-50 dark:hover:bg-stone-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-[0.98]
                "
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canDelete || loading}
                className={`
                  flex-1 px-4 py-3 rounded-xl font-medium transition-all
                  bg-red-600 text-white
                  hover:bg-red-700 active:bg-red-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-[0.98]
                  flex items-center justify-center gap-2
                  shadow-lg shadow-red-600/25
                  ${!canDelete && requireTypeConfirm ? 'cursor-not-allowed' : ''}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('common.deleting') || 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>{t('common.delete') || 'Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default DeleteConfirmationModal
