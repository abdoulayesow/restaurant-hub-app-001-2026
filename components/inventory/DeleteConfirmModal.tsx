'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  itemName: string
  loading?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  const { t } = useLocale()
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen) return null

  const canDelete = confirmText.toLowerCase() === itemName.toLowerCase()

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!canDelete) return
    await onConfirm()
    setConfirmText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-cream-50 dark:bg-dark-900 rounded-2xl warm-shadow-lg grain-overlay animate-fade-in-up overflow-hidden">
        {/* Danger Header */}
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3
                className="text-xl font-semibold text-red-900 dark:text-red-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {t('inventory.deleteItem') || 'Delete Item'}
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                {t('common.actionIrreversible') || 'This action cannot be undone'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Item info */}
          <div className="p-4 rounded-xl bg-cream-100 dark:bg-dark-800 border border-terracotta-200/30 dark:border-dark-600">
            <p className="text-sm text-terracotta-600 dark:text-cream-300 mb-1">
              {t('inventory.itemToDelete') || 'Item to delete:'}
            </p>
            <p className="text-lg font-semibold text-terracotta-900 dark:text-cream-100">
              {itemName}
            </p>
          </div>

          {/* Warning message */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('inventory.deleteWarning') ||
                'Deleting this item will remove all associated stock movements and history. This data cannot be recovered.'}
            </p>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
              {t('common.typeToConfirm') || `Type "${itemName}" to confirm`}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-red-200 dark:border-red-900/50
                bg-white dark:bg-dark-800
                text-terracotta-900 dark:text-cream-100
                focus:ring-2 focus:ring-red-500 focus:border-red-500
                placeholder:text-terracotta-400 dark:placeholder:text-cream-500
                transition-all duration-200
              "
              placeholder={itemName}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="
                flex-1 px-4 py-2.5 rounded-xl
                border border-terracotta-200 dark:border-dark-600
                text-terracotta-700 dark:text-cream-300
                hover:bg-cream-100 dark:hover:bg-dark-800
                font-medium transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete || loading}
              className="
                flex-1 px-4 py-2.5 rounded-xl
                bg-red-600 text-white
                hover:bg-red-700
                disabled:opacity-50 disabled:cursor-not-allowed
                font-medium transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.deleting') || 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  {t('common.delete') || 'Delete'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
