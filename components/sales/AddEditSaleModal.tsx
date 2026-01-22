'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Smartphone, CreditCard, Clock, Users, ShoppingBag, FileText, Plus, Trash2, UserCheck } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

interface Customer {
  id: string
  name: string
  phone: string | null
  company: string | null
  creditLimit: number | null
  outstandingDebt?: number
}

interface DebtItem {
  customerId: string
  amountGNF: number
  dueDate: string
  description: string
}

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
  debts?: DebtItem[]
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
  const { currentRestaurant } = useRestaurant()
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

  const [customers, setCustomers] = useState<Customer[]>([])
  const [debtItems, setDebtItems] = useState<DebtItem[]>([])
  const [showCreditSection, setShowCreditSection] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!currentRestaurant) return

      try {
        const response = await fetch(`/api/customers?restaurantId=${currentRestaurant.id}&includeActive=true`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    }

    if (isOpen && currentRestaurant) {
      fetchCustomers()
    }
  }, [isOpen, currentRestaurant])

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
      if (sale.debts && sale.debts.length > 0) {
        setDebtItems(sale.debts)
        setShowCreditSection(true)
      }
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
      setDebtItems([])
      setShowCreditSection(false)
    }
    setErrors({})
  }, [sale, isOpen])

  // Calculate totals
  const immediatePaymentGNF = formData.cashGNF + formData.orangeMoneyGNF + formData.cardGNF
  const creditTotalGNF = debtItems.reduce((sum, item) => sum + item.amountGNF, 0)
  const totalGNF = immediatePaymentGNF + creditTotalGNF

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

  // Add debt item
  const addDebtItem = () => {
    setDebtItems([
      ...debtItems,
      {
        customerId: '',
        amountGNF: 0,
        dueDate: '',
        description: ''
      }
    ])
    setShowCreditSection(true)
  }

  // Remove debt item
  const removeDebtItem = (index: number) => {
    const updated = debtItems.filter((_, i) => i !== index)
    setDebtItems(updated)
    if (updated.length === 0) {
      setShowCreditSection(false)
    }
  }

  // Update debt item
  const updateDebtItem = (index: number, field: keyof DebtItem, value: string | number) => {
    const updated = [...debtItems]
    updated[index] = { ...updated[index], [field]: value }
    setDebtItems(updated)
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

    // Validate debt items
    debtItems.forEach((item, index) => {
      if (!item.customerId) {
        newErrors[`debt_${index}_customer`] = 'Customer required'
      }
      if (item.amountGNF <= 0) {
        newErrors[`debt_${index}_amount`] = 'Amount must be positive'
      }

      // Check credit limit
      if (item.customerId && item.amountGNF > 0) {
        const customer = customers.find(c => c.id === item.customerId)
        if (customer?.creditLimit) {
          const currentDebt = customer.outstandingDebt || 0
          if (currentDebt + item.amountGNF > customer.creditLimit) {
            newErrors[`debt_${index}_amount`] = `Exceeds credit limit (${formatCurrency(customer.creditLimit - currentDebt)} available)`
          }
        }
      }
    })

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
      debts: debtItems.length > 0 ? debtItems : undefined,
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

              {/* Immediate Payment Summary */}
              <div className="p-4 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10 border border-terracotta-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-terracotta-700 dark:text-cream-200">
                    {t('sales.immediatePayment') || 'Immediate Payment'}
                  </span>
                  <span className="text-lg font-semibold text-terracotta-900 dark:text-cream-100">
                    {formatCurrency(immediatePaymentGNF)}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Sales Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-terracotta-800 dark:text-cream-200 uppercase tracking-wider">
                  {t('sales.creditSales') || 'Credit Sales'} ({t('common.optional') || 'Optional'})
                </h3>
                {!showCreditSection && (
                  <button
                    type="button"
                    onClick={addDebtItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-terracotta-600 dark:text-cream-300 hover:bg-terracotta-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t('sales.addCreditSale') || 'Add Credit Sale'}
                  </button>
                )}
              </div>

              {showCreditSection && (
                <div className="space-y-3">
                  {debtItems.map((item, index) => {
                    const customer = customers.find(c => c.id === item.customerId)
                    const availableCredit = customer?.creditLimit
                      ? customer.creditLimit - (customer.outstandingDebt || 0)
                      : null

                    return (
                      <div
                        key={index}
                        className="p-4 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-800/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-terracotta-700 dark:text-cream-200">
                            Credit Item {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDebtItem(index)}
                            className="p-1 text-red-600 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Customer Selection */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                              <UserCheck className="w-4 h-4" />
                              Customer *
                            </label>
                            <select
                              value={item.customerId}
                              onChange={(e) => updateDebtItem(index, 'customerId', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                errors[`debt_${index}_customer`]
                                  ? 'border-red-500'
                                  : 'border-terracotta-200 dark:border-dark-600'
                              } bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500`}
                            >
                              <option value="">Select customer</option>
                              {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} {c.company ? `(${c.company})` : ''}
                                </option>
                              ))}
                            </select>
                            {errors[`debt_${index}_customer`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`debt_${index}_customer`]}</p>
                            )}
                            {customer?.creditLimit && (
                              <p className="mt-1 text-xs text-terracotta-600/70 dark:text-cream-300/70">
                                Available credit: {formatCurrency(availableCredit || 0)}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                              <DollarSign className="w-4 h-4" />
                              Amount (GNF) *
                            </label>
                            <input
                              type="number"
                              value={item.amountGNF || ''}
                              onChange={(e) => updateDebtItem(index, 'amountGNF', parseFloat(e.target.value) || 0)}
                              min="0"
                              className={`w-full px-3 py-2 rounded-lg border ${
                                errors[`debt_${index}_amount`]
                                  ? 'border-red-500'
                                  : 'border-terracotta-200 dark:border-dark-600'
                              } bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500`}
                            />
                            {errors[`debt_${index}_amount`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`debt_${index}_amount`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Due Date */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                              <Calendar className="w-4 h-4" />
                              Due Date
                            </label>
                            <input
                              type="date"
                              value={item.dueDate}
                              onChange={(e) => updateDebtItem(index, 'dueDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-2">
                              <FileText className="w-4 h-4" />
                              Description
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateDebtItem(index, 'description', e.target.value)}
                              placeholder="Optional note"
                              className="w-full px-3 py-2 rounded-lg border border-terracotta-200 dark:border-dark-600 bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addDebtItem}
                    className="w-full px-4 py-2 border-2 border-dashed border-terracotta-300 dark:border-dark-600 rounded-xl text-terracotta-600 dark:text-cream-300 hover:bg-terracotta-500/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('sales.addAnotherCreditSale') || 'Add Another Credit Sale'}
                  </button>

                  {/* Credit Total */}
                  {creditTotalGNF > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          {t('sales.creditTotal') || 'Credit Total'}
                        </span>
                        <span className="text-lg font-semibold text-amber-900 dark:text-amber-200">
                          {formatCurrency(creditTotalGNF)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-terracotta-500/20 to-terracotta-600/20 dark:from-terracotta-400/20 dark:to-terracotta-500/20 border-2 border-terracotta-500/30">
              <div className="space-y-2">
                {creditTotalGNF > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-terracotta-700 dark:text-cream-200">
                      Immediate Payment
                    </span>
                    <span className="font-medium text-terracotta-800 dark:text-cream-100">
                      {formatCurrency(immediatePaymentGNF)}
                    </span>
                  </div>
                )}
                {creditTotalGNF > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700 dark:text-amber-300">
                      Credit Sales
                    </span>
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {formatCurrency(creditTotalGNF)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-terracotta-500/30 flex items-center justify-between">
                  <span className="text-base font-semibold text-terracotta-900 dark:text-cream-100">
                    {t('sales.grandTotal') || 'Grand Total'}
                  </span>
                  <span className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
                    {formatCurrency(totalGNF)}
                  </span>
                </div>
              </div>
              {errors.total && (
                <p className="mt-2 text-sm text-red-500">{errors.total}</p>
              )}
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
