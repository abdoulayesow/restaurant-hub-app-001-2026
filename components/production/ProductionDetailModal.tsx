'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X,
  Package,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  Utensils,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProductionStatus, SubmissionStatus } from '@prisma/client'

interface ProductionDetailModalProps {
  production: {
    id: string
    productName: string
    productNameFr: string | null
    quantity: number
    date: string
    estimatedCostGNF: number | null
    preparationStatus: ProductionStatus
    status: SubmissionStatus
    notes: string | null
    stockDeducted: boolean
    stockDeductedAt: string | null
    createdByName: string | null
    createdAt: string
    updatedAt: string
    ingredientDetails: Array<{
      itemId: string
      itemName: string
      quantity: number
      unit: string
      unitCostGNF: number
      currentStock?: number
    }>
  } | null
  isOpen: boolean
  onClose: () => void
  isManager: boolean
  onStatusChange?: (productionId: string, newStatus: ProductionStatus) => Promise<void>
  onUpdate?: () => void
}

export function ProductionDetailModal({
  production,
  isOpen,
  onClose,
  isManager,
  onStatusChange,
  onUpdate,
}: ProductionDetailModalProps) {
  const { t, locale } = useLocale()
  const [changing, setChanging] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients'>('details')

  if (!isOpen || !production) return null

  const productName =
    locale === 'fr' && production.productNameFr
      ? production.productNameFr
      : production.productName

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-GN') + ' GNF'
  }

  // Status color configurations
  const getStatusConfig = (status: ProductionStatus) => {
    switch (status) {
      case 'Planning':
        return {
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          icon: Clock,
          border: 'border-l-blue-500 dark:border-l-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
        }
      case 'Complete':
        return {
          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          icon: CheckCircle,
          border: 'border-l-emerald-500 dark:border-l-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-600 dark:bg-stone-700 dark:text-stone-400',
          icon: Clock,
          border: 'border-l-gray-500 dark:border-l-gray-400',
          bg: 'bg-gray-50 dark:bg-stone-700/50',
        }
    }
  }

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'Approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-stone-700 dark:text-stone-400'
    }
  }

  const handleStatusChange = async (newStatus: ProductionStatus) => {
    if (!onStatusChange) return

    setChanging(true)
    try {
      await onStatusChange(production.id, newStatus)
      onUpdate?.()
    } finally {
      setChanging(false)
    }
  }

  const statusConfig = getStatusConfig(production.preparationStatus)
  const StatusIcon = statusConfig.icon

  const totalCost =
    production.ingredientDetails?.reduce(
      (sum, ing) => sum + ing.quantity * ing.unitCostGNF,
      0
    ) || production.estimatedCostGNF || 0

  const ingredientCount = production.ingredientDetails?.length || 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="animate-modal-entrance w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-xl relative">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-stone-800 z-10 border-b border-gray-200 dark:border-stone-700">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl ${statusConfig.bg} border-l-4 ${statusConfig.border}`}>
                    <Utensils className="w-6 h-6 text-gray-600 dark:text-stone-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-stone-100 truncate">
                      {productName}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {t(`production.status${production.preparationStatus}`) || production.preparationStatus}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(production.status)}`}>
                        {t(`common.${production.status.toLowerCase()}`) || production.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-t border-gray-100 dark:border-stone-700/50">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'details'
                      ? 'border-gray-900 dark:border-white text-gray-900 dark:text-stone-100'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {t('debts.details') || 'Details'}
                </button>
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'ingredients'
                      ? 'border-gray-900 dark:border-white text-gray-900 dark:text-stone-100'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {t('production.ingredients') || 'Ingredients'} ({ingredientCount})
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-2">
                      <Package className="w-4 h-4" />
                      {t('production.quantity') || 'Quantity'}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                      {production.quantity}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      {t('production.date') || 'Date'}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-stone-100">
                      {formatDate(production.date)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium mb-2">
                      <DollarSign className="w-4 h-4" />
                      {t('production.estimatedCost') || 'Estimated Cost'}
                    </div>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      {formatCurrency(totalCost)}
                    </p>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="bg-gray-50 dark:bg-stone-700/50 rounded-xl p-4 border border-gray-200 dark:border-stone-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-stone-400 mb-0.5">
                          {t('production.createdBy') || 'Created By'}
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                          {production.createdByName || t('common.unknown') || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-stone-400 mb-0.5">
                          {t('common.createdAt') || 'Created'}
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                          {formatDateTime(production.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Deduction Status */}
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    production.stockDeducted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                  }`}
                >
                  {production.stockDeducted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        production.stockDeducted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {production.stockDeducted
                        ? t('production.stockDeducted') || 'Stock Deducted'
                        : t('production.stockNotDeducted') || 'Stock Not Yet Deducted'}
                    </p>
                    {production.stockDeductedAt && (
                      <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                        {formatDateTime(production.stockDeductedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {production.notes && (
                  <div className="bg-gray-50 dark:bg-stone-700/50 rounded-xl p-4 border border-gray-200 dark:border-stone-600">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
                          {t('production.notes') || 'Notes'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-stone-200 whitespace-pre-wrap">
                          {production.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {ingredientCount === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-stone-600 mb-4" />
                    <p className="text-gray-500 dark:text-stone-400">
                      {t('production.noIngredients') || 'No ingredients recorded'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Ingredients List */}
                    <div className="space-y-2">
                      {production.ingredientDetails?.map((ingredient, index) => {
                        const totalItemCost = ingredient.quantity * ingredient.unitCostGNF
                        const hasStock =
                          ingredient.currentStock !== undefined &&
                          ingredient.currentStock >= ingredient.quantity

                        return (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-stone-700/50 rounded-xl p-4 border border-gray-200 dark:border-stone-600 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/baking/inventory?search=${encodeURIComponent(ingredient.itemName)}`}
                                  className="text-sm font-medium text-gray-900 dark:text-stone-100 hover:text-gray-600 dark:hover:text-stone-300 hover:underline inline-flex items-center gap-1"
                                >
                                  {ingredient.itemName}
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-stone-400">
                                  <span className="tabular-nums">
                                    {ingredient.quantity} {ingredient.unit}
                                  </span>
                                  <span>×</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(ingredient.unitCostGNF)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                                  {formatCurrency(totalItemCost)}
                                </p>
                                {ingredient.currentStock !== undefined && (
                                  <span
                                    className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      hasStock
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}
                                  >
                                    {hasStock ? (
                                      <>
                                        <CheckCircle className="w-3 h-3" />
                                        {t('production.available') || 'Available'}
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-3 h-3" />
                                        {t('production.lowStock') || 'Low Stock'}
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-gray-100 dark:bg-stone-700 border border-gray-200 dark:border-stone-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-stone-200">
                        {t('production.totalEstimatedCost') || 'Total Estimated Cost'}
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-stone-800 px-6 py-4 border-t border-gray-200 dark:border-stone-700">
            <div className="flex items-center justify-between gap-3">
              {/* Status Change Buttons (Manager only) */}
              {isManager && onStatusChange && (
                <div className="flex items-center gap-2">
                  {(['Planning', 'Complete'] as ProductionStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={changing || production.preparationStatus === status}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        production.preparationStatus === status
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                          : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
                      }`}
                    >
                      {t(`production.status${status}`) || status}
                    </button>
                  ))}
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="ml-auto px-5 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 font-medium transition-colors"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
