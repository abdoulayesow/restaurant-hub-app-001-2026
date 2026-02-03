'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, DollarSign, Calendar, FileText, Receipt, Hash, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { PAYMENT_METHODS, PaymentMethodValue } from '@/lib/constants/payment-methods'
import { getTodayDateString } from '@/lib/date-utils'

interface Debt {
  id: string
  customerId: string
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  principalAmount: number
  paidAmount: number
  remainingAmount: number
  status: string
  createdAt: string
  dueDate?: string | null
}

interface RecordPaymentModalProps {
  debt: Debt | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Payment method icons mapping
const paymentMethodIcons: Record<string, typeof Banknote> = {
  Cash: Banknote,
  Card: CreditCard,
  OrangeMoney: Smartphone,
}

export default function RecordPaymentModal({
  debt,
  isOpen,
  onClose,
  onSuccess
}: RecordPaymentModalProps) {
  const { t, locale } = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'Cash' as PaymentMethodValue,
    paymentDate: getTodayDateString(),
    receiptNumber: '',
    transactionId: '',
    notes: ''
  })

  // Check if transaction ID should be shown (Card or Orange Money)
  const showTransactionId = formData.paymentMethod === 'Card' || formData.paymentMethod === 'OrangeMoney'

  // Calculate payment progress
  const paymentProgress = useMemo(() => {
    if (!debt) return { current: 0, withPayment: 0 }
    const currentPercent = (debt.paidAmount / debt.principalAmount) * 100
    const paymentAmount = parseFloat(formData.amount) || 0
    const withPaymentPercent = ((debt.paidAmount + paymentAmount) / debt.principalAmount) * 100
    return {
      current: Math.min(currentPercent, 100),
      withPayment: Math.min(withPaymentPercent, 100)
    }
  }, [debt, formData.amount])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  useEffect(() => {
    if (isOpen && debt) {
      setFormData({
        amount: debt.remainingAmount.toString(),
        paymentMethod: 'Cash',
        paymentDate: getTodayDateString(),
        receiptNumber: '',
        transactionId: '',
        notes: ''
      })
      setError('')
    }
  }, [isOpen, debt])

  if (!isOpen || !debt) return null

  const handleQuickAmount = (percentage: number) => {
    const amount = Math.round(debt.remainingAmount * percentage)
    setFormData({ ...formData, amount: amount.toString() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const amount = parseFloat(formData.amount)

      if (isNaN(amount) || amount <= 0) {
        setError(t('debts.invalidAmount') || 'Payment amount must be greater than 0')
        setIsSubmitting(false)
        return
      }

      if (amount > debt.remainingAmount) {
        setError(`${t('debts.paymentAmount') || 'Payment amount'} > ${formatCurrency(debt.remainingAmount)} GNF`)
        setIsSubmitting(false)
        return
      }

      // Validate transaction ID for card/Orange Money
      if (showTransactionId && !formData.transactionId.trim()) {
        setError(t('debts.transactionIdHint') || 'Transaction ID is required for this payment method')
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`/api/debts/${debt.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          receiptNumber: formData.receiptNumber || null,
          transactionId: showTransactionId ? formData.transactionId : null,
          notes: formData.notes || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record payment')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-stone-700"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-gray-100 dark:border-stone-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 p-2 hover:bg-white/60 dark:hover:bg-stone-700/60 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-stone-400" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/25">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-stone-100">
                  {t('debts.recordPayment') || 'Record Payment'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-stone-300">
                  {t('debts.paymentFor') || 'Payment for'} <span className="font-semibold">{debt.customer.name}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {t('debts.debtDate') || 'Debt date'}: {new Date(debt.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {debt.dueDate && (
                    <span className="text-amber-600 dark:text-amber-400">
                      • {t('debts.dueDate') || 'Due'}: {new Date(debt.dueDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-stone-900/50 border-b border-gray-100 dark:border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('debts.paymentProgress') || 'Payment Progress'}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-stone-100">
                {formatCurrency(debt.paidAmount + (parseFloat(formData.amount) || 0))} / {formatCurrency(debt.principalAmount)} GNF
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-200 dark:bg-stone-700 rounded-full overflow-hidden">
              {/* Already paid portion */}
              <div
                className="h-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-500 relative"
                style={{ width: `${paymentProgress.withPayment}%` }}
              >
                {/* Current paid portion (darker) */}
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-600 dark:bg-emerald-600"
                  style={{ width: `${(paymentProgress.current / paymentProgress.withPayment) * 100}%` }}
                />
              </div>
            </div>

            {/* Amount summary */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-stone-400">{t('debts.principalAmount') || 'Principal'}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-stone-100">{formatCurrency(debt.principalAmount)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('debts.paidAmount') || 'Paid'}</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(debt.paidAmount)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-amber-600 dark:text-amber-400">{t('debts.remainingAmount') || 'Remaining'}</p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(debt.remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Payment Amount with Quick Amounts */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-stone-200 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                {t('debts.paymentAmount') || 'Payment Amount'} <span className="text-red-500">*</span>
              </label>

              {/* Quick Amount Buttons */}
              <p className="text-xs text-gray-500 dark:text-stone-400 mb-1.5">{t('debts.quickAmounts') || 'Quick Amounts'}</p>
              <div className="flex gap-2 mb-2">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickAmount(pct)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      parseFloat(formData.amount) === Math.round(debt.remainingAmount * pct)
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-200 dark:border-stone-600 text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {pct === 1 ? (t('debts.payFull') || '100%') : `${pct * 100}%`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-4 pr-16 py-3 text-lg font-semibold border border-gray-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400"
                  placeholder="0"
                  disabled={isSubmitting}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-stone-500">
                  GNF
                </span>
              </div>
            </div>

            {/* Payment Method - Visual Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-stone-200 mb-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                {t('debts.paymentMethod') || 'Payment Method'} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(method => {
                  const Icon = paymentMethodIcons[method.value] || Banknote
                  const isSelected = formData.paymentMethod === method.value
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method.value, transactionId: '' })}
                      disabled={isSubmitting}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-stone-600 hover:border-gray-300 dark:hover:border-stone-500 hover:bg-gray-50 dark:hover:bg-stone-700/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-stone-500'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-stone-400'}`}>
                        {method.displayName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Transaction ID - Conditional */}
            {showTransactionId && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-stone-200 mb-2">
                  <Hash className="w-4 h-4 text-orange-500" />
                  {t('debts.transactionId') || 'Transaction ID'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
                  placeholder={t('debts.transactionIdPlaceholder') || 'Enter transaction reference'}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 dark:text-stone-400 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-orange-400 rounded-full" />
                  {t('debts.transactionIdHint') || 'Required for Card and Orange Money payments'}
                </p>
              </div>
            )}

            {/* Payment Date & Receipt - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-stone-200 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {t('debts.paymentDate') || 'Date'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-stone-200 mb-2">
                  <Receipt className="w-4 h-4 text-purple-500" />
                  {t('debts.receiptNumber') || 'Receipt #'}
                </label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400"
                  placeholder={t('common.optional') || 'Optional'}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-stone-200 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                {t('debts.notes') || 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 resize-none"
                placeholder={t('debts.notesPlaceholder') || 'Optional payment notes...'}
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-stone-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-stone-600 text-gray-700 dark:text-stone-300 font-medium hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    {t('debts.recordPayment') || 'Record Payment'}
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
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
        .slide-in-from-top-2 {
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
