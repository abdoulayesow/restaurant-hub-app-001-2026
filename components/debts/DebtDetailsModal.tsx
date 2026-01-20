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
  const { t, locale } = useLocale()
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
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-terracotta-50 to-terracotta-100 dark:from-gray-900 dark:to-gray-800 px-6 py-5 border-b border-terracotta-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-terracotta-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {t('debts.debtDetails') || 'Debt Details'}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig[debt.status].color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {debt.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
              className="p-2 hover:bg-terracotta-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-terracotta-600 text-terracotta-600 dark:text-terracotta-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('debts.details') || 'Details'}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'payments'
                  ? 'border-terracotta-600 text-terracotta-600 dark:text-terracotta-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {t('debts.principalAmount') || 'Principal Amount'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {debt.principalAmount.toLocaleString()} GNF
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                    {t('debts.paidAmount') || 'Paid Amount'}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {debt.paidAmount.toLocaleString()} GNF
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    {((debt.paidAmount / debt.principalAmount) * 100).toFixed(1)}% paid
                  </p>
                </div>

                <div className="bg-gradient-to-br from-terracotta-50 to-white dark:from-terracotta-900/20 dark:to-gray-800 rounded-lg p-4 border border-terracotta-200 dark:border-terracotta-800">
                  <p className="text-xs text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wide mb-2">
                    {t('debts.remainingAmount') || 'Remaining Amount'}
                  </p>
                  <p className="text-2xl font-bold text-terracotta-700 dark:text-terracotta-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {debt.remainingAmount.toLocaleString()} GNF
                  </p>
                </div>
              </div>

              {/* Debt Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('debts.debtInformation') || 'Debt Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {debt.dueDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className={`w-5 h-5 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('debts.dueDate') || 'Due Date'}</p>
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                          {formatDate(debt.dueDate)}
                          {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('customers.customerType') || 'Customer Type'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{debt.customer.customerType}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('debts.createdDate') || 'Created'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(debt.createdAt)}</p>
                    </div>
                  </div>

                  {debt.sale && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('debts.linkedSale') || 'Linked Sale'}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {debt.sale.totalGNF.toLocaleString()} GNF
                          <span className="text-xs text-gray-500 ml-2">({formatDate(debt.sale.date)})</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {debt.notes && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('debts.notes') || 'Notes'}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{debt.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Contact */}
              {(debt.customer.email || debt.customer.phone) && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('customers.contactInformation') || 'Contact Information'}
                  </h3>
                  {debt.customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">{debt.customer.email}</p>
                    </div>
                  )}
                  {debt.customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">{debt.customer.phone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {debt.payments.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('debts.noPayments') || 'No payments recorded yet'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debt.payments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {payment.amount.toLocaleString()} GNF
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Payment #{debt.payments.length - index}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 ml-11 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('debts.paymentMethod') || 'Method'}</p>
                              <p className="text-gray-900 dark:text-white font-medium">{payment.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('debts.paymentDate') || 'Date'}</p>
                              <p className="text-gray-900 dark:text-white font-medium">{formatDate(payment.paymentDate)}</p>
                            </div>
                            {payment.receiptNumber && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('debts.receiptNumber') || 'Receipt'}</p>
                                <p className="text-gray-900 dark:text-white font-medium">{payment.receiptNumber}</p>
                              </div>
                            )}
                            {payment.receivedByName && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('debts.receivedBy') || 'Received By'}</p>
                                <p className="text-gray-900 dark:text-white font-medium">{payment.receivedByName}</p>
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
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.close') || 'Close'}
              </button>
              {isManager && (
                <button
                  onClick={() => setShowWriteOffConfirm(true)}
                  className="px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                >
                  {t('debts.writeOff') || 'Write Off'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Write-Off Confirmation Dialog */}
      {showWriteOffConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('debts.confirmWriteOff') || 'Confirm Write-Off'}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('debts.writeOffWarning') || 'This action will mark the debt as uncollectible. This cannot be undone.'}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('debts.writeOffReason') || 'Reason for write-off'} *
              </label>
              <textarea
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                placeholder={t('debts.writeOffReasonPlaceholder') || 'e.g., Customer bankruptcy, uncontactable, etc.'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleWriteOff}
                disabled={isSubmitting || !writeOffReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? (t('common.processing') || 'Processing...') : (t('debts.confirmWriteOff') || 'Confirm Write-Off')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
