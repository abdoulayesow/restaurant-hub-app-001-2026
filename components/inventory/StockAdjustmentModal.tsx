'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { StockStatusBadge, getStockStatus } from './StockStatusBadge'

type MovementType = 'Purchase' | 'Usage' | 'Waste' | 'Adjustment'

interface InventoryItemMinimal {
  name: string
  nameFr?: string | null
  currentStock: number
  minStock: number
  unit: string
  unitCostGNF: number
  stockStatus: 'critical' | 'low' | 'ok'
}

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdjust: (data: { type: MovementType; quantity: number; reason?: string; unitCost?: number }) => Promise<void>
  item: InventoryItemMinimal | null
  isLoading?: boolean
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  onAdjust,
  item,
  isLoading = false,
}: StockAdjustmentModalProps) {
  const { t, locale } = useLocale()

  const [formData, setFormData] = useState({
    type: 'Adjustment' as MovementType,
    quantity: 0,
    reason: '',
    unitCost: 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        type: 'Adjustment',
        quantity: 0,
        reason: '',
        unitCost: item.unitCostGNF,
      })
      setErrors({})
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

  const movementTypes: { key: MovementType; labelKey: string; description: string }[] = [
    { key: 'Purchase', labelKey: 'inventory.purchase', description: '+' },
    { key: 'Usage', labelKey: 'inventory.usage', description: '-' },
    { key: 'Waste', labelKey: 'inventory.waste', description: '-' },
    { key: 'Adjustment', labelKey: 'inventory.adjustment', description: '+/-' },
  ]

  // Calculate preview of new stock
  const calculateNewStock = (): number => {
    const qty = Math.abs(formData.quantity)
    if (formData.type === 'Purchase') {
      return item.currentStock + qty
    } else if (formData.type === 'Usage' || formData.type === 'Waste') {
      return item.currentStock - qty
    } else {
      // Adjustment can be positive or negative
      return item.currentStock + formData.quantity
    }
  }

  const newStock = calculateNewStock()
  const newStatus = getStockStatus(newStock, item.minStock)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.quantity === 0) {
      newErrors.quantity = t('errors.required')
    }

    // Check for negative resulting stock
    if (newStock < 0) {
      newErrors.quantity = t('inventory.insufficientStock')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    await onAdjust({
      type: formData.type,
      quantity: formData.quantity,
      reason: formData.reason.trim() || undefined,
      unitCost: formData.type === 'Purchase' ? formData.unitCost : undefined,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const getItemName = () => {
    if (locale === 'fr' && item.nameFr) {
      return item.nameFr
    }
    return item.name
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('inventory.adjust')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Item Info */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{getItemName()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('inventory.currentStock')}: {item.currentStock} {t(`units.${item.unit}`)}
                </p>
              </div>
              <StockStatusBadge status={item.stockStatus} />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('inventory.movement')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {movementTypes.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.key })}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.type === type.key
                        ? 'border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400 dark:border-gold-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                      {type.description}
                    </span>
                    {t(type.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.quantity')} ({t(`units.${item.unit}`)})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: formData.quantity - 1 })}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className={`flex-1 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.quantity
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  step="0.01"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            {/* Unit Cost (only for Purchase) */}
            {formData.type === 'Purchase' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.unitCost')} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                  min="0"
                  step="1"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.reason')}
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                rows={2}
                placeholder={t('inventory.reasonPlaceholder')}
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('inventory.newStock')}:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${newStock < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {newStock.toFixed(2)} {t(`units.${item.unit}`)}
                  </span>
                  <StockStatusBadge status={newStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || newStock < 0}
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
