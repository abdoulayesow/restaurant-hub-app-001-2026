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
        <div className="animate-modal-entrance w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-cream-50 dark:bg-plum-900 rounded-2xl warm-shadow-lg">
          {/* Header */}
          <div className="sticky top-0 bg-cream-50 dark:bg-plum-900 px-6 py-5 border-b border-plum-200/30 dark:border-plum-700/30 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="bliss-display text-2xl font-bold text-plum-800 dark:text-cream-100">
                  {t('debts.createDebt') || 'Create Debt'}
                </h2>
                <p className="bliss-body text-sm text-plum-600 dark:text-plum-300 mt-1">
                  {t('debts.createDebtDescription') || 'Manually record a debt for a customer'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-plum-100 dark:hover:bg-plum-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-plum-600 dark:text-cream-300" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="flex items-center gap-2 bliss-body text-sm font-medium text-plum-700 dark:text-cream-200 mb-2">
                <User className="w-4 h-4" />
                {t('customers.customer') || 'Customer'} *
              </label>
              {loadingCustomers ? (
                <div className="bliss-body text-sm text-plum-500 dark:text-plum-400">
                  {t('common.loading') || 'Loading...'}
                </div>
              ) : (
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="bliss-body w-full px-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100"
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
              <label className="flex items-center gap-2 bliss-body text-sm font-medium text-plum-700 dark:text-cream-200 mb-2">
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
                className="bliss-body w-full px-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100 placeholder:text-plum-400 dark:placeholder:text-plum-600"
              />
            </div>

            {/* Due Date (Optional) */}
            <div>
              <label className="flex items-center gap-2 bliss-body text-sm font-medium text-plum-700 dark:text-cream-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('debts.dueDate') || 'Due Date'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bliss-body w-full px-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 bliss-body text-sm font-medium text-plum-700 dark:text-cream-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('debts.description') || 'Description'} ({t('common.optional') || 'Optional'})
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('debts.descriptionPlaceholder') || 'e.g., Legacy debt from previous system'}
                className="bliss-body w-full px-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100 placeholder:text-plum-400 dark:placeholder:text-plum-600"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 bliss-body text-sm font-medium text-plum-700 dark:text-cream-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('debts.notes') || 'Notes'} ({t('common.optional') || 'Optional'})
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('debts.notesPlaceholder') || 'Additional information about this debt...'}
                rows={3}
                className="bliss-body w-full px-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100 placeholder:text-plum-400 dark:placeholder:text-plum-600 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
                <p className="bliss-body text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-plum-200/30 dark:border-plum-700/30">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-2.5 rounded-xl border border-plum-200 dark:border-plum-700 text-plum-700 dark:text-cream-300 hover:bg-plum-50 dark:hover:bg-plum-800 transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.customerId || !formData.principalAmount}
                className="btn-lift flex-1 px-6 py-2.5 rounded-xl bg-plum-700 text-cream-50 font-medium hover:bg-plum-800 shadow-lg shadow-plum-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
