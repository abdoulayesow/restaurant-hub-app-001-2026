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
  const { t, locale } = useLocale()
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

  const paymentMethods = ['Cash', 'Bank Transfer', 'Mobile Money', 'Check', 'Card']

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-terracotta-50 to-terracotta-100 dark:from-gray-900 dark:to-gray-800 px-6 py-5 border-b border-terracotta-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-terracotta-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('debts.recordPayment') || 'Record Payment'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {debt.customer.name}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-terracotta-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Debt Summary */}
        <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {t('debts.principalAmount') || 'Principal'}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {debt.principalAmount.toLocaleString()} GNF
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {t('debts.paidAmount') || 'Paid'}
              </p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {debt.paidAmount.toLocaleString()} GNF
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {t('debts.remainingAmount') || 'Remaining'}
              </p>
              <p className="text-lg font-semibold text-terracotta-600 dark:text-terracotta-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {debt.remainingAmount.toLocaleString()} GNF
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              {t('debts.paymentAmount') || 'Payment Amount'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white text-lg"
              style={{ fontFamily: 'Poppins, sans-serif' }}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Max: {debt.remainingAmount.toLocaleString()} GNF
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              {t('debts.paymentMethod') || 'Payment Method'} <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t('debts.paymentDate') || 'Payment Date'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Receipt className="w-4 h-4 inline mr-1" />
              {t('debts.receiptNumber') || 'Receipt Number'}
            </label>
            <input
              type="text"
              value={formData.receiptNumber}
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white"
              placeholder="Optional"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              {t('debts.notes') || 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Optional payment notes..."
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? (t('common.saving') || 'Saving...') : (t('debts.recordPayment') || 'Record Payment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
