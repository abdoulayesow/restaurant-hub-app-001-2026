'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Edit2, Eye, CheckCircle, XCircle, DollarSign, Smartphone, CreditCard } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Expense {
  id: string
  date: string
  categoryName: string
  amountGNF: number
  paymentMethod: string
  description?: string | null
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedByName?: string | null
  supplier?: { id: string; name: string } | null
  isInventoryPurchase: boolean
  expenseItems?: Array<{
    inventoryItemId: string
    quantity: number
    unitCostGNF: number
    inventoryItem?: {
      id: string
      name: string
      nameFr?: string | null
      unit: string
    }
  }>
}

interface ExpensesTableProps {
  expenses: Expense[]
  onView: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onApprove?: (expense: Expense) => void
  onReject?: (expense: Expense) => void
  isManager?: boolean
  loading?: boolean
}

type SortField = 'date' | 'amountGNF' | 'categoryName' | 'status'
type SortDirection = 'asc' | 'desc'

export function ExpensesTable({
  expenses,
  onView,
  onEdit,
  onApprove,
  onReject,
  isManager = false,
  loading = false,
}: ExpensesTableProps) {
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

  // Payment method config - keys match database values
  const paymentMethodConfig: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
    'Cash': { label: t('expenses.cash') || 'Cash', icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
    'Orange Money': { label: t('expenses.orangeMoney') || 'Orange Money', icon: Smartphone, color: 'text-orange-600 dark:text-orange-400' },
    'Card': { label: t('expenses.card') || 'Card', icon: CreditCard, color: 'text-blue-600 dark:text-blue-400' },
  }

  // Fallback config for unknown payment methods
  const defaultPaymentConfig = { label: 'Unknown', icon: DollarSign, color: 'text-gray-600 dark:text-gray-400' }

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'amountGNF':
        comparison = a.amountGNF - b.amountGNF
        break
      case 'categoryName':
        comparison = a.categoryName.localeCompare(b.categoryName)
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
        <div className="h-12 bg-gray-200 dark:bg-stone-700 rounded-t-xl"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white dark:bg-stone-800 border-t border-gray-200 dark:border-stone-700"></div>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-stone-700">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 dark:bg-stone-700">
            <th
              className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                {t('expenses.date') || 'Date'}
                <SortIcon field="date" />
              </div>
            </th>
            <th
              className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600"
              onClick={() => handleSort('categoryName')}
            >
              <div className="flex items-center gap-1">
                {t('expenses.category') || 'Category'}
                <SortIcon field="categoryName" />
              </div>
            </th>
            <th
              className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600"
              onClick={() => handleSort('amountGNF')}
            >
              <div className="flex items-center justify-end gap-1">
                {t('expenses.amount') || 'Amount'}
                <SortIcon field="amountGNF" />
              </div>
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-stone-100 hidden md:table-cell">
              {t('expenses.paymentMethod') || 'Payment'}
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-stone-100 hidden lg:table-cell">
              {t('expenses.supplier') || 'Supplier'}
            </th>
            <th
              className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-stone-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center justify-center gap-1">
                {t('common.status') || 'Status'}
                <SortIcon field="status" />
              </div>
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-stone-100">
              {t('common.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-stone-800">
          {sortedExpenses.map((expense, index) => {
            const paymentConfig = paymentMethodConfig[expense.paymentMethod] || defaultPaymentConfig
            const PaymentIcon = paymentConfig.icon

            return (
              <tr
                key={expense.id}
                className={`
                  border-t border-gray-200 dark:border-stone-700
                  hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors
                  ${index === sortedExpenses.length - 1 ? 'rounded-b-xl' : ''}
                `}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-stone-100">
                      {formatDate(expense.date)}
                    </p>
                    {expense.submittedByName && (
                      <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                        {t('expenses.by') || 'by'} {expense.submittedByName}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-stone-100">
                      {expense.categoryName}
                    </span>
                    {expense.isInventoryPurchase && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/10 text-green-700 dark:text-green-400">
                        {expense.expenseItems && expense.expenseItems.length > 0
                          ? `${expense.expenseItems.length} ${t('expenses.items') || 'items'}`
                          : (t('expenses.inventory') || 'Inv')
                        }
                      </span>
                    )}
                  </div>
                  {expense.description && (
                    <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5 truncate max-w-[200px]">
                      {expense.description}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-stone-100">
                  {formatCurrency(expense.amountGNF)}
                </td>
                <td className="px-6 py-4 text-center hidden md:table-cell">
                  <div className={`inline-flex items-center gap-1.5 ${paymentConfig.color}`}>
                    <PaymentIcon className="w-4 h-4" />
                    <span className="text-sm">{paymentConfig.label}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-stone-200 hidden lg:table-cell">
                  {expense.supplier?.name || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={expense.status} size="sm" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(expense)}
                      className="p-2 rounded-lg text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600 transition-colors"
                      title={t('common.view') || 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {(isManager || expense.status === 'Pending') && (
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 rounded-lg text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600 transition-colors"
                        title={t('common.edit') || 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {isManager && expense.status === 'Pending' && onApprove && onReject && (
                      <>
                        <button
                          onClick={() => onApprove(expense)}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors"
                          title={t('common.approve') || 'Approve'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(expense)}
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ExpensesTable
