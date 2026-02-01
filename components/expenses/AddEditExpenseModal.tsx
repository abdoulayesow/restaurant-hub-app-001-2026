'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, FileText, Tag, Building2, Package, Plus, Trash2, History, DollarSign, Receipt, Hash } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { PaymentHistory } from './PaymentHistory'
import { formatDateForInput, getTodayDateString } from '@/lib/date-utils'

interface Category {
  id: string
  name: string
  nameFr?: string | null
  color?: string | null
  expenseGroup?: {
    key: string
    label: string
    labelFr?: string | null
  } | null
}

interface Supplier {
  id: string
  name: string
  phone?: string | null
}

interface InventoryItem {
  id: string
  name: string
  nameFr?: string | null
  unit: string
  unitCostGNF: number
}

interface ExpenseItemInput {
  inventoryItemId: string
  quantity: number
  unitCostGNF: number
}

interface Expense {
  id?: string
  date: string
  categoryId?: string | null
  categoryName: string
  amountGNF: number
  paymentMethod?: string | null // Legacy: now determined at payment time
  billingRef?: string | null // Invoice or receipt reference number
  description?: string | null
  transactionRef?: string | null // Legacy field
  supplierId?: string | null
  isInventoryPurchase?: boolean
  comments?: string | null
  status?: 'Pending' | 'Approved' | 'Rejected'
  paymentStatus?: 'Unpaid' | 'PartiallyPaid' | 'Paid'
  totalPaidAmount?: number
  expenseItems?: Array<{
    inventoryItemId: string
    quantity: number
    unitCostGNF: number
    inventoryItem?: {
      id: string
      name: string
      nameFr?: string | null
      unit: string
    }
  }>
}

interface ExpensePayment {
  id: string
  amount: number
  paymentMethod: 'Cash' | 'OrangeMoney' | 'Card'
  paidAt: string
  paidByName?: string | null
  notes?: string | null
  bankTransaction?: {
    id: string
    status: 'Pending' | 'Confirmed'
    bankRef?: string | null
  } | null
}

interface AddEditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expense: Partial<Expense> & { expenseItems?: ExpenseItemInput[] }) => void
  expense?: Expense | null
  categories: Category[]
  suppliers: Supplier[]
  inventoryItems?: InventoryItem[]
  loading?: boolean
}

export function AddEditExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense,
  categories,
  suppliers,
  inventoryItems = [],
  loading = false,
}: AddEditExpenseModalProps) {
  const { t, locale } = useLocale()
  const isEditMode = !!expense?.id
  const showPaymentHistory = isEditMode && expense?.status === 'Approved'

  const [payments, setPayments] = useState<ExpensePayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [formData, setFormData] = useState({
    date: '',
    categoryId: '',
    categoryName: '',
    amountGNF: 0,
    billingRef: '', // Invoice or receipt reference
    description: '',
    supplierId: '',
    isInventoryPurchase: false,
    comments: '',
  })

  const [expenseItems, setExpenseItems] = useState<ExpenseItemInput[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with expense data
  useEffect(() => {
    if (expense) {
      setFormData({
        date: formatDateForInput(expense.date),
        categoryId: expense.categoryId || '',
        categoryName: expense.categoryName,
        amountGNF: expense.amountGNF,
        billingRef: expense.billingRef || '',
        description: expense.description || '',
        supplierId: expense.supplierId || '',
        isInventoryPurchase: expense.isInventoryPurchase || false,
        comments: expense.comments || '',
      })
      // Initialize expense items if editing
      if (expense.expenseItems && expense.expenseItems.length > 0) {
        setExpenseItems(expense.expenseItems.map(item => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCostGNF: item.unitCostGNF,
        })))
      } else {
        setExpenseItems([])
      }
    } else {
      // Default to today for new expenses
      setFormData({
        date: getTodayDateString(),
        categoryId: '',
        categoryName: '',
        amountGNF: 0,
        billingRef: '',
        description: '',
        supplierId: '',
        isInventoryPurchase: false,
        comments: '',
      })
      setExpenseItems([])
    }
    setErrors({})
    setPayments([])
  }, [expense, isOpen])

  // Fetch payment history for approved expenses
  const fetchPayments = useCallback(async () => {
    if (!expense?.id || expense.status !== 'Approved') return

    setPaymentsLoading(true)
    try {
      const res = await fetch(`/api/expenses/${expense.id}/payments`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setPaymentsLoading(false)
    }
  }, [expense?.id, expense?.status])

  useEffect(() => {
    if (isOpen && showPaymentHistory) {
      fetchPayments()
    }
  }, [isOpen, showPaymentHistory, fetchPayments])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Get category display name based on locale
  const getCategoryDisplayName = (category: Category) => {
    if (locale === 'fr' && category.nameFr) {
      return category.nameFr
    }
    return category.name
  }

  // Get inventory item display name based on locale
  const getInventoryItemDisplayName = (item: InventoryItem) => {
    if (locale === 'fr' && item.nameFr) {
      return item.nameFr
    }
    return item.name
  }

  // Add expense item
  const addExpenseItem = () => {
    setExpenseItems(prev => [...prev, { inventoryItemId: '', quantity: 1, unitCostGNF: 0 }])
  }

  // Remove expense item
  const removeExpenseItem = (index: number) => {
    setExpenseItems(prev => prev.filter((_, i) => i !== index))
  }

  // Update expense item
  const updateExpenseItem = (index: number, field: keyof ExpenseItemInput, value: string | number) => {
    setExpenseItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === 'inventoryItemId') {
        // When item is selected, pre-fill unit cost from inventory
        const invItem = inventoryItems.find(inv => inv.id === value)
        return {
          ...item,
          inventoryItemId: value as string,
          unitCostGNF: invItem?.unitCostGNF || item.unitCostGNF,
        }
      }
      return { ...item, [field]: value }
    }))
  }

  // Calculate total from expense items
  const calculateItemsTotal = () => {
    return expenseItems.reduce((sum, item) => sum + (item.quantity * item.unitCostGNF), 0)
  }

  // Handle input change
  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    setFormData(prev => ({
      ...prev,
      categoryId,
      categoryName: category ? category.name : '',
    }))
    if (errors.category) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.category
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

    if (!formData.categoryId && !formData.categoryName) {
      newErrors.category = t('validation.required') || 'Required'
    }

    if (formData.amountGNF <= 0) {
      newErrors.amount = t('expenses.amountMustBePositive') || 'Amount must be greater than 0'
    }

    // Note: paymentMethod is no longer required at creation time
    // It will be selected when recording the payment

    // Validate expense items for inventory purchases
    if (formData.isInventoryPurchase && expenseItems.length === 0) {
      newErrors.expenseItems = t('expenses.itemsRequired') || 'At least one inventory item is required'
    }

    if (formData.isInventoryPurchase && expenseItems.length > 0) {
      const hasInvalidItem = expenseItems.some(item =>
        !item.inventoryItemId || item.quantity <= 0 || item.unitCostGNF < 0
      )
      if (hasInvalidItem) {
        newErrors.expenseItems = t('expenses.invalidItems') || 'All items must have valid selection, quantity, and cost'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSave({
      ...(expense?.id && { id: expense.id }),
      date: formData.date,
      categoryId: formData.categoryId || null,
      categoryName: formData.categoryName,
      amountGNF: formData.amountGNF,
      billingRef: formData.billingRef || null, // Invoice/receipt reference
      description: formData.description || null,
      supplierId: formData.supplierId || null,
      isInventoryPurchase: formData.isInventoryPurchase,
      comments: formData.comments || null,
      // Include expense items if inventory purchase
      expenseItems: formData.isInventoryPurchase ? expenseItems : [],
    })
  }

  if (!isOpen) return null

  // Group categories by expense group for the dropdown
  const groupedCategories = categories.reduce((acc, cat) => {
    const groupKey = cat.expenseGroup?.key || 'other'
    const groupLabel = locale === 'fr'
      ? (cat.expenseGroup?.labelFr || cat.expenseGroup?.label || 'Other')
      : (cat.expenseGroup?.label || 'Other')

    if (!acc[groupKey]) {
      acc[groupKey] = { label: groupLabel, categories: [] }
    }
    acc[groupKey].categories.push(cat)
    return acc
  }, {} as Record<string, { label: string; categories: Category[] }>)

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
          <div className="sticky top-0 z-10 px-6 py-5 border-b border-gray-100 dark:border-stone-700 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20">
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 p-2 hover:bg-white/60 dark:hover:bg-stone-700/60 rounded-xl transition-all disabled:opacity-50"
              aria-label={t('common.close') || 'Close'}
            >
              <X className="w-5 h-5 text-gray-500 dark:text-stone-400" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="p-2.5 bg-rose-500 rounded-xl shadow-lg shadow-rose-500/25">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  id="modal-title"
                  className="text-xl font-bold text-gray-900 dark:text-stone-100"
                >
                  {isEditMode
                    ? (t('expenses.editExpense') || 'Edit Expense')
                    : (t('expenses.addExpense') || 'Add Expense')
                  }
                </h2>
                <p className="text-sm text-gray-600 dark:text-stone-400">
                  {isEditMode
                    ? (t('expenses.editExpenseDescription') || 'Update expense details')
                    : (t('expenses.addExpenseDescription') || 'Record a new expense')
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <Calendar className="w-4 h-4" />
                {t('expenses.date') || 'Date'} *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'}
                  bg-gray-50 dark:bg-stone-700
                  text-gray-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                `}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <Tag className="w-4 h-4" />
                {t('expenses.category') || 'Category'} *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'}
                  bg-gray-50 dark:bg-stone-700
                  text-gray-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                `}
              >
                <option value="">{t('expenses.selectCategory') || 'Select category'}</option>
                {Object.entries(groupedCategories).map(([groupKey, group]) => (
                  <optgroup key={groupKey} label={group.label}>
                    {group.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {getCategoryDisplayName(cat)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                <DollarSign className="w-4 h-4" />
                {t('expenses.amount') || 'Amount'} (GNF) *
              </label>
              <input
                type="number"
                value={formData.amountGNF || ''}
                onChange={(e) => handleNumberChange('amountGNF', e.target.value)}
                min="0"
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'}
                  bg-gray-50 dark:bg-stone-700
                  text-gray-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                `}
                placeholder="0"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
              )}
              {formData.amountGNF > 0 && (
                <p className="mt-1 text-sm text-gray-600 dark:text-stone-300">
                  {formatCurrency(formData.amountGNF)}
                </p>
              )}
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-stone-200 uppercase tracking-wider">
                {t('expenses.additionalInfo') || 'Additional Info'} ({t('common.optional') || 'Optional'})
              </h3>

              {/* Supplier */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <Building2 className="w-4 h-4" />
                  {t('expenses.supplier') || 'Supplier'}
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleChange('supplierId', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-gray-50 dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">{t('expenses.selectSupplier') || 'Select supplier (optional)'}</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <FileText className="w-4 h-4" />
                  {t('expenses.description') || 'Description'}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-gray-50 dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500"
                  placeholder={t('expenses.descriptionPlaceholder') || 'Brief description...'}
                />
              </div>

              {/* Billing Reference (Invoice/Receipt) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <Hash className="w-4 h-4" />
                  {t('expenses.billingRef') || 'Invoice/Receipt #'}
                </label>
                <input
                  type="text"
                  value={formData.billingRef}
                  onChange={(e) => handleChange('billingRef', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-gray-50 dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500"
                  placeholder={t('expenses.billingRefPlaceholder') || 'Invoice or receipt number...'}
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-stone-400">
                  {t('expenses.billingRefHint') || 'Reference number from supplier invoice or receipt'}
                </p>
              </div>

              {/* Is Inventory Purchase */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-stone-700 border border-gray-300 dark:border-stone-600">
                <input
                  type="checkbox"
                  id="isInventoryPurchase"
                  checked={formData.isInventoryPurchase}
                  onChange={(e) => handleChange('isInventoryPurchase', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-500 focus:ring-gray-500"
                />
                <label htmlFor="isInventoryPurchase" className="flex items-center gap-2 cursor-pointer">
                  <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-stone-100">
                      {t('expenses.isInventoryPurchase') || 'Inventory Purchase'}
                    </span>
                    <p className="text-xs text-gray-600/60 dark:text-stone-300/60">
                      {t('expenses.inventoryPurchaseHint') || 'Check if this expense is for restocking inventory'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Inventory Items Section - Only show when isInventoryPurchase is checked */}
              {formData.isInventoryPurchase && (
                <div className="space-y-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t('expenses.inventoryItems') || 'Inventory Items'}
                    </h4>
                    <button
                      type="button"
                      onClick={addExpenseItem}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/50 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {t('expenses.addItem') || 'Add Item'}
                    </button>
                  </div>

                  {expenseItems.length === 0 ? (
                    <p className="text-sm text-green-700/70 dark:text-green-300/70 text-center py-4">
                      {t('expenses.noItemsAdded') || 'No items added yet. Click "Add Item" to add inventory items.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {expenseItems.map((item, index) => {
                        const selectedItem = inventoryItems.find(inv => inv.id === item.inventoryItemId)
                        return (
                          <div key={index} className="flex gap-2 items-start bg-white dark:bg-stone-800 p-3 rounded-lg">
                            <div className="flex-1 space-y-2">
                              {/* Item Select */}
                              <select
                                value={item.inventoryItemId}
                                onChange={(e) => updateExpenseItem(index, 'inventoryItemId', e.target.value)}
                                disabled={inventoryItems.length === 0}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">
                                  {inventoryItems.length === 0
                                    ? (t('expenses.noInventoryItems') || 'No inventory items available')
                                    : (t('expenses.selectItem') || 'Select item...')}
                                </option>
                                {inventoryItems.map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {getInventoryItemDisplayName(inv)} ({inv.unit})
                                  </option>
                                ))}
                              </select>
                              {inventoryItems.length === 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  {t('expenses.noInventoryItemsHint') || 'Please add inventory items first from the Inventory page'}
                                </p>
                              )}
                              {/* Quantity and Unit Cost */}
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-600 dark:text-gray-400">
                                    {t('expenses.quantity') || 'Qty'} {selectedItem && `(${selectedItem.unit})`}
                                  </label>
                                  <input
                                    type="number"
                                    value={item.quantity || ''}
                                    onChange={(e) => updateExpenseItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    min="0.01"
                                    step="0.01"
                                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-green-500"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-600 dark:text-gray-400">
                                    {t('expenses.unitCost') || 'Unit Cost'} (GNF)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.unitCostGNF || ''}
                                    onChange={(e) => updateExpenseItem(index, 'unitCostGNF', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-green-500"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              {/* Line Total */}
                              {item.quantity > 0 && item.unitCostGNF > 0 && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  = {formatCurrency(item.quantity * item.unitCostGNF)}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExpenseItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              aria-label={t('common.remove') || 'Remove'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Items Total */}
                  {expenseItems.length > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {t('expenses.itemsTotal') || 'Items Total'}:
                      </span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(calculateItemsTotal())}
                      </span>
                    </div>
                  )}

                  {errors.expenseItems && (
                    <p className="text-sm text-red-500">{errors.expenseItems}</p>
                  )}
                </div>
              )}

              {/* Comments */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  <FileText className="w-4 h-4" />
                  {t('expenses.comments') || 'Comments'}
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 bg-gray-50 dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-gray-500 resize-none"
                  placeholder={t('expenses.commentsPlaceholder') || 'Any additional notes...'}
                />
              </div>
            </div>

            {/* Payment History Section - Only for approved expenses */}
            {showPaymentHistory && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-stone-700">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-stone-200 uppercase tracking-wider">
                  <History className="w-4 h-4" />
                  {t('expenses.payment.history') || 'Payment History'}
                </h3>

                {/* Payment Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50">
                  <span className="text-sm text-gray-600 dark:text-stone-400">
                    {t('expenses.payment.status') || 'Payment Status'}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    expense?.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : expense?.paymentStatus === 'PartiallyPaid'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-gray-100 dark:bg-stone-600 text-gray-700 dark:text-stone-300'
                  }`}>
                    {expense?.paymentStatus === 'Paid'
                      ? (t('expenses.payment.paid') || 'Paid')
                      : expense?.paymentStatus === 'PartiallyPaid'
                        ? (t('expenses.payment.partiallyPaid') || 'Partially Paid')
                        : (t('expenses.payment.unpaid') || 'Unpaid')
                    }
                  </span>
                </div>

                <PaymentHistory
                  payments={payments}
                  totalAmount={expense?.amountGNF || 0}
                  loading={paymentsLoading}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-stone-700 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors font-medium disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/25"
              >
                {loading
                  ? (t('common.saving') || 'Saving...')
                  : isEditMode
                    ? (t('common.save') || 'Save')
                    : (t('expenses.addExpense') || 'Add Expense')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddEditExpenseModal
