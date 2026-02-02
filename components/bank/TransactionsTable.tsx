'use client'

import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  ShoppingBag,
  Receipt,
  Wallet,
  FileText,
  User
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

type TransactionType = 'Deposit' | 'Withdrawal'
type PaymentMethod = 'Cash' | 'OrangeMoney' | 'Card'
type TransactionStatus = 'Pending' | 'Confirmed'
type TransactionReason = 'SalesDeposit' | 'DebtCollection' | 'ExpensePayment' | 'OwnerWithdrawal' | 'CapitalInjection' | 'Other'

interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  method: PaymentMethod
  reason: TransactionReason
  status: TransactionStatus
  description?: string | null
  comments?: string | null
  bankRef?: string | null
  confirmedAt?: string | null
  createdByName?: string | null
  createdAt?: string
  receiptUrl?: string | null
  sale?: {
    id: string
    date: string
    totalGNF: number
  } | null
  debtPayment?: {
    id: string
    amount: number
    paymentDate: string
    debt?: {
      customer?: {
        name: string
      } | null
    } | null
  } | null
  expensePayment?: {
    id: string
    amount: number
    expense?: {
      id: string
      categoryName: string
      amountGNF: number
      supplierName?: string | null
    } | null
  } | null
}

interface TransactionsTableProps {
  transactions: Transaction[]
  onTransactionClick?: (transaction: Transaction) => void
  onConfirm?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
  canEdit: boolean
  loading?: boolean
}

type SortField = 'date' | 'amount' | 'type' | 'status'
type SortDirection = 'asc' | 'desc'

const REASON_LABELS: Record<TransactionReason, { key: string; fallback: string }> = {
  SalesDeposit: { key: 'bank.reasons.SalesDeposit', fallback: 'Sales Deposit' },
  DebtCollection: { key: 'bank.reasons.DebtCollection', fallback: 'Debt Collection' },
  ExpensePayment: { key: 'bank.reasons.ExpensePayment', fallback: 'Expense Payment' },
  OwnerWithdrawal: { key: 'bank.reasons.OwnerWithdrawal', fallback: 'Owner Withdrawal' },
  CapitalInjection: { key: 'bank.reasons.CapitalInjection', fallback: 'Capital Injection' },
  Other: { key: 'bank.reasons.Other', fallback: 'Other' },
}

const METHOD_ICONS: Record<PaymentMethod, { icon: React.ElementType; color: string }> = {
  Cash: { icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400' },
  OrangeMoney: { icon: Smartphone, color: 'text-orange-500 dark:text-orange-400' },
  Card: { icon: CreditCard, color: 'text-stone-600 dark:text-stone-400' },
}

export function TransactionsTable({
  transactions,
  onTransactionClick,
  onConfirm,
  onEdit,
  onDelete,
  canEdit,
  loading = false,
}: TransactionsTableProps) {
  const { t, locale } = useLocale()
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

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
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedTransactions.length)
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)

  // Check if transaction is manually created (no linked sale, expense, or debt)
  const isManualTransaction = (txn: Transaction) => {
    return !txn.sale && !txn.expensePayment && !txn.debtPayment
  }

  // Sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  // Get source info
  const getSourceInfo = (txn: Transaction) => {
    if (txn.sale) {
      return { icon: ShoppingBag, label: t('bank.fromSale') || 'Sales', color: 'text-gold-600 dark:text-gold-400' }
    }
    if (txn.expensePayment) {
      return { icon: Receipt, label: txn.expensePayment.expense?.categoryName || t('bank.fromExpense') || 'Expense', color: 'text-gold-600 dark:text-gold-400' }
    }
    if (txn.debtPayment) {
      return { icon: Wallet, label: txn.debtPayment.debt?.customer?.name || t('bank.fromDebt') || 'Debt', color: 'text-emerald-600 dark:text-emerald-400' }
    }
    return { icon: FileText, label: t(REASON_LABELS[txn.reason].key) || REASON_LABELS[txn.reason].fallback, color: 'text-stone-500 dark:text-stone-400' }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-stone-100 dark:bg-stone-700 rounded-t-xl"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700"></div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700">
      <table className="w-full">
        <thead>
          <tr className="bg-stone-100 dark:bg-stone-700">
            {/* Date Column */}
            <th
              className="px-6 py-4 text-left text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors min-w-[160px]"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                {t('common.date') || 'Date'}
                <SortIcon field="date" />
              </div>
            </th>

            {/* Type Column */}
            <th
              className="px-6 py-4 text-center text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center justify-center gap-1">
                {t('bank.type') || 'Type'}
                <SortIcon field="type" />
              </div>
            </th>

            {/* Source Column */}
            <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700 dark:text-stone-100 hidden md:table-cell">
              {t('bank.sourceInfo') || 'Source'}
            </th>

            {/* Method Column */}
            <th className="px-6 py-4 text-center text-sm font-semibold text-stone-700 dark:text-stone-100 hidden lg:table-cell">
              {t('bank.method') || 'Method'}
            </th>

            {/* Amount Column */}
            <th
              className="px-6 py-4 text-right text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end gap-1">
                {t('bank.amount') || 'Amount'}
                <SortIcon field="amount" />
              </div>
            </th>

            {/* Status Column */}
            <th
              className="px-6 py-4 text-center text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center justify-center gap-1">
                {t('common.status') || 'Status'}
                <SortIcon field="status" />
              </div>
            </th>

            {/* Actions Column */}
            <th className="px-6 py-4 text-right text-sm font-semibold text-stone-700 dark:text-stone-100">
              {t('common.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-stone-800">
          {paginatedTransactions.map((txn, index) => {
            const isDeposit = txn.type === 'Deposit'
            const isPending = txn.status === 'Pending'
            const isManual = isManualTransaction(txn)
            const canModify = canEdit && isPending && isManual
            const MethodInfo = METHOD_ICONS[txn.method]
            const sourceInfo = getSourceInfo(txn)
            const SourceIcon = sourceInfo.icon

            return (
              <tr
                key={txn.id}
                onClick={() => onTransactionClick?.(txn)}
                className={`
                  border-t border-stone-200 dark:border-stone-700
                  hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors
                  ${onTransactionClick ? 'cursor-pointer' : ''}
                  ${index === paginatedTransactions.length - 1 && totalPages <= 1 ? 'rounded-b-2xl' : ''}
                `}
              >
                {/* Date Cell */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {formatDate(txn.date)}
                    </p>
                    {txn.createdByName && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {txn.createdByName}
                      </p>
                    )}
                  </div>
                </td>

                {/* Type Cell */}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isDeposit
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {isDeposit
                        ? <ArrowUpRight className="w-3.5 h-3.5" />
                        : <ArrowDownRight className="w-3.5 h-3.5" />
                      }
                      {t(`bank.types.${txn.type}`) || txn.type}
                    </div>
                  </div>
                </td>

                {/* Source Cell */}
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <SourceIcon className={`w-4 h-4 ${sourceInfo.color}`} />
                    <span className="text-sm text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
                      {sourceInfo.label}
                    </span>
                  </div>
                </td>

                {/* Method Cell */}
                <td className="px-6 py-4 text-center hidden lg:table-cell">
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1.5">
                      <MethodInfo.icon className={`w-4 h-4 ${MethodInfo.color}`} />
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {t(`bank.methods.${txn.method}`) || txn.method}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Amount Cell */}
                <td className="px-6 py-4 text-right">
                  <span className={`font-semibold ${
                    isDeposit
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isDeposit ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                </td>

                {/* Status Cell */}
                <td className="px-6 py-4 text-center">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    isPending
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {isPending
                      ? <Clock className="w-3.5 h-3.5" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />
                    }
                    {t(`bank.${txn.status.toLowerCase()}`) || txn.status}
                  </div>
                </td>

                {/* Actions Cell */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* View button */}
                    <button
                      onClick={() => onTransactionClick?.(txn)}
                      className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                      title={t('common.view') || 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit button for manual pending transactions */}
                    {canModify && onEdit && (
                      <button
                        onClick={() => onEdit(txn)}
                        className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        title={t('common.edit') || 'Edit'}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button for manual pending transactions */}
                    {canModify && onDelete && (
                      <button
                        onClick={() => onDelete(txn)}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t('common.delete') || 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Confirm button for pending transactions */}
                    {canEdit && isPending && onConfirm && (
                      <button
                        onClick={() => onConfirm(txn)}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500 dark:border-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        {t('bank.confirm') || 'Confirm'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('common.showingXtoYofZ')
                ? t('common.showingXtoYofZ')
                    .replace('{start}', String(startIndex + 1))
                    .replace('{end}', String(endIndex))
                    .replace('{total}', String(sortedTransactions.length))
                : `Showing ${startIndex + 1} to ${endIndex} of ${sortedTransactions.length} transactions`
              }
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('common.previous') || 'Previous'}
              </button>
              <span className="px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300">
                {t('common.pageXofY')
                  ? t('common.pageXofY')
                      .replace('{current}', String(currentPage))
                      .replace('{total}', String(totalPages))
                  : `Page ${currentPage} of ${totalPages}`
                }
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.next') || 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionsTable
