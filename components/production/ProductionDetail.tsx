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
import { useBakery } from '@/components/providers/BakeryProvider'
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
  const { currentPalette } = useBakery()
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

  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'Planning':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
      case 'Ready':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'InProgress':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      case 'Complete':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'Approved':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'Rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 bg-${currentPalette}-50 dark:bg-${currentPalette}-900/20 rounded-lg`}>
                <Package className={`w-8 h-8 text-${currentPalette}-600 dark:text-${currentPalette}-400`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {production.quantity} {t('production.quantity')}
                </p>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-col gap-2 items-end">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusColor(
                  production.preparationStatus
                )}`}
              >
                <span className="text-sm font-medium">
                  {t(`production.status${production.preparationStatus}`)}
                </span>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getSubmissionStatusColor(
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
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('production.date')}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {formatDate(production.date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created By
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {production.createdByName || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('production.estimatedCost')}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {totalCost.toLocaleString()} GNF
              </p>
            </div>
          </div>
        </div>

        {/* Stock Deduction Status */}
        <div className="px-6 pb-6">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              production.stockDeducted
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-yellow-50 dark:bg-yellow-900/20'
            }`}
          >
            {production.stockDeducted ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  production.stockDeducted
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-yellow-700 dark:text-yellow-400'
                }`}
              >
                {production.stockDeducted
                  ? 'Stock Deducted'
                  : 'Stock Not Yet Deducted'}
              </p>
              {production.stockDeductedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDateTime(production.stockDeductedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('production.ingredients')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ingredient
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {production.ingredientDetails?.map((ingredient, index) => {
                const totalItemCost = ingredient.quantity * ingredient.unitCostGNF
                const hasStock =
                  ingredient.currentStock !== undefined &&
                  ingredient.currentStock >= ingredient.quantity

                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/inventory/${ingredient.itemId}`}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        {ingredient.itemName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                      {ingredient.quantity} {ingredient.unit}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                      {ingredient.unitCostGNF.toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {totalItemCost.toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ingredient.currentStock !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            hasStock
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
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
            <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right"
                >
                  Total Estimated Cost:
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-gray-900 dark:text-white">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t('production.notes')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {production.notes}
          </p>
        </div>
      )}

      {/* Status Change */}
      {canEdit && onStatusChange && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    production.preparationStatus === status
                      ? `bg-${currentPalette}-600 text-white`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
