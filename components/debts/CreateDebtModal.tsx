'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, FileText, User } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  customerType: 'Individual' | 'Corporate' | 'Wholesale'
}

interface CreateDebtModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateDebtModal({
  isOpen,
  onClose,
  onSuccess
}: CreateDebtModalProps) {
  const { t } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    customerId: '',
    principalAmount: '',
    dueDate: '',
    description: '',
    notes: ''
  })

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!currentRestaurant) return

      try {
        setLoadingCustomers(true)
        const response = await fetch(`/api/customers?restaurantId=${currentRestaurant.id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch customers')
        }

        const data = await response.json()
        setCustomers(data.customers || [])
      } catch (error) {
        console.error('Error fetching customers:', error)
      } finally {
        setLoadingCustomers(false)
      }
    }

    if (isOpen && currentRestaurant) {
      fetchCustomers()
    }
  }, [isOpen, currentRestaurant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.customerId) {
      setError(t('debts.selectCustomer') || 'Please select a customer')
      return
    }

    const amount = parseFloat(formData.principalAmount)
    if (isNaN(amount) || amount <= 0) {
      setError(t('debts.invalidAmount') || 'Principal amount must be greater than 0')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: currentRestaurant?.id,
          customerId: formData.customerId,
          principalAmount: amount,
          dueDate: formData.dueDate || null,
          description: formData.description.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create debt')
      }

      // Success - reset form and close
      setFormData({
        customerId: '',
        principalAmount: '',
        dueDate: '',
        description: '',
        notes: ''
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
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
        <div className="animate-modal-entrance w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-lg">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-stone-800 px-6 py-5 border-b border-gray-200 dark:border-stone-700 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                  {t('debts.createDebt') || 'Create Debt'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-stone-300 mt-1">
                  {t('debts.createDebtDescription') || 'Manually record a debt for a customer'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <User className="w-4 h-4" />
                {t('customers.customer') || 'Customer'} *
              </label>
              {loadingCustomers ? (
                <div className="text-sm text-gray-500 dark:text-stone-400">
                  {t('common.loading') || 'Loading...'}
                </div>
              ) : (
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100"
                >
                  <option value="">{t('debts.selectCustomer') || 'Select a customer'}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone ? `- ${customer.phone}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Principal Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <DollarSign className="w-4 h-4" />
                {t('debts.principalAmount') || 'Principal Amount'} (GNF) *
              </label>
              <input
                type="number"
                value={formData.principalAmount}
                onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                placeholder="0"
                required
                min="1"
                step="1"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
              />
            </div>

            {/* Due Date (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('debts.dueDate') || 'Due Date'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('debts.description') || 'Description'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('debts.descriptionPlaceholder') || 'e.g., Legacy debt from previous system'}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('debts.notes') || 'Notes'} ({t('common.optional') || 'Optional'})
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('debts.notesPlaceholder') || 'Additional information about this debt...'}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

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
                disabled={isSubmitting || !formData.customerId || !formData.principalAmount}
                className="flex-1 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (t('common.processing') || 'Processing...') : (t('debts.createDebt') || 'Create Debt')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
