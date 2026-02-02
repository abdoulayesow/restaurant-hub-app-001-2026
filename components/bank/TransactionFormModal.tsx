'use client'

import { useState, useEffect } from 'react'
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { PAYMENT_METHODS as PAYMENT_METHODS_CONFIG, PaymentMethodValue } from '@/lib/constants/payment-methods'
import { getTodayDateString } from '@/lib/date-utils'
import {
  TransactionType,
  TransactionReason,
  TransactionStatus,
  DEPOSIT_REASONS as DEPOSIT_REASON_VALUES,
  WITHDRAWAL_REASONS as WITHDRAWAL_REASON_VALUES,
} from '@/lib/types/bank'

interface Sale {
  id: string
  date: string
  totalGNF: number
  cashGNF: number
  bankTransactions?: Array<{
    id: string
    status: TransactionStatus
    method: PaymentMethodValue
  }>
}

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    date: string
    amount: number
    type: TransactionType
    method: PaymentMethodValue
    reason: TransactionReason
    description?: string
    comments?: string
    saleId?: string
  }) => Promise<void>
  isLoading?: boolean
  defaultType?: TransactionType
}

// Reason options with translation keys
const REASON_LABELS: Record<TransactionReason, { labelKey: string; label: string }> = {
  SalesDeposit: { labelKey: 'bank.reasons.salesDeposit', label: 'Sales Deposit' },
  DebtCollection: { labelKey: 'bank.reasons.debtCollection', label: 'Debt Collection' },
  CapitalInjection: { labelKey: 'bank.reasons.capitalInjection', label: 'Capital Injection' },
  ExpensePayment: { labelKey: 'bank.reasons.expensePayment', label: 'Expense Payment' },
  OwnerWithdrawal: { labelKey: 'bank.reasons.ownerWithdrawal', label: 'Owner Withdrawal' },
  Other: { labelKey: 'bank.reasons.other', label: 'Other' },
}

const DEPOSIT_REASONS = DEPOSIT_REASON_VALUES.map(value => ({
  value,
  ...REASON_LABELS[value],
}))

const WITHDRAWAL_REASONS = WITHDRAWAL_REASON_VALUES.map(value => ({
  value,
  ...REASON_LABELS[value],
}))

// Build payment methods config from centralized constants
const PAYMENT_METHODS = PAYMENT_METHODS_CONFIG.map(pm => ({
  value: pm.value,
  labelKey: pm.value === 'OrangeMoney' ? 'bank.methods.OrangeMoney' : `bank.methods.${pm.value}`,
  label: pm.displayName,
  icon: pm.icon,
}))

export function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  defaultType = 'Deposit',
}: TransactionFormModalProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()

  const [formData, setFormData] = useState({
    type: defaultType as TransactionType,
    date: getTodayDateString(),
    amount: '',
    method: 'Cash' as PaymentMethodValue,
    reason: (defaultType === 'Deposit' ? 'SalesDeposit' : 'ExpensePayment') as TransactionReason,
    description: '',
    comments: '',
    saleId: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableSales, setAvailableSales] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  // Fetch available sales for linking (deposits only)
  useEffect(() => {
    const fetchAvailableSales = async () => {
      if (!currentRestaurant || formData.type !== 'Deposit') return

      setLoadingSales(true)
      try {
        const response = await fetch(
          `/api/sales?restaurantId=${currentRestaurant.id}&status=Approved`
        )

        if (response.ok) {
          const data = await response.json()
          // Filter for sales with cash that haven't been deposited yet
          const salesWithoutTransactions = data.sales.filter((sale: Sale) =>
            sale.cashGNF > 0 && !sale.bankTransactions?.some(t => t.method === 'Cash' && t.status === 'Confirmed')
          )
          setAvailableSales(salesWithoutTransactions)
        }
      } catch (error) {
        console.error('Error fetching sales:', error)
      } finally {
        setLoadingSales(false)
      }
    }

    if (isOpen && currentRestaurant && formData.reason === 'SalesDeposit') {
      fetchAvailableSales()
    }
  }, [isOpen, currentRestaurant, formData.type, formData.reason])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: defaultType,
        date: getTodayDateString(),
        amount: '',
        method: 'Cash',
        reason: defaultType === 'Deposit' ? 'SalesDeposit' : 'ExpensePayment',
        description: '',
        comments: '',
        saleId: '',
      })
      setErrors({})
    }
  }, [isOpen, defaultType])

  // Update reason when type changes
  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      reason: type === 'Deposit' ? 'SalesDeposit' : 'ExpensePayment',
      saleId: '', // Clear linked sale when type changes
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = t('errors.required') || 'Required'
    }

    const amount = parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = t('errors.required') || 'Required'
    } else if (amount <= 0) {
      newErrors.amount = t('bank.amountMustBePositive') || 'Amount must be positive'
    }

    if (!formData.reason) {
      newErrors.reason = t('errors.required') || 'Required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate() || !currentRestaurant) return

    await onSubmit({
      date: formData.date,
      amount: parseFloat(formData.amount),
      type: formData.type,
      method: formData.method,
      reason: formData.reason,
      description: formData.description.trim() || undefined,
      comments: formData.comments.trim() || undefined,
      saleId: formData.saleId || undefined,
    })
  }

  const reasons = formData.type === 'Deposit' ? DEPOSIT_REASONS : WITHDRAWAL_REASONS

  if (!isOpen) return null

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
        <div
          className="animate-modal-entrance w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-stone-700">
            <h2
              id="modal-title"
              className="text-xl font-bold text-gray-900 dark:text-stone-100"
            >
              {t('bank.newTransaction') || 'New Transaction'}
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Transaction Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-3">
                {t('bank.transactionType') || 'Transaction Type'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('Deposit')}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    formData.type === 'Deposit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-stone-600 text-gray-600 dark:text-stone-400 hover:border-gray-300 dark:hover:border-stone-500'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="font-medium">{t('bank.deposit') || 'Deposit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Withdrawal')}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    formData.type === 'Withdrawal'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                      : 'border-gray-200 dark:border-stone-600 text-gray-600 dark:text-stone-400 hover:border-gray-300 dark:hover:border-stone-500'
                  }`}
                >
                  <ArrowDownRight className="w-5 h-5" />
                  <span className="font-medium">{t('bank.withdrawal') || 'Withdrawal'}</span>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-3">
                {t('bank.paymentMethod') || 'Payment Method'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(({ value, labelKey, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('method', value)}
                    disabled={isLoading}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.method === value
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-stone-700 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-stone-600 text-gray-600 dark:text-stone-400 hover:border-gray-300 dark:hover:border-stone-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{t(labelKey) || label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                {t('bank.reason') || 'Reason'} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 disabled:opacity-50 ${
                  errors.reason
                    ? 'border-red-500 border'
                    : 'border border-gray-300 dark:border-stone-600'
                }`}
              >
                {reasons.map(({ value, labelKey, label }) => (
                  <option key={value} value={value}>
                    {t(labelKey) || label}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="text-sm text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                {t('common.date') || 'Date'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 ${
                  errors.date
                    ? 'border-red-500 border'
                    : 'border border-gray-300 dark:border-stone-600'
                }`}
              />
              {errors.date && (
                <p className="text-sm text-red-500 mt-1">{errors.date}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                {t('bank.amount') || 'Amount'} (GNF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                disabled={isLoading}
                placeholder="0"
                min="0"
                step="1"
                className={`w-full px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 ${
                  errors.amount
                    ? 'border-red-500 border'
                    : 'border border-gray-300 dark:border-stone-600'
                }`}
              />
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Linked Sale (for SalesDeposit only) */}
            {formData.type === 'Deposit' && formData.reason === 'SalesDeposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {t('bank.linkedSale') || 'Linked Sale'} ({t('common.optional') || 'Optional'})
                </label>
                <select
                  value={formData.saleId}
                  onChange={(e) => handleChange('saleId', e.target.value)}
                  disabled={isLoading || loadingSales}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 disabled:opacity-50"
                >
                  <option value="">
                    {loadingSales
                      ? (t('common.loading') || 'Loading...')
                      : (t('bank.selectSale') || 'Select a sale (optional)')}
                  </option>
                  {availableSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {formatDate(sale.date)} - {formatCurrency(sale.cashGNF)}
                    </option>
                  ))}
                </select>
                {availableSales.length === 0 && !loadingSales && (
                  <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">
                    {t('bank.noAvailableSales') || 'No approved sales available'}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                {t('common.description') || 'Description'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isLoading}
                placeholder={t('bank.descriptionPlaceholder') || 'Brief description...'}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 disabled:opacity-50"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                {t('common.comments') || 'Comments'} ({t('common.optional') || 'Optional'})
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                disabled={isLoading}
                rows={2}
                placeholder={t('bank.commentsPlaceholder') || 'Add any notes...'}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-stone-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium shadow-sm disabled:opacity-50 ${
                  formData.type === 'Deposit'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                {isLoading
                  ? (t('common.saving') || 'Saving...')
                  : formData.type === 'Deposit'
                    ? (t('bank.createDeposit') || 'Create Deposit')
                    : (t('bank.createWithdrawal') || 'Create Withdrawal')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
