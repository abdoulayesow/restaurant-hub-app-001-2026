'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { getTodayDateString, formatUTCDateForDisplay } from '@/lib/date-utils'

interface Sale {
  id: string
  date: string
  totalGNF: number
  cashGNF: number
  bankTransactions?: Array<{
    id: string
    status: 'Pending' | 'Confirmed'
    method: 'Cash' | 'OrangeMoney' | 'Card'
  }>
}

interface DepositFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    date: string
    amount: number
    saleId?: string
    comments?: string
  }) => Promise<void>
  isLoading?: boolean
}

export function DepositFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: DepositFormModalProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()

  const [formData, setFormData] = useState({
    date: getTodayDateString(), // Today's date
    amount: '',
    saleId: '',
    comments: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableSales, setAvailableSales] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  // Fetch available sales (approved sales without deposits)
  useEffect(() => {
    const fetchAvailableSales = async () => {
      if (!currentRestaurant) return

      setLoadingSales(true)
      try {
        const response = await fetch(
          `/api/sales?restaurantId=${currentRestaurant.id}&status=Approved`
        )

        if (response.ok) {
          const data = await response.json()
          // Filter for sales with cash that haven't been deposited yet
          const salesWithoutDeposits = data.sales.filter((sale: Sale) =>
            sale.cashGNF > 0 && !sale.bankTransactions?.some(t => t.method === 'Cash' && t.status === 'Confirmed')
          )
          setAvailableSales(salesWithoutDeposits)
        }
      } catch (error) {
        console.error('Error fetching sales:', error)
      } finally {
        setLoadingSales(false)
      }
    }

    if (isOpen && currentRestaurant) {
      fetchAvailableSales()
    }
  }, [isOpen, currentRestaurant])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: getTodayDateString(),
        amount: '',
        saleId: '',
        comments: '',
      })
      setErrors({})
    }
  }, [isOpen])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const formatDate = (dateString: string) => {
    return formatUTCDateForDisplay(dateString, locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user types
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
      saleId: formData.saleId || undefined,
      comments: formData.comments.trim() || undefined,
    })
  }

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
          className="animate-modal-entrance w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-lg"
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
              {t('bank.newDeposit') || 'New Cash Deposit'}
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

            {/* Linked Sale (Optional) */}
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
                    {formatDate(sale.date)} - {formatCurrency(sale.cashGNF)} ({t('bank.cash') || 'Cash'})
                  </option>
                ))}
              </select>
              {availableSales.length === 0 && !loadingSales && (
                <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">
                  {t('bank.noAvailableSales') || 'No approved sales without deposits'}
                </p>
              )}
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
                rows={3}
                placeholder={t('bank.commentsPlaceholder') || 'Add any notes about this deposit...'}
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm disabled:opacity-50"
              >
                {isLoading
                  ? (t('common.saving') || 'Saving...')
                  : (t('bank.createDeposit') || 'Create Deposit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
