'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, CreditCard, FileText, Receipt } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

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
}

interface RecordPaymentModalProps {
  debt: Debt | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RecordPaymentModal({
  debt,
  isOpen,
  onClose,
  onSuccess
}: RecordPaymentModalProps) {
  const { t } = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen && debt) {
      // Reset form when modal opens
      setFormData({
        amount: debt.remainingAmount.toString(),
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        receiptNumber: '',
        notes: ''
      })
      setError('')
    }
  }, [isOpen, debt])

  if (!isOpen || !debt) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const amount = parseFloat(formData.amount)

      // Validation
      if (isNaN(amount) || amount <= 0) {
        setError('Payment amount must be greater than 0')
        setIsSubmitting(false)
        return
      }

      if (amount > debt.remainingAmount) {
        setError(`Payment amount cannot exceed remaining debt (${debt.remainingAmount.toLocaleString()} GNF)`)
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

  const paymentMethods = ['Cash', 'Orange Money', 'Card']

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="animate-modal-entrance w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-lg">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-stone-800 px-6 py-5 border-b border-gray-200 dark:border-stone-700 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                  {t('debts.recordPayment') || 'Record Payment'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-stone-300 mt-1">
                  {debt.customer.name}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Debt Summary */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-stone-700/50 border-b border-gray-200 dark:border-stone-700">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-stone-300 mb-1">
                  {t('debts.principalAmount') || 'Principal'}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-stone-100">
                  {debt.principalAmount.toLocaleString()} GNF
                </p>
              </div>
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                  {t('debts.paidAmount') || 'Paid'}
                </p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {debt.paidAmount.toLocaleString()} GNF
                </p>
              </div>
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">
                  {t('debts.remainingAmount') || 'Remaining'}
                </p>
                <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                  {debt.remainingAmount.toLocaleString()} GNF
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <DollarSign className="w-4 h-4" />
                {t('debts.paymentAmount') || 'Payment Amount'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 text-lg border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
                placeholder="0.00"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
                Max: {debt.remainingAmount.toLocaleString()} GNF
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <CreditCard className="w-4 h-4" />
                {t('debts.paymentMethod') || 'Payment Method'} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100"
                disabled={isSubmitting}
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('debts.paymentDate') || 'Payment Date'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100"
                disabled={isSubmitting}
              />
            </div>

            {/* Receipt Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <Receipt className="w-4 h-4" />
                {t('debts.receiptNumber') || 'Receipt Number'}
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
                placeholder="Optional"
                disabled={isSubmitting}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('debts.notes') || 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 resize-none"
                placeholder="Optional payment notes..."
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-stone-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (t('common.saving') || 'Saving...') : (t('debts.recordPayment') || 'Record Payment')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
