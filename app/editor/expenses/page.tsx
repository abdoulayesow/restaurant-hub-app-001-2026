'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  FileText,
  Tag,
  Building2,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Banknote,
  CreditCard,
  Smartphone,
  Hash,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canRecordExpenses } from '@/lib/roles'
import { PAYMENT_METHODS, PaymentMethodValue } from '@/lib/constants/payment-methods'
import { getTodayDateString } from '@/lib/date-utils'

// Payment method icons mapping
const paymentMethodIcons: Record<string, typeof Banknote> = {
  Cash: Banknote,
  Card: CreditCard,
  OrangeMoney: Smartphone,
}

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

export default function EditorExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  const [formData, setFormData] = useState({
    date: '',
    categoryId: '',
    categoryName: '',
    amountGNF: 0,
    paymentMethod: '' as PaymentMethodValue | '',
    description: '',
    transactionRef: '',
    supplierId: '',
    isInventoryPurchase: false,
    comments: '',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItemInput[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // Role-based access check
  useEffect(() => {
    if (!restaurantLoading && currentRole && !canRecordExpenses(currentRole)) {
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentRestaurant) return
      try {
        const response = await fetch(`/api/expense-categories?restaurantId=${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    if (currentRestaurant) fetchCategories()
  }, [currentRestaurant])

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!currentRestaurant) return
      try {
        const response = await fetch(`/api/suppliers?restaurantId=${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          setSuppliers(data.suppliers || [])
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error)
      }
    }
    if (currentRestaurant) fetchSuppliers()
  }, [currentRestaurant])

  // Fetch inventory items for inventory purchases
  useEffect(() => {
    const fetchInventoryItems = async () => {
      if (!currentRestaurant) return
      try {
        const response = await fetch(`/api/inventory?restaurantId=${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          setInventoryItems(data.items || [])
        }
      } catch (error) {
        console.error('Error fetching inventory items:', error)
      }
    }
    if (currentRestaurant) fetchInventoryItems()
  }, [currentRestaurant])

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

  // Group categories by expense group
  const groupedCategories = categories.reduce((acc, cat) => {
    const groupKey = cat.expenseGroup?.key || 'other'
    if (!acc[groupKey]) {
      acc[groupKey] = {
        label: cat.expenseGroup?.label || 'Other',
        labelFr: cat.expenseGroup?.labelFr || 'Autre',
        items: []
      }
    }
    acc[groupKey].items.push(cat)
    return acc
  }, {} as Record<string, { label: string; labelFr?: string | null; items: Category[] }>)

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

    if (!formData.categoryId) {
      newErrors.category = t('validation.required') || 'Required'
    }

    if (formData.amountGNF <= 0 && !formData.isInventoryPurchase) {
      newErrors.amount = t('errors.mustBePositive') || 'Must be positive'
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = t('validation.required') || 'Required'
    }

    // Transaction ref required for Card/OrangeMoney
    if ((formData.paymentMethod === 'Card' || formData.paymentMethod === 'OrangeMoney') && !formData.transactionRef) {
      newErrors.transactionRef = t('expenses.transactionRefRequired') || 'Transaction reference required'
    }

    // Validate expense items if inventory purchase
    if (formData.isInventoryPurchase) {
      if (expenseItems.length === 0) {
        newErrors.expenseItems = t('expenses.addItemsRequired') || 'Add at least one item'
      }
      expenseItems.forEach((item, index) => {
        if (!item.inventoryItemId) {
          newErrors[`item_${index}_id`] = t('validation.required') || 'Required'
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_qty`] = t('errors.mustBePositive') || 'Must be positive'
        }
        if (item.unitCostGNF <= 0) {
          newErrors[`item_${index}_cost`] = t('errors.mustBePositive') || 'Must be positive'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !currentRestaurant) return

    setLoading(true)
    setSubmitError(null)

    // Calculate amount from items if inventory purchase
    const finalAmount = formData.isInventoryPurchase ? calculateItemsTotal() : formData.amountGNF

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          date: formData.date,
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          amountGNF: finalAmount,
          paymentMethod: formData.paymentMethod,
          description: formData.description || null,
          transactionRef: formData.transactionRef || null,
          supplierId: formData.supplierId || null,
          isInventoryPurchase: formData.isInventoryPurchase,
          comments: formData.comments || null,
          expenseItems: formData.isInventoryPurchase && expenseItems.length > 0 ? expenseItems : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit expense')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push('/editor')
      }, 2000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit expense')
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
              {t('editor.expenseSubmitted') || 'Expense Submitted!'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('editor.awaitingApproval') || 'Your expense is pending approval from the owner.'}
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
            {t('editor.submitExpense') || 'Submit Expense'}
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
                {t('expenses.date') || 'Date'} *
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

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                <Tag className="w-4 h-4" />
                {t('expenses.category') || 'Category'} *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border ${errors.category ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'}
                  bg-white dark:bg-stone-900
                  text-stone-900 dark:text-stone-100
                  focus:ring-2 focus:ring-gold-500 focus:border-gold-500
                `}
              >
                <option value="">{t('expenses.selectCategory') || 'Select a category'}</option>
                {Object.entries(groupedCategories).map(([groupKey, group]) => (
                  <optgroup key={groupKey} label={locale === 'fr' && group.labelFr ? group.labelFr : group.label}>
                    {group.items.map((cat) => (
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

            {/* Payment Method */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                <DollarSign className="w-4 h-4" />
                {t('expenses.paymentMethod') || 'Payment Method'} *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = paymentMethodIcons[method.value]
                  const isSelected = formData.paymentMethod === method.value
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => handleChange('paymentMethod', method.value)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                        ${isSelected
                          ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                          : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                        }
                      `}
                    >
                      {Icon && <Icon className={`w-6 h-6 ${isSelected ? 'text-gold-600' : 'text-stone-500 dark:text-stone-400'}`} />}
                      <span className={`text-sm font-medium ${isSelected ? 'text-gold-700 dark:text-gold-300' : 'text-stone-700 dark:text-stone-300'}`}>
                        {method.displayName}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-500">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Transaction Reference (for Card/OrangeMoney) */}
            {(formData.paymentMethod === 'Card' || formData.paymentMethod === 'OrangeMoney') && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                  <Hash className="w-4 h-4" />
                  {t('expenses.transactionRef') || 'Transaction Reference'} *
                </label>
                <input
                  type="text"
                  value={formData.transactionRef}
                  onChange={(e) => handleChange('transactionRef', e.target.value)}
                  placeholder={t('expenses.transactionRefPlaceholder') || 'e.g., OM-123456'}
                  className={`
                    w-full px-4 py-2.5 rounded-xl
                    border ${errors.transactionRef ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'}
                    bg-white dark:bg-stone-900
                    text-stone-900 dark:text-stone-100
                    focus:ring-2 focus:ring-gold-500 focus:border-gold-500
                  `}
                />
                {errors.transactionRef && (
                  <p className="mt-1 text-sm text-red-500">{errors.transactionRef}</p>
                )}
              </div>
            )}

            {/* Amount (only if not inventory purchase) */}
            {!formData.isInventoryPurchase && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                  <DollarSign className="w-4 h-4" />
                  {t('expenses.amount') || 'Amount'} (GNF) *
                </label>
                <input
                  type="number"
                  value={formData.amountGNF}
                  onChange={(e) => handleNumberChange('amountGNF', e.target.value)}
                  min="0"
                  className={`
                    w-full px-4 py-2.5 rounded-xl
                    border ${errors.amount ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'}
                    bg-white dark:bg-stone-900
                    text-stone-900 dark:text-stone-100
                    focus:ring-2 focus:ring-gold-500 focus:border-gold-500
                  `}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                )}
              </div>
            )}

            {/* Supplier (optional) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                <Building2 className="w-4 h-4" />
                {t('expenses.supplier') || 'Supplier'} ({t('common.optional')})
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleChange('supplierId', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                <option value="">{t('expenses.selectSupplier') || 'Select a supplier'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Inventory Purchase Checkbox */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600">
              <input
                type="checkbox"
                id="isInventoryPurchase"
                checked={formData.isInventoryPurchase}
                onChange={(e) => handleChange('isInventoryPurchase', e.target.checked)}
                className="w-5 h-5 rounded border-stone-300 text-gold-600 focus:ring-gold-500"
              />
              <label htmlFor="isInventoryPurchase" className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200">
                <Package className="w-4 h-4" />
                {t('expenses.isInventoryPurchase') || 'This is an inventory purchase'}
              </label>
            </div>

            {/* Inventory Items (if inventory purchase) */}
            {formData.isInventoryPurchase && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  {t('expenses.inventoryItems') || 'Inventory Items'}
                </h3>
                {errors.expenseItems && (
                  <p className="text-sm text-red-500">{errors.expenseItems}</p>
                )}

                {expenseItems.map((item, index) => {
                  const invItem = inventoryItems.find(i => i.id === item.inventoryItemId)
                  const lineTotal = item.quantity * item.unitCostGNF

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                          {t('expenses.item')} {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExpenseItem(index)}
                          className="p-1 text-red-600 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                            {t('inventory.itemName') || 'Item'}
                          </label>
                          <select
                            value={item.inventoryItemId}
                            onChange={(e) => updateExpenseItem(index, 'inventoryItemId', e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${
                              errors[`item_${index}_id`]
                                ? 'border-red-500'
                                : 'border-stone-300 dark:border-stone-600'
                            } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                          >
                            <option value="">{t('inventory.selectItem') || 'Select item'}</option>
                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {getInventoryItemDisplayName(inv)}
                              </option>
                            ))}
                          </select>
                          {errors[`item_${index}_id`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_id`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                            {t('inventory.quantity') || 'Quantity'}
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateExpenseItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${
                              errors[`item_${index}_qty`]
                                ? 'border-red-500'
                                : 'border-stone-300 dark:border-stone-600'
                            } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                          />
                          {invItem && (
                            <p className="mt-1 text-xs text-stone-500">{invItem.unit}</p>
                          )}
                          {errors[`item_${index}_qty`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_qty`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                            {t('inventory.unitCost') || 'Unit Cost'} (GNF)
                          </label>
                          <input
                            type="number"
                            value={item.unitCostGNF}
                            onChange={(e) => updateExpenseItem(index, 'unitCostGNF', parseFloat(e.target.value) || 0)}
                            min="0"
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${
                              errors[`item_${index}_cost`]
                                ? 'border-red-500'
                                : 'border-stone-300 dark:border-stone-600'
                            } bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100`}
                          />
                          {errors[`item_${index}_cost`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_cost`]}</p>
                          )}
                        </div>
                      </div>

                      {lineTotal > 0 && (
                        <div className="text-right text-sm font-medium text-stone-700 dark:text-stone-300">
                          {t('common.total')}: {formatCurrency(lineTotal)}
                        </div>
                      )}
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={addExpenseItem}
                  className="w-full px-4 py-2 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('expenses.addItem') || 'Add Item'}
                </button>

                {/* Total for inventory items */}
                {expenseItems.length > 0 && (
                  <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                        {t('common.total')}
                      </span>
                      <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {formatCurrency(calculateItemsTotal())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('expenses.description') || 'Description'} ({t('common.optional')})
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('expenses.descriptionPlaceholder') || 'Brief description of the expense'}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                <FileText className="w-4 h-4" />
                {t('expenses.comments') || 'Comments'} ({t('common.optional')})
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 resize-none"
                placeholder={t('expenses.commentsPlaceholder') || 'Any additional notes...'}
              />
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
                  : (t('editor.submitExpense') || 'Submit Expense')
                }
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
