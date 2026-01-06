'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  AlertTriangle,
  Package,
  ArrowRight,
  Loader2,
  ChefHat,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

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
  const { currentBakery } = useBakery()

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
      if (!currentBakery) return

      setLoadingItems(true)
      try {
        const response = await fetch(`/api/inventory?bakeryId=${currentBakery.id}`)
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
  }, [currentBakery])

  // Check availability when ingredients change
  const checkAvailability = useCallback(async () => {
    if (!currentBakery || ingredients.length === 0) {
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
          bakeryId: currentBakery.id,
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
  }, [currentBakery, ingredients])

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
          bakeryId: currentBakery?.id,
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

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="space-y-4">
        <h3
          className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 flex items-center gap-2"
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        >
          <ChefHat className="w-5 h-5" />
          {t('production.productInfo') || 'Product Info'}
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
              {t('production.productName') || 'Product Name'} *
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t('production.productNamePlaceholder') || 'e.g., Croissants'}
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-terracotta-200 dark:border-dark-600
                bg-cream-50 dark:bg-dark-800
                text-terracotta-900 dark:text-cream-100
                focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                placeholder:text-terracotta-400 dark:placeholder:text-cream-500
              "
            />
          </div>

          {/* Product Name (French) */}
          <div>
            <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
              {t('production.productNameFr') || 'French Name'}{' '}
              <span className="text-terracotta-400">({t('common.optional') || 'optional'})</span>
            </label>
            <input
              type="text"
              value={productNameFr}
              onChange={(e) => setProductNameFr(e.target.value)}
              placeholder={t('production.productNameFrPlaceholder') || 'e.g., Croissants'}
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-terracotta-200 dark:border-dark-600
                bg-cream-50 dark:bg-dark-800
                text-terracotta-900 dark:text-cream-100
                focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                placeholder:text-terracotta-400 dark:placeholder:text-cream-500
              "
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="w-32">
          <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
            {t('production.quantity') || 'Quantity'} *
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            className="
              w-full px-4 py-2.5 rounded-xl
              border border-terracotta-200 dark:border-dark-600
              bg-cream-50 dark:bg-dark-800
              text-terracotta-900 dark:text-cream-100
              focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
            "
          />
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 flex items-center gap-2"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            <Package className="w-5 h-5" />
            {t('production.ingredients') || 'Ingredients'}
          </h3>
          <button
            onClick={addIngredient}
            disabled={loadingItems}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5
              text-sm font-medium
              text-terracotta-600 dark:text-cream-300
              hover:bg-cream-100 dark:hover:bg-dark-700
              rounded-lg transition-colors
              disabled:opacity-50
            "
          >
            <Plus className="w-4 h-4" />
            {t('production.addIngredient') || 'Add'}
          </button>
        </div>

        {/* Ingredient Rows */}
        {ingredients.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-terracotta-200 dark:border-dark-600 rounded-xl">
            <Package className="w-10 h-10 mx-auto mb-3 text-terracotta-300 dark:text-dark-600" />
            <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70">
              {t('production.noIngredients') || 'No ingredients added yet'}
            </p>
            <button
              onClick={addIngredient}
              disabled={loadingItems}
              className="
                mt-3 inline-flex items-center gap-1.5 px-4 py-2
                text-sm font-medium
                bg-terracotta-500 text-white
                hover:bg-terracotta-600
                rounded-xl transition-colors
                disabled:opacity-50
              "
            >
              <Plus className="w-4 h-4" />
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
                    p-4 rounded-xl border transition-colors
                    ${
                      availItem?.status === 'insufficient'
                        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        : availItem?.status === 'low'
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-terracotta-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-800'
                    }
                  `}
                >
                  <div className="flex gap-3">
                    {/* Item Select */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-terracotta-600 dark:text-cream-300 mb-1">
                        {t('production.selectIngredient') || 'Ingredient'}
                      </label>
                      <select
                        value={ing.itemId}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="
                          w-full px-3 py-2 rounded-lg
                          border border-terracotta-200 dark:border-dark-600
                          bg-white dark:bg-dark-700
                          text-terracotta-900 dark:text-cream-100
                          text-sm
                          focus:ring-2 focus:ring-terracotta-500
                        "
                      >
                        <option value="">
                          {t('production.selectIngredient') || 'Select...'}
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

                    {/* Quantity */}
                    <div className="w-28">
                      <label className="block text-xs font-medium text-terracotta-600 dark:text-cream-300 mb-1">
                        {t('production.qty') || 'Qty'}
                      </label>
                      <div className="flex items-center gap-1">
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
                            w-full px-3 py-2 rounded-lg
                            border border-terracotta-200 dark:border-dark-600
                            bg-white dark:bg-dark-700
                            text-terracotta-900 dark:text-cream-100
                            text-sm
                            focus:ring-2 focus:ring-terracotta-500
                          "
                        />
                        <span className="text-xs text-terracotta-500 dark:text-cream-400 whitespace-nowrap">
                          {ing.unit}
                        </span>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeIngredient(index)}
                      className="self-end p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label={t('common.remove') || 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock Preview */}
                  {ing.itemId && availItem && (
                    <div className="mt-3 pt-3 border-t border-terracotta-200/50 dark:border-dark-600/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-terracotta-600/70 dark:text-cream-300/70">
                          {t('production.stockPreview') || 'Stock'}:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-terracotta-900 dark:text-cream-100">
                            {availItem.currentStock.toFixed(1)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-terracotta-400" />
                          <span
                            className={`font-medium ${
                              availItem.status === 'insufficient'
                                ? 'text-red-600 dark:text-red-400'
                                : availItem.status === 'low'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {availItem.afterProduction.toFixed(1)}
                          </span>
                          <span className="text-xs text-terracotta-500 dark:text-cream-400">
                            {availItem.unit}
                          </span>
                        </div>
                      </div>
                      {availItem.status === 'insufficient' && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t('production.insufficientStock') || 'Insufficient stock'}
                        </div>
                      )}
                      {availItem.status === 'low' && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 dark:text-amber-400">
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
          {t('production.notes') || 'Notes'}{' '}
          <span className="text-terracotta-400">({t('common.optional') || 'optional'})</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={t('production.notesPlaceholder') || 'Any notes about this production...'}
          className="
            w-full px-4 py-2.5 rounded-xl
            border border-terracotta-200 dark:border-dark-600
            bg-cream-50 dark:bg-dark-800
            text-terracotta-900 dark:text-cream-100
            focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
            placeholder:text-terracotta-400 dark:placeholder:text-cream-500
            resize-none
          "
        />
      </div>

      {/* Summary */}
      {ingredients.length > 0 && (
        <div className="p-4 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10 border border-terracotta-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-terracotta-700 dark:text-cream-200">
              {t('production.estimatedCost') || 'Estimated Ingredient Cost'}
            </span>
            <span className="text-xl font-bold text-terracotta-900 dark:text-cream-100">
              {checkingAvailability ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `${formatCurrency(availability?.estimatedCostGNF || estimatedCost)} GNF`
              )}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={submitting}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              border border-terracotta-200 dark:border-dark-600
              text-terracotta-700 dark:text-cream-300
              hover:bg-cream-100 dark:hover:bg-dark-800
              transition-colors
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
            flex-1 px-4 py-2.5 rounded-xl
            bg-terracotta-500 text-white font-medium
            hover:bg-terracotta-600
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            inline-flex items-center justify-center gap-2
          "
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.saving') || 'Saving...'}
            </>
          ) : (
            t('production.logProduction') || 'Log Production'
          )}
        </button>
      </div>
    </div>
  )
}

export default ProductionLogger
