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
        <div className="h-12 bg-cream-200 dark:bg-dark-700 rounded-t-xl"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-cream-100 dark:bg-dark-800 border-t border-terracotta-500/10"></div>
        ))}
      </div>
    )
  }

  if (sales.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-2xl warm-shadow">
      <table className="w-full">
        <thead>
          <tr className="bg-cream-200 dark:bg-dark-700">
            <th
              className="px-6 py-4 text-left text-sm font-semibold text-terracotta-900 dark:text-cream-100 cursor-pointer hover:bg-cream-300 dark:hover:bg-dark-600"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                {t('sales.date') || 'Date'}
                <SortIcon field="date" />
              </div>
            </th>
            <th
              className="px-6 py-4 text-right text-sm font-semibold text-terracotta-900 dark:text-cream-100 cursor-pointer hover:bg-cream-300 dark:hover:bg-dark-600"
              onClick={() => handleSort('totalGNF')}
            >
              <div className="flex items-center justify-end gap-1">
                {t('sales.total') || 'Total'}
                <SortIcon field="totalGNF" />
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-terracotta-900 dark:text-cream-100 hidden md:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <Banknote className="w-4 h-4 text-green-600 dark:text-green-400" />
                {t('sales.cash') || 'Cash'}
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-terracotta-900 dark:text-cream-100 hidden md:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <Smartphone className="w-4 h-4 text-orange-500" />
                {t('sales.orangeMoney') || 'Orange Money'}
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-terracotta-900 dark:text-cream-100 hidden lg:table-cell">
              <div className="flex items-center justify-end gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t('sales.card') || 'Card'}
              </div>
            </th>
            <th
              className="px-6 py-4 text-center text-sm font-semibold text-terracotta-900 dark:text-cream-100 cursor-pointer hover:bg-cream-300 dark:hover:bg-dark-600"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center justify-center gap-1">
                {t('common.status') || 'Status'}
                <SortIcon field="status" />
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-terracotta-900 dark:text-cream-100">
              {t('common.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-cream-100 dark:bg-dark-800">
          {sortedSales.map((sale, index) => (
            <tr
              key={sale.id}
              className={`
                border-t border-terracotta-500/10 dark:border-terracotta-400/10
                hover:bg-cream-50 dark:hover:bg-dark-700 transition-colors
                ${index === sortedSales.length - 1 ? 'rounded-b-2xl' : ''}
              `}
            >
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-terracotta-900 dark:text-cream-100">
                    {formatDate(sale.date)}
                  </p>
                  {sale.submittedByName && (
                    <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60 mt-0.5">
                      {t('sales.by') || 'by'} {sale.submittedByName}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right font-semibold text-terracotta-900 dark:text-cream-100">
                {formatCurrency(sale.totalGNF)}
              </td>
              <td className="px-6 py-4 text-right hidden md:table-cell">
                <span className={sale.cashGNF > 0 ? 'text-green-700 dark:text-green-400' : 'text-terracotta-400 dark:text-dark-500'}>
                  {formatCurrency(sale.cashGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-right hidden md:table-cell">
                <span className={sale.orangeMoneyGNF > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-terracotta-400 dark:text-dark-500'}>
                  {formatCurrency(sale.orangeMoneyGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-right hidden lg:table-cell">
                <span className={sale.cardGNF > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-terracotta-400 dark:text-dark-500'}>
                  {formatCurrency(sale.cardGNF)}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <SaleStatusBadge status={sale.status} size="sm" />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(sale)}
                    className="p-2 rounded-lg text-terracotta-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors"
                    title={t('common.view') || 'View'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {(isManager || sale.status === 'Pending') && (
                    <button
                      onClick={() => onEdit(sale)}
                      className="p-2 rounded-lg text-terracotta-600 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors"
                      title={t('common.edit') || 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {isManager && sale.status === 'Pending' && onApprove && onReject && (
                    <>
                      <button
                        onClick={() => onApprove(sale)}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors"
                        title={t('common.approve') || 'Approve'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onReject(sale)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors"
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
