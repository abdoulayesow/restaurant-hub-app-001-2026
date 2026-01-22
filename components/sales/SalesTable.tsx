'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Edit2, Eye, CheckCircle, XCircle, Banknote, Smartphone, CreditCard } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SaleStatusBadge } from './SaleStatusBadge'

interface Sale {
  id: string
  date: string
  totalGNF: number
  cashGNF: number
  orangeMoneyGNF: number
  cardGNF: number
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedByName?: string | null
  approvedByName?: string | null
  itemsCount?: number | null
  customersCount?: number | null
  activeDebtsCount?: number
  outstandingDebtAmount?: number
}

interface SalesTableProps {
  sales: Sale[]
  onView: (sale: Sale) => void
  onEdit: (sale: Sale) => void
  onApprove?: (sale: Sale) => void
  onReject?: (sale: Sale) => void
  isManager?: boolean
  loading?: boolean
}

type SortField = 'date' | 'totalGNF' | 'status'
type SortDirection = 'asc' | 'desc'

export function SalesTable({
  sales,
  onView,
  onEdit,
  onApprove,
  onReject,
  isManager = false,
  loading = false,
}: SalesTableProps) {
  const { t, locale } = useLocale()
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Sort sales
  const sortedSales = [...sales].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'totalGNF':
        comparison = a.totalGNF - b.totalGNF
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-plum-100 dark:bg-plum-800 rounded-t-xl"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-cream-50 dark:bg-plum-900 border-t border-plum-200/20"></div>
        ))}
      </div>
    )
  }

  if (sales.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-2xl warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30">
      <table className="w-full">
        <thead>
          <tr className="bg-plum-100 dark:bg-plum-800">
            <th
              className="bliss-elegant px-6 py-4 text-left text-sm font-semibold text-plum-800 dark:text-cream-100 cursor-pointer hover:bg-plum-200 dark:hover:bg-plum-700 transition-colors"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                {t('sales.date') || 'Date'}
                <SortIcon field="date" />
              </div>
            </th>
            <th
              className="bliss-elegant px-6 py-4 text-right text-sm font-semibold text-plum-800 dark:text-cream-100 cursor-pointer hover:bg-plum-200 dark:hover:bg-plum-700 transition-colors"
              onClick={() => handleSort('totalGNF')}
            >
              <div className="flex items-center justify-end gap-1">
                {t('sales.total') || 'Total'}
                <SortIcon field="totalGNF" />
              </div>
            </th>
            <th className="bliss-elegant px-6 py-4 text-right text-sm font-semibold text-plum-800 dark:text-cream-100 hidden md:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('sales.cash') || 'Cash'}
              </div>
            </th>
            <th className="bliss-elegant px-6 py-4 text-right text-sm font-semibold text-plum-800 dark:text-cream-100 hidden md:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <Smartphone className="w-4 h-4 text-orange-500" />
                {t('sales.orangeMoney') || 'Orange Money'}
              </div>
            </th>
            <th className="bliss-elegant px-6 py-4 text-right text-sm font-semibold text-plum-800 dark:text-cream-100 hidden lg:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <CreditCard className="w-4 h-4 text-plum-600 dark:text-plum-400" />
                {t('sales.card') || 'Card'}
              </div>
            </th>
            <th className="bliss-elegant px-6 py-4 text-center text-sm font-semibold text-plum-800 dark:text-cream-100">
              {t('sales.paymentStatus') || 'Payment Status'}
            </th>
            <th
              className="bliss-elegant px-6 py-4 text-center text-sm font-semibold text-plum-800 dark:text-cream-100 cursor-pointer hover:bg-plum-200 dark:hover:bg-plum-700 transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center justify-center gap-1">
                {t('common.status') || 'Status'}
                <SortIcon field="status" />
              </div>
            </th>
            <th className="bliss-elegant px-6 py-4 text-right text-sm font-semibold text-plum-800 dark:text-cream-100">
              {t('common.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-cream-50 dark:bg-plum-900">
          {sortedSales.map((sale, index) => (
            <tr
              key={sale.id}
              className={`
                border-t border-plum-200/20 dark:border-plum-700/20
                hover:bg-plum-50 dark:hover:bg-plum-800/50 transition-colors
                ${index === sortedSales.length - 1 ? 'rounded-b-2xl' : ''}
              `}
            >
              <td className="px-6 py-4">
                <div>
                  <p className="bliss-body font-medium text-plum-800 dark:text-cream-100">
                    {formatDate(sale.date)}
                  </p>
                  {sale.submittedByName && (
                    <p className="bliss-body text-xs text-plum-600/60 dark:text-plum-300/60 mt-0.5">
                      {t('sales.by') || 'by'} {sale.submittedByName}
                    </p>
                  )}
                </div>
              </td>
              <td className="bliss-elegant px-6 py-4 text-right font-semibold text-plum-800 dark:text-cream-100">
                {formatCurrency(sale.totalGNF)}
              </td>
              <td className="px-6 py-4 text-right hidden md:table-cell">
                <span className={`bliss-body ${sale.cashGNF > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-plum-300 dark:text-plum-600'}`}>
                  {formatCurrency(sale.cashGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-right hidden md:table-cell">
                <span className={`bliss-body ${sale.orangeMoneyGNF > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-plum-300 dark:text-plum-600'}`}>
                  {formatCurrency(sale.orangeMoneyGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-right hidden lg:table-cell">
                <span className={`bliss-body ${sale.cardGNF > 0 ? 'text-plum-700 dark:text-plum-400' : 'text-plum-300 dark:text-plum-600'}`}>
                  {formatCurrency(sale.cardGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                {sale.activeDebtsCount && sale.activeDebtsCount > 0 ? (
                  <div
                    className="inline-flex flex-col items-center gap-1 cursor-help"
                    title={`${sale.activeDebtsCount} customer${sale.activeDebtsCount > 1 ? 's' : ''} with outstanding credit`}
                  >
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Has Debts ({sale.activeDebtsCount})
                    </span>
                    {sale.outstandingDebtAmount && sale.outstandingDebtAmount > 0 && (
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        {formatCurrency(sale.outstandingDebtAmount)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 cursor-help"
                    title="All payments received in cash, card, or mobile money"
                  >
                    Fully Paid
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <SaleStatusBadge status={sale.status} size="sm" />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(sale)}
                    className="p-2 rounded-lg text-plum-600 dark:text-plum-300 hover:bg-plum-100 dark:hover:bg-plum-700 transition-colors"
                    title={t('common.view') || 'View'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {(isManager || sale.status === 'Pending') && (
                    <button
                      onClick={() => onEdit(sale)}
                      className="p-2 rounded-lg text-plum-600 dark:text-plum-300 hover:bg-plum-100 dark:hover:bg-plum-700 transition-colors"
                      title={t('common.edit') || 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {isManager && sale.status === 'Pending' && onApprove && onReject && (
                    <>
                      <button
                        onClick={() => onApprove(sale)}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        title={t('common.approve') || 'Approve'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onReject(sale)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title={t('common.reject') || 'Reject'}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SalesTable
