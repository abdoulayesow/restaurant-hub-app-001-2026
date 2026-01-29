'use client'

import { useState } from 'react'
import { X, Calendar, User, Phone, Mail, FileText, Clock, CheckCircle, AlertCircle, Ban, TrendingUp, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: string
  receiptNumber: string | null
  receivedByName: string | null
  createdAt: string
}

interface Debt {
  id: string
  customerId: string
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    customerType: 'Individual' | 'Corporate' | 'Wholesale'
  }
  saleId: string | null
  sale?: {
    id: string
    date: string
    totalGNF: number
  }
  principalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string | null
  status: 'Outstanding' | 'PartiallyPaid' | 'FullyPaid' | 'Overdue' | 'WrittenOff'
  notes: string | null
  createdAt: string
  updatedAt: string
  payments: Payment[]
}

interface DebtDetailsModalProps {
  debt: Debt | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
  isManager?: boolean
}

// Payment method icons
const paymentMethodIcons: Record<string, typeof Banknote> = {
  Cash: Banknote,
  Card: CreditCard,
  OrangeMoney: Smartphone,
}

export default function DebtDetailsModal({
  debt,
  isOpen,
  onClose,
  onUpdate,
  isManager = false
}: DebtDetailsModalProps) {
  const { t, locale } = useLocale()
  const [showWriteOffConfirm, setShowWriteOffConfirm] = useState(false)
  const [writeOffReason, setWriteOffReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !debt) return null

  const statusConfig = {
    Outstanding: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, label: t('debts.Outstanding') || 'Outstanding' },
    PartiallyPaid: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingUp, label: t('debts.PartiallyPaid') || 'Partially Paid' },
    FullyPaid: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: t('debts.FullyPaid') || 'Fully Paid' },
    Overdue: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle, label: t('debts.Overdue') || 'Overdue' },
    WrittenOff: { color: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-400', icon: Ban, label: t('debts.WrittenOff') || 'Written Off' }
  }

  const StatusIcon = statusConfig[debt.status].icon

  const formatDate = (dateString: string) => {
    return formatUTCDateForDisplay(dateString, locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff'
  const progressPercent = debt.principalAmount > 0 ? (debt.paidAmount / debt.principalAmount) * 100 : 0

  const handleWriteOff = async () => {
    if (!writeOffReason.trim()) {
      setError(t('debts.writeOffReasonRequired') || 'Please provide a reason for writing off this debt')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/debts/${debt.id}/write-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: writeOffReason.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to write off debt')
      }

      setShowWriteOffConfirm(false)
      setWriteOffReason('')
      if (onUpdate) onUpdate()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-stone-700"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-gray-100 dark:border-stone-700">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-stone-400" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-stone-100 truncate">
                  {debt.customer.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-stone-400">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[debt.status].color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[debt.status].label}
                  </span>
                  {debt.customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {debt.customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-5 py-4 bg-gray-50 dark:bg-stone-900/50 border-b border-gray-100 dark:border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('debts.paymentProgress') || 'Payment Progress'}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-stone-100">
                {formatCurrency(debt.paidAmount)} / {formatCurrency(debt.principalAmount)} GNF
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-gray-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>

            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {formatCurrency(debt.paidAmount)} {t('debts.paid') || 'paid'}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {formatCurrency(debt.remainingAmount)} {t('debts.left') || 'left'}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-5 py-4 space-y-3">
            {/* Key Info Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              {debt.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-stone-500'}`} />
                  <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-stone-300'}>
                    {formatDate(debt.dueDate)}
                    {isOverdue && <span className="ml-1 text-xs">({t('debts.Overdue') || 'Overdue'})</span>}
                  </span>
                </div>
              )}
              {debt.customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-stone-500" />
                  <span className="text-gray-700 dark:text-stone-300">{debt.customer.email}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {debt.notes && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-stone-700/50 rounded-xl">
                <FileText className="w-4 h-4 text-gray-400 dark:text-stone-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-stone-300">{debt.notes}</p>
              </div>
            )}
          </div>

          {/* Payments Timeline */}
          {debt.payments.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-stone-700">
              <h3 className="text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                {t('debts.payments') || 'Payments'} ({debt.payments.length})
              </h3>

              <div className="space-y-2">
                {debt.payments.map((payment) => {
                  const PaymentIcon = paymentMethodIcons[payment.paymentMethod] || Banknote
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center gap-3 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30"
                    >
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg">
                        <PaymentIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(payment.amount)} GNF
                          </span>
                          <span className="text-xs text-gray-500 dark:text-stone-400">
                            {formatDate(payment.paymentDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400">
                          <span>{payment.paymentMethod}</span>
                          {payment.receiptNumber && (
                            <>
                              <span>•</span>
                              <span>#{payment.receiptNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-stone-700 bg-gray-50 dark:bg-stone-900/50 rounded-b-2xl">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition-colors font-medium"
              >
                {t('common.close') || 'Close'}
              </button>
              {isManager && debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff' && (
                <button
                  onClick={() => setShowWriteOffConfirm(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                >
                  {t('debts.writeOff') || 'Write Off'}
                </button>
              )}
            </div>
          </div>

          {/* Write-Off Confirmation Dialog */}
          {showWriteOffConfirm && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
              <div className="bg-white dark:bg-stone-800 rounded-xl p-5 max-w-sm w-full mx-4 shadow-xl border border-gray-200 dark:border-stone-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-stone-100">
                    {t('debts.confirmWriteOff') || 'Confirm Write-Off'}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-stone-300 mb-3">
                  {t('debts.writeOffWarning') || 'This action will mark the debt as uncollectible. This cannot be undone.'}
                </p>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1.5">
                    {t('debts.writeOffReason') || 'Reason'} *
                  </label>
                  <textarea
                    value={writeOffReason}
                    onChange={(e) => setWriteOffReason(e.target.value)}
                    placeholder={t('debts.writeOffReasonPlaceholder') || 'e.g., Customer bankruptcy...'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 resize-none"
                    rows={2}
                  />
                </div>

                {error && (
                  <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowWriteOffConfirm(false)
                      setWriteOffReason('')
                      setError('')
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleWriteOff}
                    disabled={isSubmitting || !writeOffReason.trim()}
                    className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isSubmitting ? (t('common.processing') || '...') : (t('debts.writeOff') || 'Write Off')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
