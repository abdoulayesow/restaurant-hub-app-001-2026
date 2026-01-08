'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Smartphone, CreditCard, Clock, Users, ShoppingBag, FileText } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Sale {
  id?: string
  date: string
  totalGNF: number
  cashGNF: number
  orangeMoneyGNF: number
  cardGNF: number
  status?: 'Pending' | 'Approved' | 'Rejected'
  itemsCount?: number | null
  customersCount?: number | null
  openingTime?: string | null
  closingTime?: string | null
  comments?: string | null
}

interface AddEditSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sale: Partial<Sale>) => void
  sale?: Sale | null
  loading?: boolean
}

export function AddEditSaleModal({
  isOpen,
  onClose,
  onSave,
  sale,
  loading = false,
}: AddEditSaleModalProps) {
  const { t, locale } = useLocale()
  const isEditMode = !!sale?.id

  const [formData, setFormData] = useState({
    date: '',
    cashGNF: 0,
    orangeMoneyGNF: 0,
    cardGNF: 0,
    itemsCount: '',
    customersCount: '',
    openingTime: '',
    closingTime: '',
    comments: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with sale data
  useEffect(() => {
    if (sale) {
      setFormData({
        date: sale.date.split('T')[0],
        cashGNF: sale.cashGNF,
        orangeMoneyGNF: sale.orangeMoneyGNF,
        cardGNF: sale.cardGNF,
        itemsCount: sale.itemsCount?.toString() || '',
        customersCount: sale.customersCount?.toString() || '',
        openingTime: sale.openingTime || '',
        closingTime: sale.closingTime || '',
        comments: sale.comments || '',
      })
    } else {
      // Default to today for new sales
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cashGNF: 0,
        orangeMoneyGNF: 0,
        cardGNF: 0,
        itemsCount: '',
        customersCount: '',
        openingTime: '',
        closingTime: '',
        comments: '',
      })
    }
    setErrors({})
  }, [sale, isOpen])

  // Calculate total
  const totalGNF = formData.cashGNF + formData.orangeMoneyGNF + formData.cardGNF

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Handle input change
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle number input
  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0
    handleChange(field, numValue)
  }

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = t('validation.required') || 'Required'
    }

    if (totalGNF <= 0) {
      newErrors.total = t('sales.totalMustBePositive') || 'Total must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSave({
      ...(sale?.id && { id: sale.id }),
      date: formData.date,
      cashGNF: formData.cashGNF,
      orangeMoneyGNF: formData.orangeMoneyGNF,
      cardGNF: formData.cardGNF,
      itemsCount: formData.itemsCount ? parseInt(formData.itemsCount) : null,
      customersCount: formData.customersCount ? parseInt(formData.customersCount) : null,
      openingTime: formData.openingTime || null,
      closingTime: formData.closingTime || null,
      comments: formData.comments || null,
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="
            animate-fade-in-up
            w-full max-w-lg max-h-[90vh] overflow-y-auto
            bg-cream-50 dark:bg-dark-900
            rounded-2xl warm-shadow-lg grain-overlay
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="sticky top-0 bg-cream-50 dark:bg-dark-900 p-6 border-b border-terracotta-500/15 dark:border-terracotta-400/20 z-10">
            <div className="flex items-center justify-between">
              <h2
                id="modal-title"
                className="text-xl font-bold text-terracotta-900 dark:text-cream-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {isEditMode
                  ? (t('sales.editSale') || 'Edit Sale')
                  : (t('sales.addSale') || 'Add Sale')
                }
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-cream-200 dark:hover:bg-dark-700 transition-colors"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-5 h-5 text-terracotta-600 dark:text-cream-300" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('sales.date') || 'Date'} *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={isEditMode}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.date ? 'border-red-500' : 'border-terracotta-200 dark:border-dark-600'}
                  bg-cream-100 dark:bg-dark-800
                  text-terracotta-900 dark:text-cream-100
                  focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-terracotta-800 dark:text-cream-200 uppercase tracking-wider">
                {t('sales.paymentBreakdown') || 'Payment Breakdown'}
              </h3>

              {/* Cash */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                  <DollarSign className="w-4 h-4" />
                  {t('sales.cash') || 'Cash'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.cashGNF}
                  onChange={(e) => handleNumberChange('cashGNF', e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Orange Money */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                  <Smartphone className="w-4 h-4" />
                  {t('sales.orangeMoney') || 'Orange Money'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.orangeMoneyGNF}
                  onChange={(e) => handleNumberChange('orangeMoneyGNF', e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Card */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                  <CreditCard className="w-4 h-4" />
                  {t('sales.card') || 'Card'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.cardGNF}
                  onChange={(e) => handleNumberChange('cardGNF', e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Total */}
              <div className="p-4 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10 border border-terracotta-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-terracotta-700 dark:text-cream-200">
                    {t('sales.total') || 'Total'}
                  </span>
                  <span className="text-xl font-bold text-terracotta-900 dark:text-cream-100">
                    {formatCurrency(totalGNF)}
                  </span>
                </div>
                {errors.total && (
                  <p className="mt-2 text-sm text-red-500">{errors.total}</p>
                )}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-terracotta-800 dark:text-cream-200 uppercase tracking-wider">
                {t('sales.additionalInfo') || 'Additional Info'} ({t('common.optional') || 'Optional'})
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Items Count */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                    <ShoppingBag className="w-4 h-4" />
                    {t('sales.itemsSold') || 'Items Sold'}
                  </label>
                  <input
                    type="number"
                    value={formData.itemsCount}
                    onChange={(e) => handleChange('itemsCount', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Customers Count */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                    <Users className="w-4 h-4" />
                    {t('sales.customers') || 'Customers'}
                  </label>
                  <input
                    type="number"
                    value={formData.customersCount}
                    onChange={(e) => handleChange('customersCount', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Opening Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                    <Clock className="w-4 h-4" />
                    {t('sales.openingTime') || 'Opening'}
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => handleChange('openingTime', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Closing Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                    <Clock className="w-4 h-4" />
                    {t('sales.closingTime') || 'Closing'}
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => handleChange('closingTime', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                  <FileText className="w-4 h-4" />
                  {t('sales.comments') || 'Comments'}
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500 resize-none"
                  placeholder={t('sales.commentsPlaceholder') || 'Any notes about today\'s sales...'}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 text-terracotta-700 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-800 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta-500 text-white font-medium hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (t('common.saving') || 'Saving...')
                  : isEditMode
                    ? (t('common.save') || 'Save')
                    : (t('sales.addSale') || 'Add Sale')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddEditSaleModal
