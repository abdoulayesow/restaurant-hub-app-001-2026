'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  DollarSign,
  Smartphone,
  CreditCard,
  Clock,
  Users,
  ShoppingBag,
  FileText,
  Plus,
  Trash2,
  UserCheck,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canRecordSales } from '@/lib/roles'
import { formatDateForInput, getTodayDateString } from '@/lib/date-utils'

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

interface Product {
  id: string
  name: string
  nameFr: string | null
  category: 'Patisserie' | 'Boulangerie'
  unit: string
}

interface SaleItemEntry {
  productId: string
  quantity: number
  unitPrice: number | null
}

export default function EditorSalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

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
  const [existingDates, setExistingDates] = useState<string[]>([])

  // Products state for optional product tracking
  const [products, setProducts] = useState<Product[]>([])
  const [saleItems, setSaleItems] = useState<SaleItemEntry[]>([])
  const [showProductsSection, setShowProductsSection] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Auth and role check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // Role-based access check
  useEffect(() => {
    if (!restaurantLoading && currentRole && !canRecordSales(currentRole)) {
      router.push('/editor')
    }
  }, [currentRole, restaurantLoading, router])

  // Initialize form with today's date
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: getTodayDateString(),
    }))
  }, [])

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
    if (currentRestaurant) fetchCustomers()
  }, [currentRestaurant])

  // Fetch products for optional product tracking
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentRestaurant) return
      try {
        const response = await fetch(`/api/products?restaurantId=${currentRestaurant.id}&isActive=true`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    if (currentRestaurant) fetchProducts()
  }, [currentRestaurant])

  // Fetch existing sale dates
  useEffect(() => {
    const fetchExistingDates = async () => {
      if (!currentRestaurant) return
      try {
        const response = await fetch(`/api/sales?restaurantId=${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          const dates = (data.sales || []).map((s: { date: string }) => formatDateForInput(s.date))
          setExistingDates(dates)
        }
      } catch (error) {
        console.error('Error fetching existing dates:', error)
      }
    }
    if (currentRestaurant) fetchExistingDates()
  }, [currentRestaurant])

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

    // Immediate validation for date field
    if (field === 'date' && value) {
      const selectedDate = String(value)
      const dateExists = existingDates.some(existingDate => {
        const normalizedExisting = existingDate.split('T')[0]
        return normalizedExisting === selectedDate
      })

      if (dateExists) {
        setErrors(prev => ({
          ...prev,
          date: t('errors.saleDuplicateDateShort') || 'A sale already exists for this date'
        }))
        return
      }
    }

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
      { customerId: '', amountGNF: 0, dueDate: '', description: '' }
    ])
    setShowCreditSection(true)
  }

  // Remove debt item
  const removeDebtItem = (index: number) => {
    const updated = debtItems.filter((_, i) => i !== index)
    setDebtItems(updated)
    if (updated.length === 0) setShowCreditSection(false)
  }

  // Update debt item
  const updateDebtItem = (index: number, field: keyof DebtItem, value: string | number) => {
    const updated = [...debtItems]
    updated[index] = { ...updated[index], [field]: value }
    setDebtItems(updated)
  }

  // Add sale item (product sold)
  const addSaleItem = () => {
    setSaleItems([...saleItems, { productId: '', quantity: 1, unitPrice: null }])
    setShowProductsSection(true)
  }

  // Remove sale item
  const removeSaleItem = (index: number) => {
    const updated = saleItems.filter((_, i) => i !== index)
    setSaleItems(updated)
    if (updated.length === 0) setShowProductsSection(false)
  }

  // Update sale item
  const updateSaleItem = (index: number, field: keyof SaleItemEntry, value: string | number | null) => {
    const updated = [...saleItems]
    updated[index] = { ...updated[index], [field]: value }
    setSaleItems(updated)
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

    // Validate sale items
    saleItems.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`saleItem_${index}_product`] = t('validation.required') || 'Required'
      }
      if (item.quantity <= 0) {
        newErrors[`saleItem_${index}_quantity`] = t('errors.mustBePositive') || 'Must be positive'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !currentRestaurant) return

    setLoading(true)
    setSubmitError(null)

    // Prepare sale items
    const validSaleItems = saleItems
      .filter(item => item.productId && item.quantity > 0)
      .map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || null
      }))

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
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
          saleItems: validSaleItems.length > 0 ? validSaleItems : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit sale')
      }

      setSubmitSuccess(true)
      // Reset form after 2 seconds
      setTimeout(() => {
        router.push('/editor')
      }, 2000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit sale')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="h-64 bg-white dark:bg-stone-800 rounded-lg"></div>
          </div>
        </main>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              {t('editor.saleSubmitted') || 'Sale Submitted!'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('editor.awaitingApproval') || 'Your sale is pending approval from the owner.'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/editor')}
            className="inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back') || 'Back'}
          </button>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {t('editor.submitSale') || 'Submit Sale'}
          </h1>
          {currentRestaurant && (
            <p className="text-sm text-gold-600 dark:text-gold-400 mt-1">
              {currentRestaurant.name}
            </p>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('sales.date') || 'Date'} *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.date ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'}
                  bg-white dark:bg-stone-900
                  text-stone-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gold-500 focus:border-gold-500
                `}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                {t('sales.paymentBreakdown') || 'Payment Breakdown'}
              </h3>

              {/* Cash */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                  <DollarSign className="w-4 h-4" />
                  {t('sales.cash') || 'Cash'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.cashGNF}
                  onChange={(e) => handleNumberChange('cashGNF', e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Orange Money */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                  <Smartphone className="w-4 h-4" />
                  {t('sales.orangeMoney') || 'Orange Money'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.orangeMoneyGNF}
                  onChange={(e) => handleNumberChange('orangeMoneyGNF', e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Card */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                  <CreditCard className="w-4 h-4" />
                  {t('sales.card') || 'Card'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.cardGNF}
                  onChange={(e) => handleNumberChange('cardGNF', e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Immediate Payment Summary */}
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                    {t('sales.immediatePayment') || 'Immediate Payment'}
                  </span>
                  <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {formatCurrency(immediatePaymentGNF)}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Sales Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  {t('sales.creditSales') || 'Credit Sales'} ({t('common.optional') || 'Optional'})
                </h3>
                {!showCreditSection && (
                  <button
                    type="button"
                    onClick={addDebtItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
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
                        className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                            {t('sales.creditItem')} {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDebtItem(index)}
                            className="p-1 text-red-600 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                              <UserCheck className="w-4 h-4" />
                              {t('sales.customer')} *
                            </label>
                            <select
                              value={item.customerId}
                              onChange={(e) => updateDebtItem(index, 'customerId', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                errors[`debt_${index}_customer`]
                                  ? 'border-red-500'
                                  : 'border-stone-300 dark:border-stone-600'
                              } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                            >
                              <option value="">{t('sales.selectCustomer')}</option>
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
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                Available credit: {formatCurrency(availableCredit || 0)}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                              <DollarSign className="w-4 h-4" />
                              {t('sales.amount')} (GNF) *
                            </label>
                            <input
                              type="number"
                              value={item.amountGNF || ''}
                              onChange={(e) => updateDebtItem(index, 'amountGNF', parseFloat(e.target.value) || 0)}
                              min="0"
                              className={`w-full px-3 py-2 rounded-lg border ${
                                errors[`debt_${index}_amount`]
                                  ? 'border-red-500'
                                  : 'border-stone-300 dark:border-stone-600'
                              } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                            />
                            {errors[`debt_${index}_amount`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`debt_${index}_amount`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                              <Calendar className="w-4 h-4" />
                              {t('sales.dueDate')}
                            </label>
                            <input
                              type="date"
                              value={item.dueDate}
                              onChange={(e) => updateDebtItem(index, 'dueDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                              <FileText className="w-4 h-4" />
                              {t('sales.description')}
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateDebtItem(index, 'description', e.target.value)}
                              placeholder={t('sales.optionalNote')}
                              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addDebtItem}
                    className="w-full px-4 py-2 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('sales.addAnotherCreditSale') || 'Add Another Credit Sale'}
                  </button>

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
            <div className="p-5 rounded-xl bg-stone-100 dark:bg-stone-700/50 border-2 border-stone-200 dark:border-stone-600">
              <div className="space-y-2">
                {creditTotalGNF > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-700 dark:text-stone-200">
                        {t('sales.immediatePayment')}
                      </span>
                      <span className="font-medium text-stone-800 dark:text-stone-100">
                        {formatCurrency(immediatePaymentGNF)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-700 dark:text-amber-300">
                        {t('sales.creditSales')}
                      </span>
                      <span className="font-medium text-amber-800 dark:text-amber-200">
                        {formatCurrency(creditTotalGNF)}
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-stone-300 dark:border-stone-500 flex items-center justify-between">
                  <span className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {t('sales.grandTotal') || 'Grand Total'}
                  </span>
                  <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {formatCurrency(totalGNF)}
                  </span>
                </div>
              </div>
              {errors.total && (
                <p className="mt-2 text-sm text-red-500">{errors.total}</p>
              )}
            </div>

            {/* Products Sold Section - Optional */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                    {t('sales.productsSold') || 'Products Sold'}
                  </h3>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-normal normal-case">
                    ({t('common.optional') || 'Optional'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductsSection(!showProductsSection)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  {showProductsSection ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {t('sales.hideProducts') || 'Hide'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {t('sales.showProducts') || 'Show'}
                    </>
                  )}
                </button>
              </div>

              {showProductsSection && (
                <div className="space-y-3 p-4 rounded-xl border border-gold-200 dark:border-gold-800/50 bg-gold-50/30 dark:bg-gold-900/10">
                  <p className="text-xs text-gold-700 dark:text-gold-400">
                    {t('sales.productsOptional') || 'Track which products were sold (optional)'}
                  </p>

                  {saleItems.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="w-10 h-10 mx-auto text-gold-300 dark:text-gold-700 mb-2" />
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {t('sales.noProductsAdded') || 'No products added'}
                      </p>
                      <button
                        type="button"
                        onClick={addSaleItem}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 rounded-lg shadow-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('sales.addProduct') || 'Add Product'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {saleItems.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)

                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-1">
                                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                                    {t('production.product') || 'Product'}
                                  </label>
                                  <select
                                    value={item.productId}
                                    onChange={(e) => updateSaleItem(index, 'productId', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                      errors[`saleItem_${index}_product`]
                                        ? 'border-red-500'
                                        : 'border-stone-300 dark:border-stone-600'
                                    } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                                  >
                                    <option value="">{t('sales.selectProduct') || 'Select a product'}</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {locale === 'fr' && p.nameFr ? p.nameFr : p.name}
                                        {' '}({p.category === 'Patisserie' ? '🥐' : '🥖'})
                                      </option>
                                    ))}
                                  </select>
                                  {errors[`saleItem_${index}_product`] && (
                                    <p className="mt-1 text-xs text-red-500">{errors[`saleItem_${index}_product`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                                    {t('sales.quantity') || 'Quantity'}
                                  </label>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    min="1"
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                      errors[`saleItem_${index}_quantity`]
                                        ? 'border-red-500'
                                        : 'border-stone-300 dark:border-stone-600'
                                    } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                                  />
                                  {product && (
                                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                                      {product.unit}
                                    </p>
                                  )}
                                  {errors[`saleItem_${index}_quantity`] && (
                                    <p className="mt-1 text-xs text-red-500">{errors[`saleItem_${index}_quantity`]}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                                    {t('sales.unitPrice') || 'Unit Price'} (GNF)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.unitPrice || ''}
                                    onChange={(e) => updateSaleItem(index, 'unitPrice', e.target.value ? parseFloat(e.target.value) : null)}
                                    min="0"
                                    placeholder={t('common.optional') || 'Optional'}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSaleItem(index)}
                                className="p-1.5 mt-5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      <button
                        type="button"
                        onClick={addSaleItem}
                        className="w-full px-4 py-2 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {t('sales.addProduct') || 'Add Product'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                {t('sales.additionalInfo') || 'Additional Info'} ({t('common.optional') || 'Optional'})
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                    <ShoppingBag className="w-4 h-4" />
                    {t('sales.itemsSold') || 'Items Sold'}
                  </label>
                  <input
                    type="number"
                    value={formData.itemsCount}
                    onChange={(e) => handleChange('itemsCount', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                    <Users className="w-4 h-4" />
                    {t('sales.customers') || 'Customers'}
                  </label>
                  <input
                    type="number"
                    value={formData.customersCount}
                    onChange={(e) => handleChange('customersCount', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                    <Clock className="w-4 h-4" />
                    {t('sales.openingTime') || 'Opening'}
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => handleChange('openingTime', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                    <Clock className="w-4 h-4" />
                    {t('sales.closingTime') || 'Closing'}
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => handleChange('closingTime', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                  <FileText className="w-4 h-4" />
                  {t('sales.comments') || 'Comments'}
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 resize-none"
                  placeholder={t('sales.commentsPlaceholder') || 'Any notes about today\'s sales...'}
                />
              </div>
            </div>

            {/* Error Alert */}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/editor')}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gold-600 text-white font-medium hover:bg-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (t('common.saving') || 'Saving...')
                  : (t('editor.submitSale') || 'Submit Sale')
                }
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
