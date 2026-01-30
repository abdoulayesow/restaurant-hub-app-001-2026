'use client'

import { useState, useEffect } from 'react'
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  Receipt,
  ExternalLink,
  FileText,
  ShoppingBag,
  Wallet,
  User
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

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

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onConfirm?: (transactionId: string, data?: { bankRef?: string; comments?: string }) => Promise<void>
  canConfirm?: boolean
  isConfirming?: boolean
}

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  Cash: Banknote,
  OrangeMoney: Smartphone,
  Card: CreditCard,
}

const REASON_LABELS: Record<TransactionReason, { key: string; fallback: string }> = {
  SalesDeposit: { key: 'bank.reasons.SalesDeposit', fallback: 'Sales Deposit' },
  DebtCollection: { key: 'bank.reasons.DebtCollection', fallback: 'Debt Collection' },
  ExpensePayment: { key: 'bank.reasons.ExpensePayment', fallback: 'Expense Payment' },
  OwnerWithdrawal: { key: 'bank.reasons.OwnerWithdrawal', fallback: 'Owner Withdrawal' },
  CapitalInjection: { key: 'bank.reasons.CapitalInjection', fallback: 'Capital Injection' },
  Other: { key: 'bank.reasons.Other', fallback: 'Other' },
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  canConfirm = false,
  isConfirming = false,
}: TransactionDetailModalProps) {
  const { t, locale } = useLocale()

  // Form state for confirmation
  const [showConfirmForm, setShowConfirmForm] = useState(false)
  const [bankRef, setBankRef] = useState('')
  const [confirmComments, setConfirmComments] = useState('')

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmForm(false)
      setBankRef('')
      setConfirmComments('')
    }
  }, [isOpen, transaction?.id])

  if (!isOpen || !transaction) return null

  const isDeposit = transaction.type === 'Deposit'
  const isPending = transaction.status === 'Pending'
  const MethodIcon = METHOD_ICONS[transaction.method]
  const reasonLabel = REASON_LABELS[transaction.reason]

  // Determine source type
  const sourceType = transaction.sale
    ? 'sale'
    : transaction.debtPayment
      ? 'debt'
      : transaction.expensePayment
        ? 'expense'
        : 'manual'

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
      year: 'numeric',
      month: 'short',
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

  const handleConfirmClick = () => {
    setShowConfirmForm(true)
  }

  const handleCancelConfirm = () => {
    setShowConfirmForm(false)
    setBankRef('')
    setConfirmComments('')
  }

  const handleConfirmSubmit = async () => {
    if (onConfirm && transaction) {
      await onConfirm(transaction.id, {
        bankRef: bankRef.trim() || undefined,
        comments: confirmComments.trim() || undefined,
      })
    }
  }

  const handleClose = () => {
    setShowConfirmForm(false)
    setBankRef('')
    setConfirmComments('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-backdrop-fade"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="animate-modal-entrance w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-detail-title"
        >
          {/* Header with gradient */}
          <div className={`relative p-6 rounded-t-2xl ${
            isDeposit
              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30'
              : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30'
          }`}>
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-white/50 dark:hover:bg-stone-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              {/* Type Icon */}
              <div className={`p-3 rounded-xl ${
                isDeposit
                  ? 'bg-green-100 dark:bg-green-900/40'
                  : 'bg-red-100 dark:bg-red-900/40'
              }`}>
                {isDeposit
                  ? <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                  : <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                }
              </div>

              <div className="flex-1">
                <h2
                  id="transaction-detail-title"
                  className="text-lg font-bold text-stone-900 dark:text-stone-100"
                >
                  {t(`bank.types.${transaction.type}`)}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {t(reasonLabel.key)}
                </p>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                isPending
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {isPending
                  ? <Clock className="w-3.5 h-3.5" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />
                }
                {t(`bank.${transaction.status.toLowerCase()}`)}
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-700">
            <p className={`text-3xl font-bold ${
              isDeposit
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isDeposit ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <MethodIcon className="w-4 h-4" />
                {t(`bank.methods.${transaction.method}`)}
              </span>
              <span className="text-stone-400 dark:text-stone-500">|</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>

          {/* Source Section */}
          <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-700">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
              {t('bank.sourceInfo')}
            </h3>

            <div className={`p-4 rounded-xl border ${
              sourceType !== 'manual'
                ? 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-700'
                : 'bg-stone-50 dark:bg-stone-900/50 border-dashed border-stone-300 dark:border-stone-600'
            }`}>
              {sourceType === 'sale' && transaction.sale && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold-600 dark:text-gold-400 font-medium">
                    <ShoppingBag className="w-4 h-4" />
                    {t('bank.fromSale')}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-stone-500 dark:text-stone-400">{t('bank.saleDate')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {formatDate(transaction.sale.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-500 dark:text-stone-400">{t('bank.saleTotal')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(transaction.sale.totalGNF)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sourceType === 'expense' && transaction.expensePayment?.expense && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold-600 dark:text-gold-400 font-medium">
                    <Receipt className="w-4 h-4" />
                    {t('bank.fromExpense')}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-stone-500 dark:text-stone-400">{t('expenses.category')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {transaction.expensePayment.expense.categoryName}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-500 dark:text-stone-400">{t('bank.amount')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(transaction.expensePayment.expense.amountGNF)}
                      </p>
                    </div>
                  </div>
                  {transaction.expensePayment.expense.supplierName && (
                    <div className="text-sm">
                      <p className="text-stone-500 dark:text-stone-400">{t('expenses.supplier')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {transaction.expensePayment.expense.supplierName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'debt' && transaction.debtPayment && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Wallet className="w-4 h-4" />
                    {t('bank.fromDebt')}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-stone-500 dark:text-stone-400">{t('debts.paymentAmount')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(transaction.debtPayment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-500 dark:text-stone-400">{t('debts.paymentDate')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {formatDate(transaction.debtPayment.paymentDate)}
                      </p>
                    </div>
                  </div>
                  {transaction.debtPayment.debt?.customer?.name && (
                    <div className="text-sm">
                      <p className="text-stone-500 dark:text-stone-400">{t('customers.customer')}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {transaction.debtPayment.debt.customer.name}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'manual' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 font-medium">
                    <FileText className="w-4 h-4" />
                    {t('bank.manualTransaction')}
                  </div>
                  <p className="text-sm text-stone-900 dark:text-stone-100">
                    {t(reasonLabel.key)}
                  </p>
                  {transaction.description && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 italic">
                      &ldquo;{transaction.description}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Form (shown when confirming) */}
          {showConfirmForm && canConfirm && isPending && (
            <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-700 bg-emerald-50/50 dark:bg-emerald-900/10">
              <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                {t('bank.confirmTransaction') || 'Confirm Transaction'}
              </h3>

              <div className="space-y-4">
                {/* Bank Reference Input */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    {t('bank.bankRef') || 'Bank Reference'}
                    <span className="text-stone-400 dark:text-stone-500 font-normal ml-1">
                      ({t('common.optional') || 'Optional'})
                    </span>
                  </label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder={t('bank.bankRefPlaceholder') || 'Bank reference number'}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
                  />
                </div>

                {/* Comments Input */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    {t('sales.comments') || 'Comments'}
                    <span className="text-stone-400 dark:text-stone-500 font-normal ml-1">
                      ({t('common.optional') || 'Optional'})
                    </span>
                  </label>
                  <textarea
                    value={confirmComments}
                    onChange={(e) => setConfirmComments(e.target.value)}
                    placeholder={t('bank.descriptionPlaceholder') || 'Additional notes...'}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="px-6 py-5 space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
              {t('debts.details')}
            </h3>

            {transaction.bankRef && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">{t('bank.bankRef')}</span>
                <span className="font-mono text-stone-900 dark:text-stone-100">{transaction.bankRef}</span>
              </div>
            )}

            {transaction.comments && (
              <div className="text-sm">
                <span className="text-stone-500 dark:text-stone-400">{t('sales.comments')}</span>
                <p className="mt-1 text-stone-900 dark:text-stone-100">{transaction.comments}</p>
              </div>
            )}

            {transaction.createdByName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">{t('common.createdBy')}</span>
                <span className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100">
                  <User className="w-3.5 h-3.5" />
                  {transaction.createdByName}
                </span>
              </div>
            )}

            {transaction.createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">{t('bank.createdAt')}</span>
                <span className="text-stone-900 dark:text-stone-100">{formatDateTime(transaction.createdAt)}</span>
              </div>
            )}

            {transaction.confirmedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">{t('bank.confirmedAt')}</span>
                <span className="text-stone-900 dark:text-stone-100">{formatDateTime(transaction.confirmedAt)}</span>
              </div>
            )}

            {transaction.receiptUrl && (
              <div className="pt-2">
                <a
                  href={transaction.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gold-600 dark:text-gold-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('bank.viewReceipt')}
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 pt-0">
            {showConfirmForm ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={isConfirming}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-medium disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isConfirming}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirming ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t('bank.confirm')}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-medium"
                >
                  {t('common.close')}
                </button>

                {canConfirm && isPending && onConfirm && (
                  <button
                    type="button"
                    onClick={handleConfirmClick}
                    disabled={isConfirming}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gold-600 text-white font-medium hover:bg-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('bank.confirm')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
