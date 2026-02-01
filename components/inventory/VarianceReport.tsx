'use client'

import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { getCategoryLabel } from './CategoryFilter'
import { formatDateForDisplay } from '@/lib/date-utils'

interface ReconciliationItem {
  id: string
  inventoryItemId: string
  systemStock: number
  physicalCount: number
  variance: number
  adjustmentApplied: boolean
  inventoryItem: {
    id: string
    name: string
    nameFr: string | null
    unit: string
    category: string
  }
}

interface Reconciliation {
  id: string
  restaurantId: string
  date: string
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedBy: string
  submittedByName: string | null
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
  notes: string | null
  items: ReconciliationItem[]
  createdAt: string
}

interface VarianceReportProps {
  reconciliation: Reconciliation
  isManager: boolean
  onApprove: () => void
  onReject: () => void
  onBack: () => void
  isProcessing: boolean
}

export function VarianceReport({
  reconciliation,
  isManager,
  onApprove,
  onReject,
  onBack,
  isProcessing,
}: VarianceReportProps) {
  const { t, locale } = useLocale()

  // Calculate summary stats
  const totalItems = reconciliation.items.length
  const itemsWithVariance = reconciliation.items.filter(i => i.variance !== 0)
  const positiveVariances = reconciliation.items.filter(i => i.variance > 0)
  const negativeVariances = reconciliation.items.filter(i => i.variance < 0)
  const totalPositive = positiveVariances.reduce((sum, i) => sum + i.variance, 0)
  const totalNegative = negativeVariances.reduce((sum, i) => sum + i.variance, 0)

  // Format date
  const formatDate = (dateStr: string) => {
    return formatDateForDisplay(dateStr, locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get display name
  const getDisplayName = (item: ReconciliationItem) => {
    return locale === 'fr' && item.inventoryItem.nameFr
      ? item.inventoryItem.nameFr
      : item.inventoryItem.name
  }

  // Status badge
  const getStatusBadge = (status: string) => {
    const config = {
      Pending: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-800 dark:text-amber-400',
        icon: AlertTriangle,
      },
      Approved: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-800 dark:text-emerald-400',
        icon: CheckCircle,
      },
      Rejected: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-400',
        icon: XCircle,
      },
    }
    const c = config[status as keyof typeof config] || config.Pending
    const Icon = c.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${c.bg} ${c.text}`}>
        <Icon className="w-4 h-4" />
        <span className="font-medium">{t(`common.status${status}`) || status}</span>
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('inventory.reconciliation.backToList') || 'Back to list'}
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-stone-100">
                {t('inventory.reconciliation.varianceReport') || 'Variance Report'}
              </h2>
              {getStatusBadge(reconciliation.status)}
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-stone-400">
              <p>
                <span className="font-medium">{t('common.date') || 'Date'}:</span>{' '}
                {formatDate(reconciliation.date)}
              </p>
              <p>
                <span className="font-medium">{t('inventory.reconciliation.submittedBy') || 'Submitted by'}:</span>{' '}
                {reconciliation.submittedByName || 'Unknown'}
              </p>
              {reconciliation.approvedBy && (
                <p>
                  <span className="font-medium">
                    {reconciliation.status === 'Approved'
                      ? t('inventory.reconciliation.approvedBy') || 'Approved by'
                      : t('inventory.reconciliation.rejectedBy') || 'Rejected by'}
                    :
                  </span>{' '}
                  {reconciliation.approvedByName || 'Unknown'}
                  {reconciliation.approvedAt && (
                    <span className="text-gray-500 dark:text-stone-500">
                      {' '}({formatDate(reconciliation.approvedAt)})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-stone-700/50">
              <div className="text-2xl font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                {totalItems}
              </div>
              <div className="text-xs text-gray-500 dark:text-stone-400">
                {t('inventory.reconciliation.itemsCounted') || 'Items'}
              </div>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                {itemsWithVariance.length}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-500">
                {t('inventory.reconciliation.variances') || 'Variances'}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {reconciliation.notes && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 text-sm text-gray-600 dark:text-stone-400">
            <span className="font-medium">{t('inventory.reconciliation.notes') || 'Notes'}:</span>{' '}
            {reconciliation.notes}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-stone-400">
                {t('inventory.reconciliation.matching') || 'Matching'}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-stone-100">
                {totalItems - itemsWithVariance.length} {t('inventory.items') || 'items'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-stone-400">
                {t('inventory.reconciliation.overages') || 'Overages'}
              </div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                +{totalPositive.toFixed(2)} ({positiveVariances.length})
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-stone-400">
                {t('inventory.reconciliation.shortages') || 'Shortages'}
              </div>
              <div className="text-lg font-semibold text-red-700 dark:text-red-400">
                {totalNegative.toFixed(2)} ({negativeVariances.length})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-stone-700">
          <h3 className="font-semibold text-gray-900 dark:text-stone-100">
            {t('inventory.reconciliation.detailedBreakdown') || 'Detailed Breakdown'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-stone-700/50 border-b border-gray-200 dark:border-stone-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.item') || 'Item'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.category') || 'Category'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.reconciliation.systemStock') || 'System'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.reconciliation.physicalCount') || 'Physical'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.reconciliation.variance') || 'Variance'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
              {reconciliation.items.map((item) => (
                <tr
                  key={item.id}
                  className={`${
                    item.variance !== 0
                      ? item.variance > 0
                        ? 'bg-blue-50/50 dark:bg-blue-900/10'
                        : 'bg-red-50/50 dark:bg-red-900/10'
                      : ''
                  } hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-stone-100">
                      {getDisplayName(item)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300">
                      {getCategoryLabel(item.inventoryItem.category, t)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums">
                    <span className="text-gray-600 dark:text-stone-400">
                      {item.systemStock}
                    </span>
                    <span className="ml-1 text-gray-400 dark:text-stone-500 text-sm">
                      {item.inventoryItem.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums">
                    <span className="text-gray-900 dark:text-stone-100 font-medium">
                      {item.physicalCount}
                    </span>
                    <span className="ml-1 text-gray-400 dark:text-stone-500 text-sm">
                      {item.inventoryItem.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {item.variance === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Minus className="w-4 h-4" />
                        <span className="tabular-nums">0</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                          item.variance > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {item.variance > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {item.variance > 0 ? '+' : ''}
                        {item.variance.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions for Pending reconciliations */}
      {reconciliation.status === 'Pending' && isManager && (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-stone-100 mb-1">
                {t('inventory.reconciliation.managerAction') || 'Manager Action Required'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-stone-400">
                {t('inventory.reconciliation.managerActionDescription') ||
                  'Approving will create stock adjustments for all variances and update inventory levels.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onReject}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {t('common.reject') || 'Reject'}
              </button>
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing
                  ? t('common.processing') || 'Processing...'
                  : t('common.approve') || 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
