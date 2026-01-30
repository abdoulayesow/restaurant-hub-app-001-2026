'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X,
  ArrowRight,
  Package,
  Building2,
  AlertTriangle,
  Check,
  Loader2,
  Search,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { InventoryItem } from './InventoryCard'

interface Restaurant {
  id: string
  name: string
  location?: string | null
}

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onTransferComplete: () => void
  sourceItem?: InventoryItem | null
}

export function TransferModal({
  isOpen,
  onClose,
  onTransferComplete,
  sourceItem,
}: TransferModalProps) {
  const { t } = useLocale()
  const { currentRestaurant, restaurants } = useRestaurant()

  // Form state
  const [selectedSourceItem, setSelectedSourceItem] = useState<InventoryItem | null>(null)
  const [targetRestaurantId, setTargetRestaurantId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [sourceItems, setSourceItems] = useState<InventoryItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Available target restaurants (excluding current)
  const targetRestaurants = useMemo(() => {
    return restaurants.filter((r: Restaurant) => r.id !== currentRestaurant?.id)
  }, [restaurants, currentRestaurant])

  // Fetch source items when modal opens
  useEffect(() => {
    if (isOpen && currentRestaurant) {
      fetchSourceItems()
      // Pre-select item if provided
      if (sourceItem) {
        setSelectedSourceItem(sourceItem)
      }
    }
  }, [isOpen, currentRestaurant, sourceItem])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSourceItem(sourceItem || null)
      setTargetRestaurantId('')
      setQuantity('')
      setReason('')
      setSearchQuery('')
      setErrors({})
      setSuccess(false)
    }
  }, [isOpen, sourceItem])

  const fetchSourceItems = async () => {
    if (!currentRestaurant) return

    setLoadingItems(true)
    try {
      const response = await fetch(
        `/api/inventory?restaurantId=${currentRestaurant.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setSourceItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoadingItems(false)
    }
  }

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return sourceItems
    const query = searchQuery.toLowerCase()
    return sourceItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    )
  }, [sourceItems, searchQuery])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedSourceItem) {
      newErrors.item = t('inventory.transfer.selectItem') || 'Select an item to transfer'
    }

    if (!targetRestaurantId) {
      newErrors.target = t('inventory.transfer.selectTarget') || 'Select target restaurant'
    }

    const qty = parseFloat(quantity)
    if (!quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = t('inventory.transfer.invalidQuantity') || 'Enter a valid quantity'
    } else if (selectedSourceItem && qty > selectedSourceItem.currentStock) {
      newErrors.quantity = t('inventory.transfer.insufficientStock') || 'Insufficient stock'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !currentRestaurant || !selectedSourceItem) return

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceRestaurantId: currentRestaurant.id,
          targetRestaurantId,
          sourceItemId: selectedSourceItem.id,
          quantity: parseFloat(quantity),
          reason: reason || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Transfer failed')
      }

      setSuccess(true)
      setTimeout(() => {
        onTransferComplete()
        onClose()
      }, 1500)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Transfer failed',
      })
    } finally {
      setLoading(false)
    }
  }

  const targetRestaurant = targetRestaurants.find(
    (r: Restaurant) => r.id === targetRestaurantId
  )

  const newSourceStock = selectedSourceItem
    ? selectedSourceItem.currentStock - (parseFloat(quantity) || 0)
    : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {t('inventory.transfer.title')}
                </h2>
                <p className="text-white/80 text-sm">
                  {t('inventory.transfer.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('inventory.transfer.success')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('inventory.transfer.successMessage')}
            </p>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="p-6">
              {/* Restaurant Flow Visualization */}
              <div className="flex items-center justify-center gap-4 mb-6 py-4">
                {/* Source Restaurant */}
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-50 dark:bg-gold-900/20 rounded-xl">
                    <Building2 className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                    <span className="font-medium text-gold-700 dark:text-gold-300">
                      {currentRestaurant?.name || 'Source'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t('inventory.transfer.from')}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 flex items-center justify-center shadow-gold">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Target Restaurant */}
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {targetRestaurant?.name || t('inventory.transfer.selectTarget')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t('inventory.transfer.to')}
                  </p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Item Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('inventory.transfer.selectItem')}
                  </label>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('inventory.searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Item List */}
                  <div className="h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    {loadingItems ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-500">
                        <Package className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">{t('inventory.noItems')}</span>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedSourceItem(item)}
                            disabled={item.currentStock <= 0}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                              selectedSourceItem?.id === item.id
                                ? 'bg-gold-100 dark:bg-gold-900/30 border-2 border-gold-500'
                                : item.currentStock <= 0
                                  ? 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {t(`categories.${item.category}`)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold text-sm ${
                                item.currentStock <= 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : item.currentStock < item.minStock
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-gray-900 dark:text-white'
                              }`}>
                                {item.currentStock.toFixed(1)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {item.unit}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.item && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.item}
                    </p>
                  )}
                </div>

                {/* Right Column - Transfer Details */}
                <div className="space-y-4">
                  {/* Target Restaurant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('inventory.transfer.targetRestaurant')}
                    </label>
                    <select
                      value={targetRestaurantId}
                      onChange={(e) => setTargetRestaurantId(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all ${
                        errors.target
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">
                        {t('inventory.transfer.selectRestaurant')}
                      </option>
                      {targetRestaurants.map((restaurant: Restaurant) => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                          {restaurant.location ? ` - ${restaurant.location}` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.target && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.target}
                      </p>
                    )}
                    {targetRestaurants.length === 0 && (
                      <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                        {t('inventory.transfer.noOtherRestaurants')}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('inventory.transfer.quantity')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                        step="0.1"
                        placeholder="0"
                        className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all ${
                          errors.quantity
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {selectedSourceItem && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500">
                          {selectedSourceItem.unit}
                        </span>
                      )}
                    </div>
                    {selectedSourceItem && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        {t('inventory.transfer.available')}: {selectedSourceItem.currentStock.toFixed(1)} {selectedSourceItem.unit}
                      </p>
                    )}
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('inventory.transfer.reason')}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder={t('inventory.transfer.reasonPlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Preview */}
                  {selectedSourceItem && quantity && parseFloat(quantity) > 0 && (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3">
                        {t('inventory.transfer.preview')}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('inventory.transfer.sourceAfter')}:
                          </span>
                          <span className={`font-semibold ${
                            newSourceStock < 0
                              ? 'text-red-600 dark:text-red-400'
                              : newSourceStock < (selectedSourceItem.minStock || 0)
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-900 dark:text-white'
                          }`}>
                            {newSourceStock.toFixed(1)} {selectedSourceItem.unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('inventory.transfer.targetReceives')}:
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            +{parseFloat(quantity).toFixed(1)} {selectedSourceItem.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.submit}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || targetRestaurants.length === 0}
                  className="px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-gold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      {t('inventory.transfer.confirm')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
