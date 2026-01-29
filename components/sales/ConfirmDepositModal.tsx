'use client'

import { useState, useEffect } from 'react'
import { X, Landmark, Loader2, Receipt, Link, Hash, MessageSquare } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Sale {
  id: string
  date: string | Date
  totalGNF: number
  cashGNF: number
  orangeMoneyGNF: number
  cardGNF: number
}

interface ConfirmDepositModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    bankRef: string
    comments?: string
    receiptUrl?: string
  }) => Promise<void>
  sale: Sale | null
  isLoading?: boolean
}

export function ConfirmDepositModal({
  isOpen,
  onClose,
  onSubmit,
  sale,
  isLoading = false,
}: ConfirmDepositModalProps) {
  const { t, locale } = useLocale()

  const [bankRef, setBankRef] = useState('')
  const [comments, setComments] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [showReceiptInput, setShowReceiptInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens or sale changes
  useEffect(() => {
    if (isOpen && sale) {
      setBankRef('')
      setComments('')
      setReceiptUrl('')
      setShowReceiptInput(false)
      setError(null)
    }
  }, [isOpen, sale])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' GNF'
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate bank reference is required
    if (!bankRef.trim()) {
      setError(t('sales.deposit.bankRefRequired') || 'Bank reference is required')
      return
    }

    try {
      await onSubmit({
        bankRef: bankRef.trim(),
        comments: comments.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen || !sale) return null

  // Calculate payment breakdown percentages
  const cashPercent = sale.totalGNF > 0 ? Math.round((sale.cashGNF / sale.totalGNF) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />

        {/* Modal */}
        <div
          className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-stone-700"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* Header - Cyan/Teal bank theme */}
          <div className="relative px-6 py-5 border-b border-gray-100 dark:border-stone-700 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-t-2xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 hover:bg-white/60 dark:hover:bg-stone-700/60 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-stone-400" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="p-2.5 bg-cyan-500 rounded-xl shadow-lg shadow-cyan-500/25">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-stone-100">
                  {t('sales.deposit.confirmDeposit') || 'Confirm Cash Deposit'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-stone-400">
                  {t('sales.deposit.forSale') || 'For sale'}: {formatDate(sale.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Sale Summary */}
            <div className="p-4 bg-gray-50 dark:bg-stone-700/50 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-stone-400">
                  {t('sales.totalSales') || 'Total Sales'}
                </span>
                <span className="font-semibold text-gray-900 dark:text-stone-100">
                  {formatCurrency(sale.totalGNF)}
                </span>
              </div>

              {/* Payment Breakdown */}
              <div className="pt-2 border-t border-gray-200 dark:border-stone-600 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-stone-400">
                    {t('sales.cash') || 'Cash'}
                  </span>
                  <span className="text-gray-700 dark:text-stone-300">
                    {formatCurrency(sale.cashGNF)}
                  </span>
                </div>
                {sale.orangeMoneyGNF > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-stone-400">
                      {t('sales.orangeMoney') || 'Orange Money'}
                    </span>
                    <span className="text-gray-700 dark:text-stone-300">
                      {formatCurrency(sale.orangeMoneyGNF)}
                    </span>
                  </div>
                )}
                {sale.cardGNF > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-stone-400">
                      {t('sales.card') || 'Card'}
                    </span>
                    <span className="text-gray-700 dark:text-stone-300">
                      {formatCurrency(sale.cardGNF)}
                    </span>
                  </div>
                )}
              </div>

              {/* Cash to Deposit - Highlighted */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-stone-600">
                <span className="text-sm font-medium text-gray-700 dark:text-stone-300">
                  {t('sales.deposit.cashToDeposit') || 'Cash to Deposit'}
                </span>
                <div className="text-right">
                  <span className="font-bold text-lg text-cyan-600 dark:text-cyan-400">
                    {formatCurrency(sale.cashGNF)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-stone-400">
                    ({cashPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Reference - Required */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                <Hash className="w-4 h-4" />
                {t('sales.deposit.bankRef') || 'Bank Reference'} *
              </label>
              <input
                type="text"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder={t('sales.deposit.bankRefPlaceholder') || 'Enter deposit slip number'}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                {t('sales.deposit.bankRefHint') || 'Bank transaction or deposit slip reference number'}
              </p>
            </div>

            {/* Comments */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                <MessageSquare className="w-4 h-4" />
                {t('sales.deposit.comments') || 'Comments'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                placeholder={t('sales.deposit.commentsPlaceholder') || 'Optional notes about this deposit...'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Receipt URL */}
            <div>
              {!showReceiptInput ? (
                <button
                  type="button"
                  onClick={() => setShowReceiptInput(true)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  {t('sales.deposit.addReceipt') || 'Add Deposit Slip'}
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-300">
                    <span className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      {t('sales.deposit.receiptUrl') || 'Deposit Slip URL'}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder={t('sales.deposit.receiptUrlPlaceholder') || 'https://drive.google.com/...'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-stone-400">
                    {t('sales.deposit.receiptUrlHint') || 'Paste a link to your deposit slip photo'}
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-stone-700 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-stone-600 text-gray-700 dark:text-stone-300 rounded-xl hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors font-medium disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Landmark className="w-4 h-4" />
                    {t('sales.deposit.confirm') || 'Confirm Deposit'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
