'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Smartphone, CreditCard, FileText, Plus, Trash2, UserCheck, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
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
  priceGNF: number | null
}

interface SaleItemEntry {
  productId: string
  quantity: number
  unitPrice: number | null
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
  saleItems?: Array<{
    id?: string
    productId: string | null
    product?: Product | null
    productName?: string | null
    productNameFr?: string | null
    quantity: number
    unitPrice?: number | null
  }>
}

interface AddEditSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sale: Partial<Sale>) => void
  sale?: Sale | null
  mode?: 'view' | 'edit' // View mode = read-only, Edit mode = editable
  loading?: boolean
  error?: string | null
  existingDates?: string[] // Dates that already have sales (YYYY-MM-DD format)
}

export function AddEditSaleModal({
  isOpen,
  onClose,
  onSave,
  sale,
  mode = 'edit', // Default to edit mode
  loading = false,
  error = null,
  existingDates = [],
}: AddEditSaleModalProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const isEditMode = !!sale?.id
  const isViewMode = mode === 'view'

  const [formData, setFormData] = useState({
    date: '',
    cashGNF: 0,
    orangeMoneyGNF: 0,
    cardGNF: 0,
    comments: '',
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [debtItems, setDebtItems] = useState<DebtItem[]>([])
  const [showCreditSection, setShowCreditSection] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Products state for optional product tracking
  const [products, setProducts] = useState<Product[]>([])
  const [saleItems, setSaleItems] = useState<SaleItemEntry[]>([])
  const [showProductsSection, setShowProductsSection] = useState(false)

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

    if (isOpen && currentRestaurant) {
      fetchProducts()
    }
  }, [isOpen, currentRestaurant])

  // Initialize form with sale data
  useEffect(() => {
    if (sale) {
      const isoDate = formatDateForInput(sale.date)
      setFormData({
        date: isoDate, // Use timezone-aware date formatting
        cashGNF: sale.cashGNF,
        orangeMoneyGNF: sale.orangeMoneyGNF,
        cardGNF: sale.cardGNF,
        comments: sale.comments || '',
      })
      if (sale.debts && sale.debts.length > 0) {
        // Transform existing debts from DB format to modal format
        const transformedDebts = sale.debts.map((debt: DebtItem | { principalAmount?: number; dueDate?: string | Date; [key: string]: unknown }) => {
          const isoDate = debt.dueDate ? formatDateForInput(debt.dueDate) : ''
          return {
            customerId: typeof debt.customerId === 'string' ? debt.customerId : '',
            // Use principalAmount from DB, but store as amountGNF for the modal
            amountGNF: ('principalAmount' in debt && typeof debt.principalAmount === 'number' ? debt.principalAmount : ('amountGNF' in debt && typeof debt.amountGNF === 'number' ? debt.amountGNF : 0)),
            dueDate: isoDate,
            description: typeof debt.description === 'string' ? debt.description : ''
          }
        })
        setDebtItems(transformedDebts)
        setShowCreditSection(true)
      }
      // Initialize saleItems if present
      if (sale.saleItems && sale.saleItems.length > 0) {
        setSaleItems(sale.saleItems.map(item => ({
          productId: item.productId || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice || null
        })))
        setShowProductsSection(true)
      } else {
        setSaleItems([])
        setShowProductsSection(false)
      }
    } else {
      // Default to today for new sales
      const todayISO = getTodayDateString()
      setFormData({
        date: todayISO, // Use timezone-aware today's date
        cashGNF: 0,
        orangeMoneyGNF: 0,
        cardGNF: 0,
        comments: '',
      })
      setDebtItems([])
      setShowCreditSection(false)
      setSaleItems([])
      setShowProductsSection(false)
    }
    setErrors({})
  }, [sale, isOpen, locale])

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

    // Immediate validation for date field - check if date already has a sale
    if (field === 'date' && value && !isEditMode) {
      const selectedDate = String(value)
      // Check if this date already has a sale (exclude current sale date in edit mode)
      const dateExists = existingDates.some(existingDate => {
        // Normalize both dates to YYYY-MM-DD for comparison
        const normalizedExisting = existingDate.split('T')[0]
        return normalizedExisting === selectedDate
      })

      if (dateExists) {
        setErrors(prev => ({
          ...prev,
          date: t('errors.saleDuplicateDateShort') || 'A sale already exists for this date'
        }))
        return // Keep the error, don't clear it
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

    // Clear related errors when debt item values change
    const errorKey = field === 'customerId' ? `debt_${index}_customer` : `debt_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  // Add sale item (product sold)
  const addSaleItem = () => {
    setSaleItems([
      ...saleItems,
      {
        productId: '',
        quantity: 1,
        unitPrice: null
      }
    ])
    setShowProductsSection(true)
  }

  // Remove sale item
  const removeSaleItem = (index: number) => {
    const updated = saleItems.filter((_, i) => i !== index)
    setSaleItems(updated)
    if (updated.length === 0) {
      setShowProductsSection(false)
    }
  }

  // Update sale item
  const updateSaleItem = (index: number, field: keyof SaleItemEntry, value: string | number | null) => {
    const updated = [...saleItems]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-fill unitPrice when product is selected
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === value)
      if (selectedProduct?.priceGNF) {
        updated[index].unitPrice = selectedProduct.priceGNF
      }
    }

    setSaleItems(updated)

    // Clear related errors when sale item values change
    const errorKey = field === 'productId' ? `saleItem_${index}_product` : `saleItem_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
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

    // Validate sale items (products sold) - only if section is shown
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    // Prepare sale items for submission (only valid ones)
    const validSaleItems = saleItems
      .filter(item => item.productId && item.quantity > 0)
      .map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || null
      }))

    onSave({
      ...(sale?.id && { id: sale.id }),
      date: formData.date,
      cashGNF: formData.cashGNF,
      orangeMoneyGNF: formData.orangeMoneyGNF,
      cardGNF: formData.cardGNF,
      comments: formData.comments || null,
      debts: debtItems.length > 0 ? debtItems : undefined,
      saleItems: validSaleItems.length > 0 ? validSaleItems : undefined,
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
            bg-white dark:bg-stone-800
            rounded-2xl shadow-lg
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-stone-800 p-6 border-b border-gray-200 dark:border-stone-700 z-10">
            <div className="flex items-center justify-between">
              <h2
                id="modal-title"
                className="text-xl font-bold text-gray-900 dark:text-stone-100"
              >
                {isViewMode
                  ? (t('sales.viewSale') || 'View Sale')
                  : isEditMode
                    ? (t('sales.editSale') || 'Edit Sale')
                    : (t('sales.addSale') || 'Add Sale')
                }
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('sales.date') || 'Date'} *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={isViewMode}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'}
                  bg-white dark:bg-stone-900
                  text-gray-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-stone-200 uppercase tracking-wider">
                {t('sales.paymentBreakdown') || 'Payment Breakdown'}
              </h3>

              {/* Cash */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <DollarSign className="w-4 h-4" />
                  {t('sales.cash') || 'Cash'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.cashGNF}
                  onChange={(e) => handleNumberChange('cashGNF', e.target.value)}
                  min="0"
                  disabled={isViewMode}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Orange Money */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <Smartphone className="w-4 h-4" />
                  {t('sales.orangeMoney') || 'Orange Money'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.orangeMoneyGNF}
                  onChange={(e) => handleNumberChange('orangeMoneyGNF', e.target.value)}
                  min="0"
                  disabled={isViewMode}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Card */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <CreditCard className="w-4 h-4" />
                  {t('sales.card') || 'Card'} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.cardGNF}
                  onChange={(e) => handleNumberChange('cardGNF', e.target.value)}
                  min="0"
                  disabled={isViewMode}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Immediate Payment Summary */}
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-stone-200">
                    {t('sales.immediatePayment') || 'Immediate Payment'}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-stone-100">
                    {formatCurrency(immediatePaymentGNF)}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Sales Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-stone-200 uppercase tracking-wider">
                  {t('sales.creditSales') || 'Credit Sales'} ({t('common.optional') || 'Optional'})
                </h3>
                {!showCreditSection && !isViewMode && (
                  <button
                    type="button"
                    onClick={addDebtItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
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
                        className="p-4 rounded-xl border border-gray-200 dark:border-stone-600 bg-gray-50 dark:bg-stone-900/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-stone-200">
                            {t('sales.creditItem')} {index + 1}
                          </span>
                          {!isViewMode && (
                            <button
                              type="button"
                              onClick={() => removeDebtItem(index)}
                              className="p-1 text-red-600 hover:bg-red-500/10 rounded transition-colors"
                              title={t('common.remove') || 'Remove'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Customer Selection */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                              <UserCheck className="w-4 h-4" />
                              {t('sales.customer')} *
                            </label>
                            <select
                              value={item.customerId}
                              onChange={(e) => updateDebtItem(index, 'customerId', e.target.value)}
                              disabled={isViewMode}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                errors[`debt_${index}_customer`]
                                  ? 'border-red-500'
                                  : 'border-gray-300 dark:border-stone-600'
                              } bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed`}
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
                              <p className="mt-1 text-xs text-gray-500 dark:text-stone-400">
                                Available credit: {formatCurrency(availableCredit || 0)}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                              <DollarSign className="w-4 h-4" />
                              {t('sales.amount')} (GNF) *
                            </label>
                            <input
                              type="number"
                              value={item.amountGNF || ''}
                              onChange={(e) => updateDebtItem(index, 'amountGNF', parseFloat(e.target.value) || 0)}
                              min="0"
                              disabled={isViewMode}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                errors[`debt_${index}_amount`]
                                  ? 'border-red-500'
                                  : 'border-gray-300 dark:border-stone-600'
                              } bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed`}
                            />
                            {errors[`debt_${index}_amount`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`debt_${index}_amount`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Due Date */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                              <Calendar className="w-4 h-4" />
                              {t('sales.dueDate')}
                            </label>
                            <input
                              type="date"
                              value={item.dueDate}
                              onChange={(e) => updateDebtItem(index, 'dueDate', e.target.value)}
                              disabled={isViewMode}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                              <FileText className="w-4 h-4" />
                              {t('sales.description')}
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateDebtItem(index, 'description', e.target.value)}
                              placeholder={t('sales.optionalNote')}
                              disabled={isViewMode}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addDebtItem}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-stone-600 rounded-xl text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t('sales.addAnotherCreditSale') || 'Add Another Credit Sale'}
                    </button>
                  )}

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
            <div className="p-5 rounded-xl bg-gray-100 dark:bg-stone-700/50 border-2 border-gray-200 dark:border-stone-600">
              <div className="space-y-2">
                {creditTotalGNF > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-stone-200">
                      {t('sales.immediatePayment')}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-stone-100">
                      {formatCurrency(immediatePaymentGNF)}
                    </span>
                  </div>
                )}
                {creditTotalGNF > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700 dark:text-amber-300">
                      {t('sales.creditSales')}
                    </span>
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {formatCurrency(creditTotalGNF)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300 dark:border-stone-500 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-stone-100">
                    {t('sales.grandTotal') || 'Grand Total'}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-stone-100">
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
                  <Package className="w-4 h-4 text-gray-600 dark:text-stone-400" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-stone-200 uppercase tracking-wider">
                    {t('sales.productsSold') || 'Products Sold'}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-stone-400 font-normal normal-case">
                    ({t('common.optional') || 'Optional'})
                  </span>
                </div>
{!isViewMode && (
                  <button
                    type="button"
                    onClick={() => setShowProductsSection(!showProductsSection)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
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
                )}
              </div>

              {showProductsSection && (
                <div className="space-y-3 p-4 rounded-xl border border-gold-200 dark:border-gold-800/50 bg-gold-50/30 dark:bg-gold-900/10">
                  <p className="text-xs text-gold-700 dark:text-gold-400">
                    {t('sales.productsOptional') || 'Track which products were sold (optional)'}
                  </p>

                  {saleItems.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="w-10 h-10 mx-auto text-gold-300 dark:text-gold-700 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-stone-400">
                        {t('sales.noProductsAdded') || 'No products added'}
                      </p>
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={addSaleItem}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 rounded-lg shadow-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          {t('sales.addProduct') || 'Add Product'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {saleItems.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)

                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-800 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Product Selection */}
                                <div className="md:col-span-1">
                                  <label className="block text-xs font-medium text-gray-600 dark:text-stone-300 mb-1">
                                    {t('production.product') || 'Product'}
                                  </label>
                                  <select
                                    value={item.productId}
                                    onChange={(e) => updateSaleItem(index, 'productId', e.target.value)}
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                      errors[`saleItem_${index}_product`]
                                        ? 'border-red-500'
                                        : 'border-gray-300 dark:border-stone-600'
                                    } bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:opacity-60 disabled:cursor-not-allowed`}
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

                                {/* Quantity */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-stone-300 mb-1">
                                    {t('sales.quantity') || 'Quantity'}
                                  </label>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    min="1"
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                      errors[`saleItem_${index}_quantity`]
                                        ? 'border-red-500'
                                        : 'border-gray-300 dark:border-stone-600'
                                    } bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:opacity-60 disabled:cursor-not-allowed`}
                                  />
                                  {product && (
                                    <p className="mt-1 text-xs text-gray-400 dark:text-stone-500">
                                      {product.unit}
                                    </p>
                                  )}
                                  {errors[`saleItem_${index}_quantity`] && (
                                    <p className="mt-1 text-xs text-red-500">{errors[`saleItem_${index}_quantity`]}</p>
                                  )}
                                </div>

                                {/* Unit Price (Optional) */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-stone-300 mb-1">
                                    {t('sales.unitPrice') || 'Unit Price'} (GNF)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.unitPrice || ''}
                                    onChange={(e) => updateSaleItem(index, 'unitPrice', e.target.value ? parseFloat(e.target.value) : null)}
                                    min="0"
                                    placeholder={t('common.optional') || 'Optional'}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              {/* Remove Button */}
                              {!isViewMode && (
                                <button
                                  type="button"
                                  onClick={() => removeSaleItem(index)}
                                  className="p-1.5 mt-5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title={t('common.remove') || 'Remove'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {/* Add Another Product Button */}
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={addSaleItem}
                          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-stone-600 rounded-lg text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          {t('sales.addProduct') || 'Add Product'}
                        </button>
                      )}

                      {/* Products Summary */}
                      {saleItems.filter(i => i.productId && i.quantity > 0).length > 0 && (
                        <div className="p-3 rounded-lg bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gold-700 dark:text-gold-300">
                              {t('production.totalProducts') || 'Total Products'}
                            </span>
                            <span className="text-sm font-semibold text-gold-900 dark:text-gold-200">
                              {saleItems.filter(i => i.productId && i.quantity > 0).length} {t('production.product')?.toLowerCase() || 'product'}(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-stone-200 uppercase tracking-wider">
                {t('sales.additionalInfo') || 'Additional Info'} ({t('common.optional') || 'Optional'})
              </h3>

              {/* Comments */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <FileText className="w-4 h-4" />
                  {t('sales.comments') || 'Comments'}
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  rows={3}
                  disabled={isViewMode}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder={t('sales.commentsPlaceholder') || 'Any notes about today\'s sales...'}
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {isViewMode ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  {t('common.close') || 'Close'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || Object.keys(errors).length > 0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? (t('common.saving') || 'Saving...')
                      : isEditMode
                        ? (t('common.save') || 'Save')
                        : (t('sales.addSale') || 'Add Sale')
                    }
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddEditSaleModal
