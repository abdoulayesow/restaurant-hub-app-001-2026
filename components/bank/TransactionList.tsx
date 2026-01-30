'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  ReceiptText
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
  sale?: {
    id: string
    date: string
    totalGNF: number
  } | null
  debtPayment?: {
    id: string
    amount: number
    paymentDate: string
  } | null
  expensePayment?: {
    id: string
    amount: number
    expense?: {
      id: string
      categoryName: string
      amountGNF: number
    } | null
  } | null
}

interface TransactionListProps {
  transactions: Transaction[]
  onConfirm?: (transactionId: string) => void
  onTransactionClick?: (transaction: Transaction) => void
  canEdit: boolean
  loading?: boolean
}

const REASON_LABELS: Record<TransactionReason, { key: string; fallback: string }> = {
  SalesDeposit: { key: 'bank.reasons.salesDeposit', fallback: 'Sales Deposit' },
  DebtCollection: { key: 'bank.reasons.debtCollection', fallback: 'Debt Collection' },
  ExpensePayment: { key: 'bank.reasons.expensePayment', fallback: 'Expense Payment' },
  OwnerWithdrawal: { key: 'bank.reasons.ownerWithdrawal', fallback: 'Owner Withdrawal' },
  CapitalInjection: { key: 'bank.reasons.capitalInjection', fallback: 'Capital Injection' },
  Other: { key: 'bank.reasons.other', fallback: 'Other' },
}

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  Cash: Banknote,
  OrangeMoney: Smartphone,
  Card: CreditCard,
}

export function TransactionList({ transactions, onConfirm, onTransactionClick, canEdit, loading }: TransactionListProps) {
  const { t, locale } = useLocale()
  const [typeFilter, setTypeFilter] = useState<'All' | 'Deposit' | 'Withdrawal'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Confirmed'>('All')
  const [confirmingTransaction, setConfirmingTransaction] = useState<Transaction | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirmClick = (txn: Transaction) => {
    setConfirmingTransaction(txn)
  }

  const handleConfirmTransaction = async () => {
    if (!confirmingTransaction || !onConfirm) return
    setIsConfirming(true)
    try {
      await onConfirm(confirmingTransaction.id)
      setConfirmingTransaction(null)
    } finally {
      setIsConfirming(false)
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    if (typeFilter !== 'All' && txn.type !== typeFilter) return false
    if (statusFilter !== 'All' && txn.status !== statusFilter) return false
    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, txn) => {
    const dateKey = new Date(txn.date).toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(txn)
    return groups
  }, {} as Record<string, Transaction[]>)

  // Sort dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  const depositCount = transactions.filter(t => t.type === 'Deposit').length
  const withdrawalCount = transactions.filter(t => t.type === 'Withdrawal').length
  const pendingCount = transactions.filter(t => t.status === 'Pending').length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-stone-700 rounded-lg p-1">
          {(['All', 'Deposit', 'Withdrawal'] as const).map((type) => {
            const count = type === 'All'
              ? transactions.length
              : type === 'Deposit'
                ? depositCount
                : withdrawalCount

            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  typeFilter === type
                    ? 'bg-white dark:bg-stone-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type === 'All'
                  ? (t('common.all') || 'All')
                  : type === 'Deposit'
                    ? (t('bank.deposits') || 'Deposits')
                    : (t('bank.withdrawals') || 'Withdrawals')}
                <span className="ml-1.5 text-xs opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100"
          >
            <option value="All">{t('bank.allStatuses') || 'All Statuses'}</option>
            <option value="Pending">{t('bank.pending') || 'Pending'} ({pendingCount})</option>
            <option value="Confirmed">{t('bank.confirmed') || 'Confirmed'}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <ReceiptText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-stone-600" />
          <p className="text-gray-500 dark:text-stone-400">
            {t('bank.noTransactions') || 'No transactions found'}
          </p>
        </div>
      ) : (
        /* Transaction List by Date */
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <h4 className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-3">
                {formatDate(dateKey)}
              </h4>

              {/* Transactions for this date */}
              <div className="space-y-3">
                {groupedTransactions[dateKey].map((txn) => {
                  const MethodIcon = METHOD_ICONS[txn.method]
                  const isDeposit = txn.type === 'Deposit'
                  const reasonLabel = REASON_LABELS[txn.reason]

                  return (
                    <div
                      key={txn.id}
                      onClick={() => onTransactionClick?.(txn)}
                      className={`flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-gray-200 dark:border-stone-700 hover:shadow-md transition-all ${
                        onTransactionClick ? 'cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-700' : ''
                      }`}
                    >
                      {/* Type Icon */}
                      <div className={`p-2.5 rounded-lg ${
                        isDeposit
                          ? 'bg-emerald-50 dark:bg-emerald-900/30'
                          : 'bg-rose-50 dark:bg-rose-900/30'
                      }`}>
                        {isDeposit
                          ? <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          : <ArrowDownRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        }
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-stone-100">
                            {t(reasonLabel.key) || reasonLabel.fallback}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            txn.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {txn.status === 'Pending'
                              ? <Clock className="w-3 h-3" />
                              : <CheckCircle2 className="w-3 h-3" />
                            }
                            {t(`bank.${txn.status.toLowerCase()}`) || txn.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-stone-400">
                          <span className="flex items-center gap-1">
                            <MethodIcon className="w-4 h-4" />
                            {t(`bank.methods.${txn.method}`) || txn.method}
                          </span>
                          {txn.description && (
                            <span className="truncate max-w-[200px]">{txn.description}</span>
                          )}
                          {txn.bankRef && (
                            <span className="text-xs">Ref: {txn.bankRef}</span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          isDeposit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isDeposit ? '+' : '-'}{formatCurrency(txn.amount)}
                        </p>
                        {txn.createdByName && (
                          <p className="text-xs text-gray-400 dark:text-stone-500 mt-0.5">
                            {txn.createdByName}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      {canEdit && txn.status === 'Pending' && onConfirm && (
                        <button
                          onClick={() => handleConfirmClick(txn)}
                          className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          {t('bank.confirm') || 'Confirm'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Transaction Dialog */}
      <ConfirmDialog
        isOpen={!!confirmingTransaction}
        onClose={() => setConfirmingTransaction(null)}
        onConfirm={handleConfirmTransaction}
        title={t('bank.confirmTransaction') || 'Confirm Transaction'}
        message={
          confirmingTransaction
            ? (t('bank.confirmTransactionMessage') || `Are you sure you want to confirm this ${confirmingTransaction.type.toLowerCase()} of ${formatCurrency(confirmingTransaction.amount)}?`)
            : ''
        }
        confirmText={t('bank.confirm') || 'Confirm'}
        variant="success"
        loading={isConfirming}
      />
    </div>
  )
}
