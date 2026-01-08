'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { INVENTORY_CATEGORIES } from './CategoryFilter'
import { InventoryItem } from './InventoryTable'

// Measurement units matching the technical spec
const MEASUREMENT_UNITS = [
  { key: 'kg', labelKey: 'units.kg' },
  { key: 'g', labelKey: 'units.g' },
  { key: 'L', labelKey: 'units.L' },
  { key: 'mL', labelKey: 'units.mL' },
  { key: 'pieces', labelKey: 'units.pieces' },
  { key: 'dozen', labelKey: 'units.dozen' },
  { key: 'bags', labelKey: 'units.bags' },
  { key: 'boxes', labelKey: 'units.boxes' },
] as const

interface AddEditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<InventoryItem>) => Promise<void>
  item?: InventoryItem | null
  isLoading?: boolean
}

export function AddEditItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  isLoading = false,
}: AddEditItemModalProps) {
  const { t } = useLocale()
  const isEditMode = !!item

  const [formData, setFormData] = useState({
    name: '',
    nameFr: '',
    category: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    reorderPoint: 0,
    unitCostGNF: 0,
    expiryDays: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          name: item.name,
          nameFr: item.nameFr || '',
          category: item.category,
          unit: item.unit,
          currentStock: item.currentStock,
          minStock: item.minStock,
          reorderPoint: item.reorderPoint,
          unitCostGNF: item.unitCostGNF,
          expiryDays: item.expiryDays?.toString() || '',
        })
      } else {
        setFormData({
          name: '',
          nameFr: '',
          category: '',
          unit: '',
          currentStock: 0,
          minStock: 0,
          reorderPoint: 0,
          unitCostGNF: 0,
          expiryDays: '',
        })
      }
      setErrors({})
    }
  }, [isOpen, item])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('errors.required')
    }
    if (!formData.category) {
      newErrors.category = t('errors.required')
    }
    if (!formData.unit) {
      newErrors.unit = t('errors.required')
    }
    if (formData.currentStock < 0) {
      newErrors.currentStock = t('errors.invalidValue')
    }
    if (formData.minStock < 0) {
      newErrors.minStock = t('errors.invalidValue')
    }
    if (formData.unitCostGNF < 0) {
      newErrors.unitCostGNF = t('errors.invalidValue')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    await onSave({
      name: formData.name.trim(),
      nameFr: formData.nameFr.trim() || null,
      category: formData.category,
      unit: formData.unit,
      currentStock: formData.currentStock,
      minStock: formData.minStock,
      reorderPoint: formData.reorderPoint,
      unitCostGNF: formData.unitCostGNF,
      expiryDays: formData.expiryDays ? parseInt(formData.expiryDays, 10) : null,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? t('common.edit') : t('inventory.addItem')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.itemName')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., All-purpose flour"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* French Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.itemName')} (FR)
              </label>
              <input
                type="text"
                value={formData.nameFr}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="e.g., Farine tout usage"
              />
            </div>

            {/* Category & Unit Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.category')} *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.category
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">{t('inventory.selectCategory')}</option>
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {t(cat.labelKey)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.unit')} *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.unit
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">{t('inventory.selectUnit')}</option>
                  {MEASUREMENT_UNITS.map((unit) => (
                    <option key={unit.key} value={unit.key}>
                      {t(unit.labelKey)}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
                )}
              </div>
            </div>

            {/* Stock Levels Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.currentStock')}
                </label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                  min="0"
                  step="0.01"
                  disabled={isEditMode} // Can't change stock directly in edit mode
                />
                {isEditMode && (
                  <p className="mt-1 text-xs text-gray-500">{t('inventory.useAdjustToChangeStock')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.minStock')}
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.reorderPoint')}
                </label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Cost & Expiry Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.unitCost')} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.unitCostGNF}
                  onChange={(e) => setFormData({ ...formData, unitCostGNF: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.expiryDays')}
                </label>
                <input
                  type="number"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
                  min="1"
                  placeholder="Optional"
                />
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
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
