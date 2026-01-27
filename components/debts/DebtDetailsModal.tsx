'use client'

import { useState } from 'react'
import { X, Calendar, DollarSign, User, Phone, Mail, Building2, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Ban } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { format } from 'date-fns'

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

export default function DebtDetailsModal({
  debt,
  isOpen,
  onClose,
  onUpdate,
  isManager = false
}: DebtDetailsModalProps) {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details')
  const [showWriteOffConfirm, setShowWriteOffConfirm] = useState(false)
  const [writeOffReason, setWriteOffReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !debt) return null

  const statusConfig = {
    Outstanding: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    PartiallyPaid: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingUp },
    FullyPaid: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
    Overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
    WrittenOff: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Ban }
  }

  const StatusIcon = statusConfig[debt.status].icon

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff'

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: writeOffReason.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to write off debt')
      }

      // Success - close modal and refresh
      setShowWriteOffConfirm(false)
      setWriteOffReason('')
      if (onUpdate) {
        onUpdate()
      }
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="animate-modal-entrance w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-2xl shadow-lg relative">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-stone-800 px-6 py-5 border-b border-gray-200 dark:border-stone-700 z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                    {t('debts.debtDetails') || 'Debt Details'}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig[debt.status].color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {debt.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-stone-300">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {debt.customer.name}
                  </span>
                  {debt.customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {debt.customer.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-stone-700 px-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'details'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-stone-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {t('debts.details') || 'Details'}
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-stone-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {t('debts.payments') || 'Payments'} ({debt.payments.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                {/* Amount Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-stone-700 rounded-xl p-4 border border-gray-200 dark:border-stone-600">
                    <p className="text-sm text-gray-600 dark:text-stone-300 mb-2">
                      {t('debts.principalAmount') || 'Principal Amount'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                      {debt.principalAmount.toLocaleString()} GNF
                    </p>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                      {t('debts.paidAmount') || 'Paid Amount'}
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {debt.paidAmount.toLocaleString()} GNF
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                      {((debt.paidAmount / debt.principalAmount) * 100).toFixed(1)}% paid
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50">
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                      {t('debts.remainingAmount') || 'Remaining Amount'}
                    </p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {debt.remainingAmount.toLocaleString()} GNF
                    </p>
                  </div>
                </div>

                {/* Debt Information */}
                <div className="bg-gray-50 dark:bg-stone-700/50 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-stone-200">
                    {t('debts.debtInformation') || 'Debt Information'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {debt.dueDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className={`w-5 h-5 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-stone-500'}`} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-stone-400 mb-0.5">{t('debts.dueDate') || 'Due Date'}</p>
                          <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-stone-100'}`}>
                            {formatDate(debt.dueDate)}
                            {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-stone-400 mb-0.5">{t('customers.customerType') || 'Customer Type'}</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-stone-100">{debt.customer.customerType}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-stone-400 mb-0.5">{t('debts.createdDate') || 'Created'}</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-stone-100">{formatDate(debt.createdAt)}</p>
                      </div>
                    </div>

                    {debt.sale && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-stone-400 mb-0.5">{t('debts.linkedSale') || 'Linked Sale'}</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-stone-100">
                            {debt.sale.totalGNF.toLocaleString()} GNF
                            <span className="text-xs text-gray-500 ml-2">({formatDate(debt.sale.date)})</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {debt.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-stone-600">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 mt-0.5 text-gray-400 dark:text-stone-500" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">{t('debts.notes') || 'Notes'}</p>
                          <p className="text-sm text-gray-700 dark:text-stone-200 whitespace-pre-wrap">{debt.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Contact */}
                {(debt.customer.email || debt.customer.phone) && (
                  <div className="bg-gray-50 dark:bg-stone-700/50 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-stone-200">
                      {t('customers.contactInformation') || 'Contact Information'}
                    </h3>
                    {debt.customer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400 dark:text-stone-500" />
                        <p className="text-sm text-gray-800 dark:text-stone-100">{debt.customer.email}</p>
                      </div>
                    )}
                    {debt.customer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400 dark:text-stone-500" />
                        <p className="text-sm text-gray-800 dark:text-stone-100">{debt.customer.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {debt.payments.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-stone-600 mb-4" />
                    <p className="text-gray-500 dark:text-stone-400">{t('debts.noPayments') || 'No payments recorded yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {debt.payments.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="bg-gray-50 dark:bg-stone-700 rounded-xl p-4 border border-gray-200 dark:border-stone-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-stone-100">
                                  {payment.amount.toLocaleString()} GNF
                                </p>
                                <p className="text-xs text-gray-500 dark:text-stone-400">
                                  Payment #{debt.payments.length - index}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 ml-11 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-stone-400">{t('debts.paymentMethod') || 'Method'}</p>
                                <p className="text-gray-800 dark:text-stone-100 font-medium">{payment.paymentMethod}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-stone-400">{t('debts.paymentDate') || 'Date'}</p>
                                <p className="text-gray-800 dark:text-stone-100 font-medium">{formatDate(payment.paymentDate)}</p>
                              </div>
                              {payment.receiptNumber && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-stone-400">{t('debts.receiptNumber') || 'Receipt'}</p>
                                  <p className="text-gray-800 dark:text-stone-100 font-medium">{payment.receiptNumber}</p>
                                </div>
                              )}
                              {payment.receivedByName && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-stone-400">{t('debts.receivedBy') || 'Received By'}</p>
                                  <p className="text-gray-800 dark:text-stone-100 font-medium">{payment.receivedByName}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff' && (
            <div className="sticky bottom-0 bg-white dark:bg-stone-800 px-6 py-4 border-t border-gray-200 dark:border-stone-700">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('common.close') || 'Close'}
                </button>
                {isManager && (
                  <button
                    onClick={() => setShowWriteOffConfirm(true)}
                    className="px-6 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                  >
                    {t('debts.writeOff') || 'Write Off'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Write-Off Confirmation Dialog */}
          {showWriteOffConfirm && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
              <div className="bg-white dark:bg-stone-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-stone-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100">
                    {t('debts.confirmWriteOff') || 'Confirm Write-Off'}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-stone-300 mb-4">
                  {t('debts.writeOffWarning') || 'This action will mark the debt as uncollectible. This cannot be undone.'}
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                    {t('debts.writeOffReason') || 'Reason for write-off'} *
                  </label>
                  <textarea
                    value={writeOffReason}
                    onChange={(e) => setWriteOffReason(e.target.value)}
                    placeholder={t('debts.writeOffReasonPlaceholder') || 'e.g., Customer bankruptcy, uncontactable, etc.'}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-stone-900 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 resize-none"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowWriteOffConfirm(false)
                      setWriteOffReason('')
                      setError('')
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleWriteOff}
                    disabled={isSubmitting || !writeOffReason.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? (t('common.processing') || 'Processing...') : (t('debts.confirmWriteOff') || 'Confirm Write-Off')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
