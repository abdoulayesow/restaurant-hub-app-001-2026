'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProductionStatus, SubmissionStatus } from '@prisma/client'

interface ProductionDetailProps {
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
  }
  canEdit: boolean
  onStatusChange?: (newStatus: ProductionStatus) => Promise<void>
}

export default function ProductionDetail({
  production,
  canEdit,
  onStatusChange,
}: ProductionDetailProps) {
  const { t, locale } = useLocale()
  const [changing, setChanging] = useState(false)

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

  // Bliss design system status colors
  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'Planning':
        return 'text-plum-600 dark:text-plum-400 bg-plum-50 dark:bg-plum-900/20'
      case 'Ready':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'InProgress':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
      case 'Complete':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
      default:
        return 'text-plum-600 dark:text-plum-400 bg-plum-50 dark:bg-plum-900/20'
    }
  }

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'Pending':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
      case 'Approved':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
      case 'Rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-plum-600 dark:text-plum-400 bg-plum-50 dark:bg-plum-900/20'
    }
  }

  const handleStatusChange = async (newStatus: ProductionStatus) => {
    if (!onStatusChange) return

    setChanging(true)
    try {
      await onStatusChange(newStatus)
    } finally {
      setChanging(false)
    }
  }

  const totalCost =
    production.ingredientDetails?.reduce(
      (sum, ing) => sum + ing.quantity * ing.unitCostGNF,
      0
    ) || production.estimatedCostGNF || 0

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 grain-overlay">
        <div className="p-6 border-b border-plum-200/40 dark:border-plum-700/40">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-plum-100 dark:bg-plum-900/40 rounded-xl">
                <Package className="w-8 h-8 text-plum-600 dark:text-plum-400" />
              </div>
              <div>
                <h1 className="bliss-display text-2xl font-bold text-plum-800 dark:text-cream-100">
                  {productName}
                </h1>
                <p className="bliss-body text-sm text-plum-500 dark:text-cream-400 mt-1">
                  {production.quantity} {t('production.quantity')}
                </p>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-col gap-2 items-end">
              <div
                className={`bliss-body inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusColor(
                  production.preparationStatus
                )}`}
              >
                <span className="text-sm font-medium">
                  {t(`production.status${production.preparationStatus}`)}
                </span>
              </div>
              <div
                className={`bliss-body inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getSubmissionStatusColor(
                  production.status
                )}`}
              >
                <span className="text-sm font-medium">
                  {t(`common.${production.status.toLowerCase()}`)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-plum-400 mt-0.5" />
            <div>
              <p className="bliss-body text-sm text-plum-500 dark:text-cream-400">
                {t('production.date')}
              </p>
              <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100 mt-1">
                {formatDate(production.date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-plum-400 mt-0.5" />
            <div>
              <p className="bliss-body text-sm text-plum-500 dark:text-cream-400">
                Created By
              </p>
              <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100 mt-1">
                {production.createdByName || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-plum-400 mt-0.5" />
            <div>
              <p className="bliss-body text-sm text-plum-500 dark:text-cream-400">
                {t('production.estimatedCost')}
              </p>
              <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100 mt-1">
                {totalCost.toLocaleString()} GNF
              </p>
            </div>
          </div>
        </div>

        {/* Stock Deduction Status */}
        <div className="px-6 pb-6">
          <div
            className={`flex items-center gap-2 p-3 rounded-xl ${
              production.stockDeducted
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30'
            }`}
          >
            {production.stockDeducted ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
            <div className="flex-1">
              <p
                className={`bliss-body text-sm font-medium ${
                  production.stockDeducted
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {production.stockDeducted
                  ? 'Stock Deducted'
                  : 'Stock Not Yet Deducted'}
              </p>
              {production.stockDeductedAt && (
                <p className="bliss-body text-xs text-plum-500 dark:text-cream-400 mt-0.5">
                  {formatDateTime(production.stockDeductedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 overflow-hidden">
        <div className="p-6 border-b border-plum-200/40 dark:border-plum-700/40">
          <h2 className="bliss-elegant text-xl font-semibold text-plum-800 dark:text-cream-100">
            {t('production.ingredients')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-plum-50/50 dark:bg-plum-900/50 border-b border-plum-200/30 dark:border-plum-700/30">
              <tr>
                <th className="bliss-body px-6 py-3 text-left text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                  Ingredient
                </th>
                <th className="bliss-body px-6 py-3 text-right text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="bliss-body px-6 py-3 text-right text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="bliss-body px-6 py-3 text-right text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="bliss-body px-6 py-3 text-center text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum-200/30 dark:divide-plum-700/30">
              {production.ingredientDetails?.map((ingredient, index) => {
                const totalItemCost = ingredient.quantity * ingredient.unitCostGNF
                const hasStock =
                  ingredient.currentStock !== undefined &&
                  ingredient.currentStock >= ingredient.quantity

                return (
                  <tr key={index} className="hover:bg-plum-50/60 dark:hover:bg-plum-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/inventory/${ingredient.itemId}`}
                        className="bliss-body text-sm font-medium text-plum-600 dark:text-plum-400 hover:text-plum-800 dark:hover:text-plum-300 hover:underline inline-flex items-center gap-1 transition-colors"
                      >
                        {ingredient.itemName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="bliss-body px-6 py-4 text-right text-sm text-plum-800 dark:text-cream-100">
                      {ingredient.quantity} {ingredient.unit}
                    </td>
                    <td className="bliss-body px-6 py-4 text-right text-sm text-plum-800 dark:text-cream-100">
                      {ingredient.unitCostGNF.toLocaleString()} GNF
                    </td>
                    <td className="bliss-body px-6 py-4 text-right text-sm font-medium text-plum-800 dark:text-cream-100">
                      {totalItemCost.toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ingredient.currentStock !== undefined && (
                        <span
                          className={`bliss-body inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            hasStock
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {hasStock ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Available
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Low Stock
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-plum-50/50 dark:bg-plum-900/50 border-t border-plum-200/30 dark:border-plum-700/30">
              <tr>
                <td
                  colSpan={3}
                  className="bliss-body px-6 py-4 text-sm font-medium text-plum-800 dark:text-cream-100 text-right"
                >
                  Total Estimated Cost:
                </td>
                <td className="bliss-body px-6 py-4 text-right text-lg font-bold text-plum-800 dark:text-cream-100">
                  {totalCost.toLocaleString()} GNF
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      {production.notes && (
        <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 p-6">
          <h3 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100 mb-3">
            {t('production.notes')}
          </h3>
          <p className="bliss-body text-sm text-plum-700 dark:text-cream-300 whitespace-pre-wrap">
            {production.notes}
          </p>
        </div>
      )}

      {/* Status Change */}
      {canEdit && onStatusChange && (
        <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 p-6">
          <h3 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100 mb-4">
            Change Production Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {(['Planning', 'Ready', 'InProgress', 'Complete'] as ProductionStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={
                    changing || production.preparationStatus === status
                  }
                  className={`bliss-body px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    production.preparationStatus === status
                      ? 'bg-plum-700 text-cream-50 shadow-lg shadow-plum-900/20'
                      : 'bg-plum-100 dark:bg-plum-900/40 text-plum-700 dark:text-cream-300 hover:bg-plum-200 dark:hover:bg-plum-700/60'
                  }`}
                >
                  {t(`production.status${status}`)}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
