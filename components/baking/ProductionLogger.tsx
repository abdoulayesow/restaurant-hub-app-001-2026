'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Trash2,
  AlertTriangle,
  Package,
  ArrowRight,
  Loader2,
  ChefHat,
  FileText,
  Sparkles,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

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

interface ProductionLoggerProps {
  date?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductionLogger({
  date,
  onSuccess,
  onCancel,
}: ProductionLoggerProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()

  // Form state
  const [productName, setProductName] = useState('')
  const [productNameFr, setProductNameFr] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])

  // UI state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch inventory items for the selector
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate estimated cost
  const estimatedCost = ingredients.reduce(
    (sum, ing) => sum + ing.quantity * ing.unitCostGNF,
    0
  )

  // Submit production log
  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!productName.trim()) {
      setError(t('validation.required') || 'Product name is required')
      return
    }

    if (quantity < 1) {
      setError(t('production.quantityRequired') || 'Quantity must be at least 1')
      return
    }

    if (ingredients.length === 0) {
      setError(t('production.ingredientsRequired') || 'Add at least one ingredient')
      return
    }

    // Check for incomplete ingredients
    const incompleteIngredient = ingredients.find(
      (ing) => !ing.itemId || ing.quantity <= 0
    )
    if (incompleteIngredient) {
      setError(
        t('production.completeIngredients') ||
          'Please complete all ingredient entries'
      )
      return
    }

    // Check availability
    if (availability && !availability.available) {
      setError(
        t('production.insufficientStock') ||
          'Insufficient stock for one or more ingredients'
      )
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: currentRestaurant?.id,
          date: date || new Date().toISOString(),
          productName,
          productNameFr: productNameFr || null,
          quantity,
          ingredients: ingredients.map((ing) => ing.itemName),
          ingredientDetails: ingredients.map((ing) => ({
            itemId: ing.itemId,
            itemName: ing.itemName,
            quantity: ing.quantity,
            unit: ing.unit,
            unitCostGNF: ing.unitCostGNF,
          })),
          notes: notes || null,
          deductStock: true,
        }),
      })

      if (response.ok) {
        onSuccess?.()
      } else {
        const data = await response.json()
        setError(data.error || t('errors.generic') || 'Failed to save production log')
      }
    } catch (err) {
      console.error('Error submitting production:', err)
      setError(t('errors.generic') || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Group inventory items by category
  const itemsByCategory = inventoryItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, InventoryItem[]>
  )

  // Track previous cost for animation
  const prevCostRef = useRef(estimatedCost)
  const [costAnimating, setCostAnimating] = useState(false)

  useEffect(() => {
    if (prevCostRef.current !== estimatedCost && estimatedCost > 0) {
      setCostAnimating(true)
      const timer = setTimeout(() => setCostAnimating(false), 300)
      prevCostRef.current = estimatedCost
      return () => clearTimeout(timer)
    }
  }, [estimatedCost])

  // Get status classes for ingredient card
  const getIngredientStatusClasses = (status?: 'ok' | 'low' | 'insufficient') => {
    switch (status) {
      case 'insufficient':
        return 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
      case 'low':
        return 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20'
      default:
        return 'border-gray-200 dark:border-stone-600 bg-gray-50/50 dark:bg-stone-800/50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Product Info */}
      <div className="space-y-4">
        {/* Section Header with number indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
            {t('production.productInfo') || 'Product Info'}
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-stone-700" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
              {t('production.productName') || 'Product Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t('production.productNamePlaceholder') || 'e.g., Croissants'}
              className="
                w-full px-4 py-3 rounded-lg
                border border-gray-300 dark:border-stone-600
                bg-white dark:bg-stone-700
                text-gray-900 dark:text-stone-100
                focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                placeholder:text-gray-400 dark:placeholder:text-stone-500
                transition-all duration-200
                hover:border-gray-400 dark:hover:border-stone-500
              "
            />
          </div>

          {/* Product Name (French) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
              {t('production.productNameFr') || 'French Name'}{' '}
              <span className="text-gray-400 dark:text-stone-500 normal-case font-normal">({t('common.optional') || 'optional'})</span>
            </label>
            <input
              type="text"
              value={productNameFr}
              onChange={(e) => setProductNameFr(e.target.value)}
              placeholder={t('production.productNameFrPlaceholder') || 'e.g., Croissants'}
              className="
                w-full px-4 py-3 rounded-lg
                border border-gray-300 dark:border-stone-600
                bg-white dark:bg-stone-700
                text-gray-900 dark:text-stone-100
                focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                placeholder:text-gray-400 dark:placeholder:text-stone-500
                transition-all duration-200
                hover:border-gray-400 dark:hover:border-stone-500
              "
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="w-40">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
            {t('production.quantity') || 'Quantity'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="
                w-full px-4 py-3 pr-16 rounded-lg
                border border-gray-300 dark:border-stone-600
                bg-white dark:bg-stone-700
                text-gray-900 dark:text-stone-100 font-semibold text-lg
                focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                transition-all duration-200
                hover:border-gray-400 dark:hover:border-stone-500
              "
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-100 dark:bg-stone-600 text-xs font-medium text-gray-600 dark:text-stone-300">
              {t('production.units') || 'units'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Ingredients */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">
            2
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
            {t('production.ingredients') || 'Ingredients'}
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-stone-700" />
          <button
            onClick={addIngredient}
            disabled={loadingItems}
            className="
              inline-flex items-center gap-1.5 px-4 py-2
              text-sm font-semibold
              text-gray-700 dark:text-stone-300
              bg-gray-100 dark:bg-stone-700
              hover:bg-gray-200 dark:hover:bg-stone-600
              border border-gray-300 dark:border-stone-600
              rounded-lg transition-all duration-200
              disabled:opacity-50
            "
          >
            <Plus className="w-4 h-4" />
            {t('production.addIngredient') || 'Add'}
          </button>
        </div>

        {/* Ingredient Cards */}
        {ingredients.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center rounded-xl bg-gray-50 dark:bg-stone-800/50 border-2 border-dashed border-gray-300 dark:border-stone-600">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-stone-700 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400 dark:text-stone-500" />
            </div>

            <p className="text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
              {t('production.noIngredients') || 'No ingredients added yet'}
            </p>
            <p className="text-xs text-gray-500 dark:text-stone-400 mb-5">
              {t('production.addIngredientHint') || 'Start by adding your first ingredient'}
            </p>

            <button
              onClick={addIngredient}
              disabled={loadingItems}
              className="
                inline-flex items-center gap-2 px-5 py-2.5
                bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold
                hover:bg-gray-800 dark:hover:bg-gray-100
                transition-all duration-300
                disabled:opacity-50
              "
            >
              <Sparkles className="w-4 h-4" />
              {t('production.addFirstIngredient') || 'Add Ingredient'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ingredients.map((ing, index) => {
              const availItem = availability?.items.find((i) => i.itemId === ing.itemId)

              return (
                <div
                  key={index}
                  className={`
                    group relative p-5 rounded-xl border transition-all duration-300
                    ${getIngredientStatusClasses(availItem?.status)}
                    hover:shadow-md
                  `}
                >
                  {/* Ingredient Number Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>

                  {/* Ingredient Selector */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
                      {t('production.selectIngredient') || 'Ingredient'}
                    </label>
                    <select
                      value={ing.itemId}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="
                        w-full px-4 py-3 rounded-lg
                        border border-gray-300 dark:border-stone-600
                        bg-white dark:bg-stone-700
                        text-gray-900 dark:text-stone-100
                        focus:ring-2 focus:ring-gray-500
                        transition-all duration-200
                        hover:border-gray-400 dark:hover:border-stone-500
                        cursor-pointer
                      "
                    >
                      <option value="">
                        {t('production.selectIngredient') || 'Select an ingredient...'}
                      </option>
                      {Object.entries(itemsByCategory).map(([category, items]) => (
                        <optgroup key={category} label={category}>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {locale === 'fr' && item.nameFr ? item.nameFr : item.name}{' '}
                              ({item.currentStock} {item.unit})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Row with Unit Badge */}
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-[200px]">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
                        {t('production.qty') || 'Quantity'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={ing.quantity || ''}
                          onChange={(e) =>
                            updateIngredient(index, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          min={0}
                          step={0.1}
                          className="
                            w-full pl-4 pr-16 py-3 rounded-lg
                            border border-gray-300 dark:border-stone-600
                            bg-white dark:bg-stone-700
                            text-gray-900 dark:text-stone-100 font-semibold
                            focus:ring-2 focus:ring-gray-500
                            transition-all duration-200
                            hover:border-gray-400 dark:hover:border-stone-500
                          "
                        />
                        {ing.unit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-100 dark:bg-stone-600 text-xs font-medium text-gray-600 dark:text-stone-300">
                            {ing.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove button - always visible on mobile, hover on desktop */}
                    <button
                      onClick={() => removeIngredient(index)}
                      className="
                        p-3 rounded-lg
                        bg-red-50 dark:bg-red-900/20 text-red-500
                        hover:bg-red-100 dark:hover:bg-red-900/40
                        transition-all duration-200
                        sm:opacity-0 sm:group-hover:opacity-100
                      "
                      aria-label={t('common.remove') || 'Remove'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Stock Preview */}
                  {ing.itemId && availItem && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-stone-600">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-stone-400">
                          {t('production.stockPreview') || 'Stock Impact'}
                        </span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-stone-200">
                            {availItem.currentStock.toFixed(1)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span
                            className={`font-bold px-2.5 py-1 rounded-lg ${
                              availItem.status === 'insufficient'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : availItem.status === 'low'
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}
                          >
                            {availItem.afterProduction.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-stone-400">
                            {availItem.unit}
                          </span>
                        </div>
                      </div>
                      {availItem.status === 'insufficient' && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t('production.insufficientStock') || 'Insufficient stock'}
                        </div>
                      )}
                      {availItem.status === 'low' && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t('production.willBeLowStock') || 'Will be below minimum'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 3: Notes */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">
            3
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
            {t('production.notes') || 'Notes'}
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-stone-500">({t('common.optional') || 'optional'})</span>
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-stone-700" />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-4">
            <FileText className="w-4 h-4 text-gray-300 dark:text-stone-600" />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('production.notesPlaceholder') || 'Any notes about this production...'}
            className="
              w-full pl-11 pr-4 py-3 rounded-lg
              border border-gray-300 dark:border-stone-600
              bg-white dark:bg-stone-700
              text-gray-900 dark:text-stone-100
              focus:ring-2 focus:ring-gray-500 focus:border-gray-500
              placeholder:text-gray-400 dark:placeholder:text-stone-500
              resize-none transition-all duration-200
              hover:border-gray-400 dark:hover:border-stone-500
            "
          />
        </div>
      </div>

      {/* Summary Section */}
      {ingredients.length > 0 && (
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-stone-800/50 border border-gray-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-1">
                {t('production.estimatedCost') || 'Estimated Cost'}
              </p>
              <p className="text-sm text-gray-500 dark:text-stone-400">
                {ingredients.length} {ingredients.length === 1 ? t('production.ingredient') || 'ingredient' : t('production.ingredients') || 'ingredients'}
              </p>
            </div>

            <div className="text-right">
              {checkingAvailability ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">{t('common.calculating') || 'Calculating...'}</span>
                </div>
              ) : (
                <>
                  <p className={`text-3xl font-bold text-gray-900 dark:text-stone-100 ${costAnimating ? 'animate-cost-pulse' : ''}`}>
                    {formatCurrency(availability?.estimatedCostGNF || estimatedCost)}
                  </p>
                  <p className="text-sm font-medium text-gray-500 dark:text-stone-400">GNF</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State - Enhanced */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-fade-in-up">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={submitting}
            className="
              px-6 py-3 rounded-lg
              border border-gray-300 dark:border-stone-600
              text-gray-700 dark:text-stone-300 font-medium
              hover:bg-gray-100 dark:hover:bg-stone-700
              transition-all duration-200
              disabled:opacity-50
            "
          >
            {t('common.cancel') || 'Cancel'}
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || (availability !== null && !availability.available)}
          className="
            flex-1 px-6 py-3.5 rounded-lg font-semibold
            bg-gray-900 dark:bg-white text-white dark:text-gray-900
            hover:bg-gray-800 dark:hover:bg-gray-100
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            inline-flex items-center justify-center gap-2
          "
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.saving') || 'Saving...'}
            </>
          ) : (
            <>
              <ChefHat className="w-5 h-5" />
              {t('production.logProduction') || 'Log Production'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ProductionLogger
