'use client'

import { useState, useEffect } from 'react'
import { Calendar, X, Edit3 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProductionLogger } from '@/components/baking/ProductionLogger'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { formatDateForDisplay, formatDateShort, parseDateInput } from '@/lib/date-utils'
import { ProductCategoryValue } from '@/lib/constants/product-categories'

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

interface EditProductionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  production: {
    id: string
    date: string
    productionType?: 'Patisserie' | 'Boulangerie' | null
    notes: string | null
    ingredientDetails: Array<{
      itemId: string
      itemName: string
      quantity: number
      unit: string
      unitCostGNF: number
      currentStock?: number
    }>
    // We need productionItems from the API
    productionItems?: Array<{
      productId: string
      quantity: number
      product: {
        id: string
        name: string
        nameFr?: string | null
        unit: string
      }
    }>
  } | null
}

export function EditProductionModal({
  isOpen,
  onClose,
  onSuccess,
  production,
}: EditProductionModalProps) {
  const { t, locale } = useLocale()
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  if (!production) return null

  // Convert production data to initial values for ProductionLogger
  const initialProductionType: ProductCategoryValue | null = production.productionType || null

  const initialProductionItems: ProductionItemRow[] = production.productionItems?.map(item => ({
    productId: item.product.id,
    productName: item.product.name,
    productNameFr: item.product.nameFr,
    quantity: item.quantity,
    unit: item.product.unit,
  })) || []

  const initialIngredients: IngredientRow[] = production.ingredientDetails.map(ing => ({
    itemId: ing.itemId,
    itemName: ing.itemName,
    quantity: ing.quantity,
    unit: ing.unit,
    currentStock: ing.currentStock || 0,
    minStock: 0, // We don't have this in the detail, but it will be fetched from inventory
    unitCostGNF: ing.unitCostGNF,
  }))

  const date = production.date

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={t('production.editProduction') || 'Edit Production'}
        maxHeight="90vh"
      >
        <div className="p-4 pb-safe">
          {/* Date Display (read-only in edit mode) */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-stone-400 mb-2">
              <Calendar className="w-4 h-4" />
              {t('production.date') || 'Production Date'}
            </label>
            <div className="px-4 py-3 rounded-lg border border-gray-300 dark:border-stone-600 bg-gray-50 dark:bg-stone-800 text-gray-900 dark:text-stone-100 font-medium">
              {formatDateShort(date, locale)}
            </div>
          </div>

          <ProductionLogger
            date={date}
            onSuccess={handleSuccess}
            onCancel={onClose}
            editMode={true}
            productionId={production.id}
            initialProductionType={initialProductionType}
            initialProductionItems={initialProductionItems}
            initialIngredients={initialIngredients}
            initialNotes={production.notes || ''}
          />
        </div>
      </BottomSheet>
    )
  }

  // Desktop modal
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="
            animate-fade-in-up
            w-full max-w-2xl max-h-[90vh] overflow-y-auto
            bg-white dark:bg-stone-900
            rounded-xl shadow-xl
            border border-gray-200 dark:border-stone-700
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 dark:bg-stone-800 p-6 border-b border-gray-200 dark:border-stone-700 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Icon container */}
                <div className="p-3 bg-gray-900 dark:bg-white rounded-lg">
                  <Edit3 className="w-6 h-6 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h2
                    id="modal-title"
                    className="text-xl font-bold text-gray-900 dark:text-stone-100"
                  >
                    {t('production.editProduction') || 'Edit Production'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                    {t('production.editProductionDesc') || 'Modify your production record'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-stone-700 transition-all"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>

            {/* Date Display (read-only) */}
            <div className="mt-5 p-4 rounded-lg bg-white dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-stone-600">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-stone-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-stone-400">
                    {t('production.date') || 'Production Date'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-stone-100 mt-0.5">
                    {formatDateForDisplay(parseDateInput(date), locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <ProductionLogger
              date={date}
              onSuccess={handleSuccess}
              onCancel={onClose}
              editMode={true}
              productionId={production.id}
              initialProductionType={initialProductionType}
              initialProductionItems={initialProductionItems}
              initialIngredients={initialIngredients}
              initialNotes={production.notes || ''}
            />
          </div>
        </div>
      </div>
    </>
  )
}
