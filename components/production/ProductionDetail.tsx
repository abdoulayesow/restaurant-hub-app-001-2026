'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChefHat,
  Calendar,
  Clock,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  ArrowRight,
  Croissant,
  Wheat,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { PRODUCTION_TYPE_BUTTON_CLASSES } from '@/lib/constants/product-categories'

interface IngredientDetail {
  itemId: string
  itemName: string
  quantity: number
  unit: string
  unitCostGNF: number
  currentStock?: number
}

interface ProductionData {
  id: string
  productName: string
  productNameFr?: string | null
  quantity: number
  date: string
  estimatedCostGNF?: number | null
  preparationStatus?: string | null
  status: string
  notes?: string | null
  stockDeducted?: boolean
  stockDeductedAt?: string | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
  ingredientDetails: IngredientDetail[]
  productionType?: string | null
}

interface ProductionDetailProps {
  production: ProductionData | unknown
  canEdit: boolean
}

export default function ProductionDetail({ production, canEdit }: ProductionDetailProps) {
  const { t, locale } = useLocale()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Type guard for production data
  const data = production as ProductionData
  if (!data?.id) {
    return (
      <div className="p-6 text-center text-stone-500 dark:text-stone-400">
        {t('production.notFound') || 'Production log not found'}
      </div>
    )
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {t('status.approved') || 'Approved'}
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {t('status.rejected') || 'Rejected'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <Clock className="w-4 h-4" />
            {t('status.pending') || 'Pending'}
          </span>
        )
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!confirm(t('production.confirmDelete') || 'Are you sure you want to delete this production log?')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/production/${data.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/baking/production')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete production log')
      }
    } catch {
      setError('An error occurred while deleting')
    } finally {
      setDeleting(false)
    }
  }

  // Total ingredient cost
  const totalIngredientCost = data.ingredientDetails.reduce(
    (sum, ing) => sum + ing.quantity * ing.unitCostGNF,
    0
  )

  // Production type icon and styling
  const isPatisserie = data.productionType === 'Patisserie'
  const productionTypeClasses = isPatisserie
    ? PRODUCTION_TYPE_BUTTON_CLASSES.Patisserie
    : PRODUCTION_TYPE_BUTTON_CLASSES.Boulangerie

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
        {/* Production Type Banner */}
        <div className={`px-6 py-4 ${productionTypeClasses.selected}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${productionTypeClasses.iconSelected}`}>
                {isPatisserie ? <Croissant className="w-6 h-6" /> : <Wheat className="w-6 h-6" />}
              </div>
              <div>
                <h1 className={`text-xl font-bold ${productionTypeClasses.textSelected}`}>
                  {locale === 'fr' && data.productNameFr ? data.productNameFr : data.productName}
                </h1>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {data.productionType || (t('production.production') || 'Production')}
                </p>
              </div>
            </div>
            {getStatusBadge(data.status)}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('common.date') || 'Date'}
              </p>
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {formatDate(data.date)}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('production.quantity') || 'Quantity'}
              </p>
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {data.quantity} {t('production.units') || 'units'}
              </p>
            </div>
          </div>

          {/* Cost */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
              <Package className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('production.ingredientCost') || 'Ingredient Cost'}
              </p>
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {formatCurrency(data.estimatedCostGNF || totalIngredientCost)} GNF
              </p>
            </div>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
              <Clock className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('common.createdBy') || 'Created By'}
              </p>
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {data.createdByName || t('common.unknown') || 'Unknown'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {formatTime(data.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Stock Deduction Status */}
        {data.stockDeducted !== undefined && (
          <div className="px-6 pb-6">
            <div className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              ${data.stockDeducted
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              }
            `}>
              {data.stockDeducted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('production.stockDeducted') || 'Stock deducted'}
                  {data.stockDeductedAt && (
                    <span className="text-xs opacity-75">
                      ({formatTime(data.stockDeductedAt)})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  {t('production.stockNotDeducted') || 'Stock not yet deducted'}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ingredients Section */}
      {data.ingredientDetails.length > 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('production.ingredientsUsed') || 'Ingredients Used'}
            <span className="text-sm font-normal text-stone-500 dark:text-stone-400">
              ({data.ingredientDetails.length})
            </span>
          </h2>

          <div className="space-y-3">
            {data.ingredientDetails.map((ingredient, index) => (
              <div
                key={ingredient.itemId || index}
                className="flex items-center justify-between p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-sm font-semibold text-stone-600 dark:text-stone-300">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {ingredient.itemName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                      <span>
                        {ingredient.quantity} {t(`units.${ingredient.unit}`) || ingredient.unit}
                      </span>
                      {ingredient.currentStock !== undefined && (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          <span className={
                            ingredient.currentStock < ingredient.quantity * 2
                              ? 'text-amber-600 dark:text-amber-400'
                              : ''
                          }>
                            {t('production.currentStock') || 'Current'}: {ingredient.currentStock.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">
                    {formatCurrency(ingredient.quantity * ingredient.unitCostGNF)} GNF
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    @ {formatCurrency(ingredient.unitCostGNF)}/{t(`units.${ingredient.unit}`) || ingredient.unit}
                  </p>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {t('common.total') || 'Total'}
              </span>
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {formatCurrency(totalIngredientCost)} GNF
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      {data.notes && (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('production.notes') || 'Notes'}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 whitespace-pre-wrap">
            {data.notes}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {canEdit && data.status === 'Pending' && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              border border-red-300 dark:border-red-700
              text-red-600 dark:text-red-400 font-medium
              hover:bg-red-50 dark:hover:bg-red-900/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {t('common.delete') || 'Delete'}
          </button>

          <button
            onClick={() => router.push(`/baking/production?edit=${data.id}`)}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium
              hover:bg-stone-800 dark:hover:bg-stone-100
              transition-all duration-200
            "
          >
            <Edit className="w-4 h-4" />
            {t('common.edit') || 'Edit'}
          </button>
        </div>
      )}
    </div>
  )
}
