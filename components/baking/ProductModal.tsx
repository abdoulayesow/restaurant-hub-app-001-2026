'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingBag, Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  PRODUCT_CATEGORIES,
  type ProductCategoryValue,
} from '@/lib/constants/product-categories'
import type { Product } from './ProductsTable'

// Product units
const PRODUCT_UNITS = [
  { key: 'piece', labelKey: 'units.piece' },
  { key: 'loaf', labelKey: 'units.loaf' },
  { key: 'dozen', labelKey: 'units.dozen' },
] as const

export interface ProductFormData {
  name: string
  nameFr: string | null
  category: ProductCategoryValue
  unit: string
  sortOrder: number
  isActive?: boolean
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProductFormData) => Promise<void>
  product?: Product | null
  isLoading?: boolean
}

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  isLoading = false,
}: ProductModalProps) {
  const { t } = useLocale()
  const isEditMode = !!product

  const [formData, setFormData] = useState({
    name: '',
    nameFr: '',
    category: '' as ProductCategoryValue | '',
    unit: 'piece',
    sortOrder: 0,
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name,
          nameFr: product.nameFr || '',
          category: product.category,
          unit: product.unit,
          sortOrder: product.sortOrder,
          isActive: product.isActive,
        })
      } else {
        setFormData({
          name: '',
          nameFr: '',
          category: '',
          unit: 'piece',
          sortOrder: 0,
          isActive: true,
        })
      }
      setErrors({})
    }
  }, [isOpen, product])

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
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = t('errors.invalidValue')
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
      category: formData.category as ProductCategoryValue,
      unit: formData.unit,
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-stone-800 shadow-xl transition-all">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {isEditMode
                  ? t('production.products.editProduct')
                  : t('production.products.addProduct')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('production.products.productName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Croissant"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 ${
                    errors.name
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-rose-500">{errors.name}</p>
                )}
              </div>

              {/* French Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('production.products.productNameFr')}
                  <span className="ml-2 text-xs text-stone-500">({t('common.optional')})</span>
                </label>
                <input
                  type="text"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  placeholder="e.g., Croissant"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('inventory.category')} *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategoryValue })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 ${
                    errors.category
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                >
                  <option value="">{t('production.products.selectCategory')}</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t(`production.${cat.value.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-rose-500">{errors.category}</p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('production.products.unit')} *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 ${
                    errors.unit
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                >
                  <option value="">{t('production.products.selectUnit')}</option>
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit.key} value={unit.key}>
                      {t(unit.labelKey)}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="mt-1 text-sm text-rose-500">{errors.unit}</p>
                )}
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('production.products.sortOrder')}
                  <span className="ml-2 text-xs text-stone-500">({t('common.optional')})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {t('production.products.sortOrderHint')}
                </p>
              </div>

              {/* Active Status (edit mode only) */}
              {isEditMode && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-stone-700 dark:text-stone-300">
                    {t('production.products.active')}
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
