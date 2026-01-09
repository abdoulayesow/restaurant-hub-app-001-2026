'use client'

import { useState, useEffect } from 'react'
import { X, Package, Loader2 } from 'lucide-react'
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-cream-50 dark:bg-dark-900 rounded-2xl warm-shadow-lg grain-overlay w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50 dark:bg-dark-900 z-10 flex items-center justify-between p-6 border-b border-terracotta-500/15 dark:border-terracotta-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
              <Package className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" />
            </div>
            <h2
              className="text-xl font-semibold text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {isEditMode ? t('common.edit') : t('inventory.addItem')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream-200 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-terracotta-600 dark:text-cream-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
                {t('inventory.itemName')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`
                  w-full px-4 py-2.5 rounded-xl
                  border bg-cream-50 dark:bg-dark-800
                  text-terracotta-900 dark:text-cream-100
                  focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                  placeholder:text-terracotta-400 dark:placeholder:text-cream-500
                  transition-colors
                  ${errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-terracotta-200 dark:border-dark-600'
                  }
                `}
                placeholder="e.g., All-purpose flour"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* French Name */}
            <div>
              <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
                {t('inventory.itemName')} (FR) <span className="text-terracotta-400 font-normal">({t('common.optional') || 'optional'})</span>
              </label>
              <input
                type="text"
                value={formData.nameFr}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                className="
                  w-full px-4 py-2.5 rounded-xl
                  border border-terracotta-200 dark:border-dark-600
                  bg-cream-50 dark:bg-dark-800
                  text-terracotta-900 dark:text-cream-100
                  focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                  placeholder:text-terracotta-400 dark:placeholder:text-cream-500
                  transition-colors
                "
                placeholder="e.g., Farine tout usage"
              />
            </div>

            {/* Category & Unit Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
                  {t('inventory.category')} *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`
                    w-full px-4 py-2.5 rounded-xl appearance-none
                    border bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                    transition-colors
                    ${errors.category
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-terracotta-200 dark:border-dark-600'
                    }
                  `}
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
                <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
                  {t('inventory.unit')} *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`
                    w-full px-4 py-2.5 rounded-xl appearance-none
                    border bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                    transition-colors
                    ${errors.unit
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-terracotta-200 dark:border-dark-600'
                    }
                  `}
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

            {/* Section Divider - Stock Levels */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-terracotta-700 dark:text-cream-200 mb-4 pb-2 border-b border-terracotta-200/30 dark:border-dark-600/30">
                {t('inventory.stockLevels') || 'Stock Levels'}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1.5">
                    {t('inventory.currentStock')}
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="
                      w-full px-4 py-2.5 rounded-xl
                      border border-terracotta-200 dark:border-dark-600
                      bg-cream-50 dark:bg-dark-800
                      text-terracotta-900 dark:text-cream-100
                      focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                      transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    min="0"
                    step="0.01"
                    disabled={isEditMode}
                  />
                  {isEditMode && (
                    <p className="mt-1 text-xs text-terracotta-500 dark:text-cream-400">
                      {t('inventory.useAdjustToChangeStock')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1.5">
                    {t('inventory.minStock')}
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                    className="
                      w-full px-4 py-2.5 rounded-xl
                      border border-terracotta-200 dark:border-dark-600
                      bg-cream-50 dark:bg-dark-800
                      text-terracotta-900 dark:text-cream-100
                      focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                      transition-colors
                    "
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1.5">
                    {t('inventory.reorderPoint')}
                  </label>
                  <input
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) || 0 })}
                    className="
                      w-full px-4 py-2.5 rounded-xl
                      border border-terracotta-200 dark:border-dark-600
                      bg-cream-50 dark:bg-dark-800
                      text-terracotta-900 dark:text-cream-100
                      focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                      transition-colors
                    "
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Cost & Expiry Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
                  {t('inventory.unitCost')} (GNF)
                </label>
                <input
                  type="number"
                  value={formData.unitCostGNF}
                  onChange={(e) => setFormData({ ...formData, unitCostGNF: parseFloat(e.target.value) || 0 })}
                  className="
                    w-full px-4 py-2.5 rounded-xl
                    border border-terracotta-200 dark:border-dark-600
                    bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                    transition-colors
                  "
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
                  {t('inventory.expiryDays')} <span className="text-terracotta-400 font-normal">({t('common.optional') || 'optional'})</span>
                </label>
                <input
                  type="number"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                  className="
                    w-full px-4 py-2.5 rounded-xl
                    border border-terracotta-200 dark:border-dark-600
                    bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500
                    placeholder:text-terracotta-400 dark:placeholder:text-cream-500
                    transition-colors
                  "
                  min="1"
                  placeholder={t('common.optional') || 'Optional'}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-cream-50 dark:bg-dark-900 flex items-center justify-end gap-3 p-6 border-t border-terracotta-500/15 dark:border-terracotta-400/20">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2.5 rounded-xl
                border border-terracotta-200 dark:border-dark-600
                text-terracotta-700 dark:text-cream-300
                hover:bg-cream-100 dark:hover:bg-dark-800
                font-medium transition-colors
              "
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="
                px-4 py-2.5 rounded-xl
                bg-terracotta-500 text-white font-medium
                hover:bg-terracotta-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                inline-flex items-center gap-2
              "
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
