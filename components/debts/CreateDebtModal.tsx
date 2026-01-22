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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-terracotta-50 to-terracotta-100 dark:from-gray-900 dark:to-gray-800 px-6 py-5 border-b border-terracotta-200 dark:border-gray-700 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-terracotta-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('debts.createDebt') || 'Create Debt'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('debts.createDebtDescription') || 'Manually record a debt for a customer'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-terracotta-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customers.customer') || 'Customer'} *
            </label>
            {loadingCustomers ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('common.loading') || 'Loading...'}
              </div>
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white appearance-none"
                >
                  <option value="">{t('debts.selectCustomer') || 'Select a customer'}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone ? `- ${customer.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Principal Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('debts.principalAmount') || 'Principal Amount'} (GNF) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.principalAmount}
                onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                placeholder="0"
                required
                min="1"
                step="1"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Due Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('debts.dueDate') || 'Due Date'} ({t('common.optional') || 'Optional'})
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('debts.description') || 'Description'} ({t('common.optional') || 'Optional'})
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('debts.descriptionPlaceholder') || 'e.g., Legacy debt from previous system'}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('debts.notes') || 'Notes'} ({t('common.optional') || 'Optional'})
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('debts.notesPlaceholder') || 'Additional information about this debt...'}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

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
              disabled={isSubmitting || !formData.customerId || !formData.principalAmount}
              className="flex-1 px-6 py-3 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (t('common.processing') || 'Processing...') : (t('debts.createDebt') || 'Create Debt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
