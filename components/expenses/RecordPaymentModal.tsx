'use client'

import { useState, useEffect } from 'react'
import { X, Banknote, Smartphone, CreditCard, Loader2, Receipt, Link, DollarSign, Hash } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

type PaymentMethod = 'Cash' | 'OrangeMoney' | 'Card'

interface Expense {
  id: string
  categoryName: string
  amountGNF: number
  totalPaidAmount?: number
  paymentStatus?: 'Unpaid' | 'PartiallyPaid' | 'Paid'
  description?: string | null
}

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    amount: number
    paymentMethod: PaymentMethod
    notes?: string
    receiptUrl?: string
    transactionId?: string
  }) => Promise<void>
  expense: Expense | null
  isLoading?: boolean
}

const METHOD_OPTIONS: { value: PaymentMethod; icon: React.ElementType; color: string }[] = [
  { value: 'Cash', icon: Banknote, color: 'emerald' },
  { value: 'OrangeMoney', icon: Smartphone, color: 'orange' },
  { value: 'Card', icon: CreditCard, color: 'blue' },
]

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  isLoading = false,
}: RecordPaymentModalProps) {
  const { t, locale } = useLocale()

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [notes, setNotes] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [showReceiptInput, setShowReceiptInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate remaining amount
  const remainingAmount = expense ? expense.amountGNF - (expense.totalPaidAmount || 0) : 0

  // Show transaction ID for Card and OrangeMoney
  const showTransactionId = paymentMethod === 'Card' || paymentMethod === 'OrangeMoney'

  // Quick amount percentages
  const quickAmounts = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: t('expenses.payment.payFull') || '100%', value: 1 },
  ]

  // Reset form when modal opens or expense changes
  useEffect(() => {
    if (isOpen && expense) {
      setAmount(remainingAmount.toString())
      setPaymentMethod('Cash')
      setNotes('')
      setReceiptUrl('')
      setTransactionId('')
      setShowReceiptInput(false)
      setError(null)
    }
  }, [isOpen, expense, remainingAmount])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' GNF'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseFloat(amount)

    if (!amountNum || amountNum <= 0) {
      setError(t('expenses.payment.amountRequired') || 'Amount must be greater than 0')
      return
    }

    if (amountNum > remainingAmount) {
      setError(t('expenses.payment.amountExceedsRemaining') || 'Amount exceeds remaining balance')
      return
    }

    // Require transaction ID for Card and OrangeMoney
    if (showTransactionId && !transactionId.trim()) {
      setError(t('expenses.payment.transactionIdRequired') || 'Transaction ID is required for Card and Orange Money payments')
      return
    }

    try {
      await onSubmit({
        amount: amountNum,
        paymentMethod,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen || !expense) return null

  const paidPercentage = expense.amountGNF > 0
    ? Math.round(((expense.totalPaidAmount || 0) / expense.amountGNF) * 100)
    : 0

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
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-gray-100 dark:border-stone-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-t-2xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 hover:bg-white/60 dark:hover:bg-stone-700/60 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-stone-400" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/25">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-stone-100">
                  {t('expenses.payment.recordPayment') || 'Record Payment'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-stone-400">
                  {t('expenses.payment.for') || 'For'}: {expense?.categoryName}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Expense Summary */}
            <div className="p-4 bg-gray-50 dark:bg-stone-700/50 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-stone-400">
                  {t('expenses.category') || 'Category'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">
                  {expense.categoryName}
                </span>
              </div>

              {expense.description && (
                <p className="text-sm text-gray-500 dark:text-stone-400 truncate">
                  {expense.description}
                </p>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-stone-400">
                  {t('expenses.totalAmount') || 'Total Amount'}
                </span>
                <span className="font-semibold text-gray-900 dark:text-stone-100">
                  {formatCurrency(expense.amountGNF)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-stone-400">
                    {t('expenses.payment.paid') || 'Paid'}: {formatCurrency(expense.totalPaidAmount || 0)}
                  </span>
                  <span className="text-gray-600 dark:text-stone-400">
                    {paidPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-stone-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-stone-600">
                <span className="text-sm font-medium text-gray-700 dark:text-stone-300">
                  {t('expenses.payment.remaining') || 'Remaining'}
                </span>
                <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                {t('expenses.payment.amount') || 'Payment Amount'} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  max={remainingAmount}
                  step="1"
                  required
                  className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-stone-400 font-medium">
                  GNF
                </span>
              </div>

              {/* Quick Amount Buttons */}
              <p className="text-xs text-gray-500 dark:text-stone-400 mt-2 mb-1.5">
                {t('expenses.payment.quickAmounts') || 'Quick Amounts'}
              </p>
              <div className="flex gap-2">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => setAmount(Math.floor(remainingAmount * qa.value).toString())}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-stone-600 text-gray-600 dark:text-stone-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                {t('expenses.payment.method') || 'Payment Method'} *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {METHOD_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isSelected = paymentMethod === option.value
                  const label = option.value === 'OrangeMoney'
                    ? (t('expenses.orangeMoney') || 'Orange Money')
                    : (t(`expenses.${option.value.toLowerCase()}`) || option.value)

                  // Explicit color classes
                  const selectedStyles = {
                    emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
                    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                  }

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? selectedStyles[option.color as keyof typeof selectedStyles]
                          : 'border-gray-200 dark:border-stone-600 hover:border-gray-300 dark:hover:border-stone-500 text-gray-600 dark:text-stone-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Transaction ID - Required for Card and OrangeMoney */}
            {showTransactionId && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  <Hash className="w-4 h-4" />
                  {t('expenses.payment.transactionId') || 'Transaction ID'} *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={t('expenses.payment.transactionIdPlaceholder') || 'Enter transaction reference'}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  {t('expenses.payment.transactionIdHint') || 'Required for Card and Orange Money payments'}
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                {t('expenses.payment.notes') || 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('expenses.payment.notesPlaceholder') || 'Optional notes about this payment...'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              {!showReceiptInput ? (
                <button
                  type="button"
                  onClick={() => setShowReceiptInput(true)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  {t('expenses.payment.addReceipt') || 'Add Receipt'}
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-300">
                    <span className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      {t('expenses.payment.receiptUrl') || 'Receipt URL'}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder={t('expenses.payment.receiptUrlPlaceholder') || 'https://drive.google.com/...'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-stone-400">
                    {t('expenses.payment.receiptUrlHint') || 'Paste a link to your receipt image (Google Drive, Dropbox, etc.)'}
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
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  t('expenses.payment.recordPayment') || 'Record Payment'
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
