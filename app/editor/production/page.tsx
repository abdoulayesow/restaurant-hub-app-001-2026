'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  AlertTriangle,
  Package,
  Loader2,
  ChefHat,
  FileText,
  Croissant,
  Wheat,
  ArrowLeft,
  CheckCircle,
  Calendar,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canRecordProduction } from '@/lib/roles'
import { ProductCategoryValue } from '@/lib/constants/product-categories'
import { getTodayDateString } from '@/lib/date-utils'

interface InventoryItem {
  id: string
  name: string
  nameFr?: string | null
  category: string
  unit: string
  currentStock: number
  minStock: number
  unitCostGNF: number
}

interface Product {
  id: string
  name: string
  nameFr?: string | null
  category: ProductCategoryValue
  unit: string
  isActive: boolean
}

interface ProductionItemRow {
  productId: string
  productName: string
  productNameFr?: string | null
  quantity: number
  unit: string
}

interface IngredientRow {
  itemId: string
  itemName: string
  quantity: number
  unit: string
  currentStock: number
  minStock: number
  unitCostGNF: number
}

interface AvailabilityResult {
  available: boolean
  estimatedCostGNF: number
  items: Array<{
    itemId: string
    itemName: string
    unit: string
    required: number
    currentStock: number
    afterProduction: number
    unitCostGNF: number
    status: 'ok' | 'low' | 'insufficient'
  }>
}

export default function EditorProductionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  // Form state
  const [date, setDate] = useState('')
  const [productionType, setProductionType] = useState<ProductCategoryValue | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productionItems, setProductionItems] = useState<ProductionItemRow[]>([])
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [notes, setNotes] = useState('')
  const [deductStock, setDeductStock] = useState(true)

  // Data state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // UI state
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
    if (!restaurantLoading && currentRole && !canRecordProduction(currentRole)) {
      router.push('/editor')
    }
  }, [currentRole, restaurantLoading, router])

  // Initialize form with today's date
  useEffect(() => {
    setDate(getTodayDateString())
  }, [])

  // Fetch inventory items
  useEffect(() => {
    const fetchItems = async () => {
      if (!currentRestaurant) return
      setLoadingItems(true)
      try {
        const response = await fetch(`/api/inventory?restaurantId=${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          setInventoryItems(data.items || [])
        }
      } catch (err) {
        console.error('Error fetching inventory:', err)
      } finally {
        setLoadingItems(false)
      }
    }
    fetchItems()
  }, [currentRestaurant])

  // Fetch products when production type changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentRestaurant || !productionType) {
        setProducts([])
        return
      }
      setLoadingProducts(true)
      try {
        const response = await fetch(
          `/api/products?restaurantId=${currentRestaurant.id}&category=${productionType}&activeOnly=true`
        )
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
    setProductionItems([])
  }, [currentRestaurant, productionType])

  // Check availability when ingredients change
  const checkAvailability = useCallback(async () => {
    if (!currentRestaurant || ingredients.length === 0) {
      setAvailability(null)
      return
    }
    setCheckingAvailability(true)
    try {
      const response = await fetch('/api/production/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          ingredients: ingredients.map((ing) => ({
            itemId: ing.itemId,
            quantity: ing.quantity,
          })),
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      }
    } catch (err) {
      console.error('Error checking availability:', err)
    } finally {
      setCheckingAvailability(false)
    }
  }, [currentRestaurant, ingredients])

  // Debounce availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability()
    }, 500)
    return () => clearTimeout(timer)
  }, [ingredients, checkAvailability])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Get display name based on locale
  const getDisplayName = (item: { name: string; nameFr?: string | null }) => {
    return locale === 'fr' && item.nameFr ? item.nameFr : item.name
  }

  // Add ingredient row
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        itemId: '',
        itemName: '',
        quantity: 0,
        unit: '',
        currentStock: 0,
        minStock: 0,
        unitCostGNF: 0,
      },
    ])
  }

  // Update ingredient row
  const updateIngredient = (index: number, updates: Partial<IngredientRow>) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
    )
  }

  // Handle item selection
  const handleItemSelect = (index: number, itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId)
    if (item) {
      updateIngredient(index, {
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unitCostGNF: item.unitCostGNF,
      })
    }
  }

  // Remove ingredient row
  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  // Add product to production items
  const addProductionItem = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    // Check if already added
    if (productionItems.some((item) => item.productId === productId)) return
    setProductionItems([
      ...productionItems,
      {
        productId: product.id,
        productName: product.name,
        productNameFr: product.nameFr,
        quantity: 1,
        unit: product.unit,
      },
    ])
  }

  // Update production item quantity
  const updateProductionItemQuantity = (index: number, quantity: number) => {
    setProductionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    )
  }

  // Remove production item
  const removeProductionItem = (index: number) => {
    setProductionItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Validate and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentRestaurant || !productionType) return
    if (productionItems.length === 0) {
      setSubmitError(t('production.addProductRequired') || 'Please add at least one product')
      return
    }
    if (ingredients.length === 0) {
      setSubmitError(t('production.addIngredientRequired') || 'Please add at least one ingredient')
      return
    }
    // Check if any ingredient is incomplete
    const incompleteIngredient = ingredients.find(
      (ing) => !ing.itemId || ing.quantity <= 0
    )
    if (incompleteIngredient) {
      setSubmitError(t('production.completeIngredients') || 'Please complete all ingredient rows')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          date,
          productionType,
          productionItems: productionItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          ingredientDetails: ingredients.map((ing) => ({
            itemId: ing.itemId,
            itemName: ing.itemName,
            quantity: ing.quantity,
            unit: ing.unit,
            unitCostGNF: ing.unitCostGNF,
          })),
          notes: notes || null,
          deductStock,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit production')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push('/editor')
      }, 2000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit production')
    } finally {
      setSubmitting(false)
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
              {t('editor.productionSubmitted') || 'Production Logged!'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('editor.awaitingApproval') || 'Your production log is pending approval from the owner.'}
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
            {t('editor.logProduction') || 'Log Production'}
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
                {t('production.date') || 'Date'} *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500"
              />
            </div>

            {/* Step 1: Production Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">1</span>
                </div>
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  {t('production.productionType') || 'Production Type'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProductionType('Patisserie')}
                  className={`
                    p-6 rounded-xl border-2 transition-all text-center
                    ${productionType === 'Patisserie'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                    }
                  `}
                >
                  <Croissant className={`w-10 h-10 mx-auto mb-3 ${productionType === 'Patisserie' ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className={`font-medium ${productionType === 'Patisserie' ? 'text-amber-700 dark:text-amber-300' : 'text-stone-700 dark:text-stone-300'}`}>
                    {t('production.patisserie') || 'Pâtisserie'}
                  </span>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {t('production.patisserieDescription') || 'Pastries, croissants, cakes'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProductionType('Boulangerie')}
                  className={`
                    p-6 rounded-xl border-2 transition-all text-center
                    ${productionType === 'Boulangerie'
                      ? 'border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                    }
                  `}
                >
                  <Wheat className={`w-10 h-10 mx-auto mb-3 ${productionType === 'Boulangerie' ? 'text-amber-700' : 'text-stone-400'}`} />
                  <span className={`font-medium ${productionType === 'Boulangerie' ? 'text-amber-800 dark:text-amber-300' : 'text-stone-700 dark:text-stone-300'}`}>
                    {t('production.boulangerie') || 'Boulangerie'}
                  </span>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {t('production.boulangerieDescription') || 'Breads, baguettes'}
                  </p>
                </button>
              </div>
            </div>

            {/* Step 2: Products */}
            {productionType && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-gold-600 dark:text-gold-400">2</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                    {t('production.products') || 'Products Produced'}
                  </h3>
                </div>

                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>{t('production.noProductsAvailable') || 'No products available for this category'}</p>
                  </div>
                ) : (
                  <>
                    {/* Product selector */}
                    <div className="flex flex-wrap gap-2">
                      {products.map((product) => {
                        const isSelected = productionItems.some((item) => item.productId === product.id)
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProductionItem(product.id)}
                            disabled={isSelected}
                            className={`
                              px-3 py-2 rounded-lg text-sm font-medium transition-all
                              ${isSelected
                                ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 cursor-not-allowed'
                                : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                              }
                            `}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4 inline mr-1" />}
                            {getDisplayName(product)}
                          </button>
                        )
                      })}
                    </div>

                    {/* Selected products with quantities */}
                    {productionItems.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {productionItems.map((item, index) => (
                          <div
                            key={item.productId}
                            className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600"
                          >
                            <span className="flex-1 text-sm font-medium text-stone-700 dark:text-stone-200">
                              {locale === 'fr' && item.productNameFr ? item.productNameFr : item.productName}
                            </span>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateProductionItemQuantity(index, parseInt(e.target.value) || 0)}
                              min="1"
                              className="w-20 px-3 py-1 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                            <span className="text-xs text-stone-500 dark:text-stone-400">{item.unit}</span>
                            <button
                              type="button"
                              onClick={() => removeProductionItem(index)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Ingredients */}
            {productionItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-gold-600 dark:text-gold-400">3</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                    {t('production.ingredientsUsed') || 'Ingredients Used'}
                  </h3>
                </div>

                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
                  </div>
                ) : (
                  <>
                    {ingredients.map((ingredient, index) => {
                      const availItem = availability?.items.find((i) => i.itemId === ingredient.itemId)
                      const statusColor = availItem?.status === 'insufficient' ? 'text-red-600' : availItem?.status === 'low' ? 'text-amber-600' : 'text-emerald-600'

                      return (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                              {t('production.ingredient')} {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
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
                                value={ingredient.itemId}
                                onChange={(e) => handleItemSelect(index, e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                              >
                                <option value="">{t('inventory.selectItem') || 'Select item'}</option>
                                {inventoryItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {getDisplayName(item)} ({item.currentStock} {item.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                                {t('inventory.quantity') || 'Quantity'}
                              </label>
                              <input
                                type="number"
                                value={ingredient.quantity || ''}
                                onChange={(e) => updateIngredient(index, { quantity: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.1"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                              />
                              {ingredient.unit && (
                                <p className="mt-1 text-xs text-stone-500">{ingredient.unit}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                                {t('inventory.currentStock') || 'Stock'}
                              </label>
                              <div className={`px-3 py-2 text-sm rounded-lg bg-stone-100 dark:bg-stone-800 ${statusColor}`}>
                                {ingredient.currentStock} {ingredient.unit}
                                {availItem?.status === 'insufficient' && (
                                  <AlertTriangle className="w-4 h-4 inline ml-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={addIngredient}
                      className="w-full px-4 py-2 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t('production.addIngredient') || 'Add Ingredient'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {ingredients.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-gold-600 dark:text-gold-400">4</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                    {t('production.review') || 'Review'}
                  </h3>
                </div>

                {/* Availability summary */}
                {checkingAvailability ? (
                  <div className="flex items-center gap-2 text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t('production.checkingAvailability') || 'Checking availability...'}</span>
                  </div>
                ) : availability && (
                  <div className={`p-4 rounded-xl border ${availability.available ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {availability.available ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${availability.available ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                        {availability.available
                          ? (t('production.stockAvailable') || 'Stock available')
                          : (t('production.insufficientStock') || 'Insufficient stock')}
                      </span>
                    </div>
                    <div className="text-sm text-stone-600 dark:text-stone-400">
                      {t('production.estimatedCost') || 'Estimated cost'}: {formatCurrency(availability.estimatedCostGNF)}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                    <FileText className="w-4 h-4" />
                    {t('production.notes') || 'Notes'} ({t('common.optional')})
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 resize-none"
                    placeholder={t('production.notesPlaceholder') || 'Any notes about this production...'}
                  />
                </div>

                {/* Deduct stock checkbox */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600">
                  <input
                    type="checkbox"
                    id="deductStock"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                    className="w-5 h-5 rounded border-stone-300 text-gold-600 focus:ring-gold-500"
                  />
                  <label htmlFor="deductStock" className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-200">
                    <Package className="w-4 h-4" />
                    {t('production.deductFromStock') || 'Deduct ingredients from inventory'}
                  </label>
                </div>
              </div>
            )}

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
                disabled={submitting || !productionType || productionItems.length === 0 || ingredients.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gold-600 text-white font-medium hover:bg-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    {t('editor.logProduction') || 'Log Production'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
