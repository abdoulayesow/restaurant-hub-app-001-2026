'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Edit2, Eye, Banknote, Smartphone, CreditCard, Landmark } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SaleStatusBadge } from './SaleStatusBadge'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

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
  bankTransaction?: {
    id: string
    status: 'Pending' | 'Confirmed'
    confirmedAt?: string | null
  } | null
}

interface SalesTableProps {
  sales: Sale[]
  onView: (sale: Sale) => void
  onEdit: (sale: Sale) => void
  onApprove?: (sale: Sale) => void
  onReject?: (sale: Sale) => void
  onConfirmDeposit?: (sale: Sale) => void
  isManager?: boolean
  loading?: boolean
}

type SortField = 'date' | 'totalGNF' | 'status'
type SortDirection = 'asc' | 'desc'

export function SalesTable({
  sales,
  onView,
  onEdit,
  onApprove: _onApprove,
  onReject: _onReject,
  onConfirmDeposit,
  isManager: _isManager = false,
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

  // Format date using UTC utility to avoid timezone shifts
  const formatDate = (dateStr: string) => {
    return formatUTCDateForDisplay(dateStr, locale === 'fr' ? 'fr-FR' : 'en-US')
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
        <div className="h-12 bg-gray-100 dark:bg-stone-700 rounded-t-xl"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white dark:bg-stone-800 border-t border-gray-200 dark:border-stone-700"></div>
        ))}
      </div>
    )
  }

  if (sales.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 dark:bg-stone-700">
            <th
              className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600 transition-colors min-w-[180px]"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                {t('sales.date') || 'Date'}
                <SortIcon field="date" />
              </div>
            </th>
            <th
              className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600 transition-colors"
              onClick={() => handleSort('totalGNF')}
            >
              <div className="flex items-center justify-end gap-1">
                {t('sales.total') || 'Total'}
                <SortIcon field="totalGNF" />
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-stone-100 hidden md:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('sales.cash') || 'Cash'}
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-stone-100 hidden md:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <Smartphone className="w-4 h-4 text-orange-500" />
                {t('sales.orangeMoney') || 'Orange Money'}
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-stone-100 hidden lg:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <CreditCard className="w-4 h-4 text-gray-600 dark:text-stone-400" />
                {t('sales.card') || 'Card'}
              </div>
            </th>
            <th
              className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600 transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center justify-center gap-1">
                {t('common.status') || 'Status'}
                <SortIcon field="status" />
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-stone-100">
              {t('common.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-stone-800">
          {sortedSales.map((sale, index) => (
            <tr
              key={sale.id}
              className={`
                border-t border-gray-200 dark:border-stone-700
                hover:bg-gray-50 dark:hover:bg-stone-900/50 transition-colors
                ${index === sortedSales.length - 1 ? 'rounded-b-2xl' : ''}
              `}
            >
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-stone-100">
                    {formatDate(sale.date)}
                  </p>
                  {sale.submittedByName && (
                    <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                      {t('sales.by') || 'by'} {sale.submittedByName}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-stone-100">
                {formatCurrency(sale.totalGNF)}
              </td>
              <td className="px-6 py-4 text-right hidden md:table-cell">
                <span className={sale.cashGNF > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-300 dark:text-stone-500'}>
                  {formatCurrency(sale.cashGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-right hidden md:table-cell">
                <span className={sale.orangeMoneyGNF > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-300 dark:text-stone-500'}>
                  {formatCurrency(sale.orangeMoneyGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-right hidden lg:table-cell">
                <span className={sale.cardGNF > 0 ? 'text-gray-700 dark:text-stone-400' : 'text-gray-300 dark:text-stone-500'}>
                  {formatCurrency(sale.cardGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  {/* Payment status */}
                  {sale.activeDebtsCount && sale.activeDebtsCount > 0 ? (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 cursor-help"
                      title={`${sale.activeDebtsCount} customer${sale.activeDebtsCount > 1 ? 's' : ''} with outstanding credit`}
                    >
                      {t('sales.hasDebts') || 'Has Debts'} ({sale.activeDebtsCount})
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 cursor-help"
                      title={t('sales.fullyPaidTooltip') || 'All payments received in cash, card, or mobile money'}
                    >
                      {t('sales.fullyPaid') || 'Fully Paid'}
                    </span>
                  )}
                  {/* Sale approval status */}
                  <SaleStatusBadge status={sale.status} size="sm" />
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  {/* If cash has been deposited (via cashDeposit or bankTransaction), show only View */}
                  {sale.bankTransaction ? (
                    <button
                      onClick={() => onView(sale)}
                      className="p-2 rounded-lg text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
                      title={t('common.view') || 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      {/* Update button for pending sales */}
                      <button
                        onClick={() => onEdit(sale)}
                        className="p-2 rounded-lg text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
                        title={t('common.edit') || 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Confirm Deposit button */}
                      {onConfirmDeposit && (
                        <button
                          onClick={() => onConfirmDeposit(sale)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                          title={t('sales.confirmDeposit') || 'Confirm Deposit'}
                        >
                          <Landmark className="w-4 h-4" />
                        </button>
                      )}
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
