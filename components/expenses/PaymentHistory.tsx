'use client'

import { Banknote, Smartphone, CreditCard, Clock, User, ExternalLink } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

type PaymentMethod = 'Cash' | 'OrangeMoney' | 'Card'

interface ExpensePayment {
  id: string
  amount: number
  paymentMethod: PaymentMethod
  paidAt: string
  paidByName?: string | null
  notes?: string | null
  receiptUrl?: string | null
  bankTransaction?: {
    id: string
    status: 'Pending' | 'Confirmed'
    bankRef?: string | null
  } | null
}

interface PaymentHistoryProps {
  payments: ExpensePayment[]
  totalAmount: number
  loading?: boolean
}

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  Cash: Banknote,
  OrangeMoney: Smartphone,
  Card: CreditCard,
}

const METHOD_COLORS: Record<PaymentMethod, string> = {
  Cash: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  OrangeMoney: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  Card: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
}

export function PaymentHistory({ payments, totalAmount, loading }: PaymentHistoryProps) {
  const { t, locale } = useLocale()

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Calculate running total
  let runningTotal = 0
  const paymentsWithTotal = payments
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())
    .map((payment) => {
      runningTotal += payment.amount
      return { ...payment, runningTotal }
    })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse flex gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-stone-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-stone-700 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-stone-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-stone-600" />
        <p className="text-gray-500 dark:text-stone-400">
          {t('expenses.payment.noPayments') || 'No payments recorded yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-stone-700/50 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-stone-400">
          {t('expenses.payment.totalPaid') || 'Total Paid'}
        </span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(runningTotal)} / {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-stone-700" />

        {/* Payments */}
        <div className="space-y-4">
          {paymentsWithTotal.map((payment, index) => {
            const MethodIcon = METHOD_ICONS[payment.paymentMethod]
            const methodColor = METHOD_COLORS[payment.paymentMethod]

            return (
              <div key={payment.id} className="relative flex gap-4 pl-2">
                {/* Icon */}
                <div className={`relative z-10 p-2.5 rounded-full ${methodColor}`}>
                  <MethodIcon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-stone-100">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-stone-400">
                        {payment.paymentMethod === 'OrangeMoney' ? 'Orange Money' : payment.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-stone-300">
                        {formatDate(payment.paidAt)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-stone-400">
                        {formatTime(payment.paidAt)}
                      </p>
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-stone-400">
                    {payment.paidByName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {payment.paidByName}
                      </span>
                    )}
                    {payment.bankTransaction?.bankRef && (
                      <span>Ref: {payment.bankTransaction.bankRef}</span>
                    )}
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t('expenses.payment.viewReceipt') || 'View Receipt'}
                      </a>
                    )}
                    {payment.bankTransaction?.status === 'Pending' && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                        {t('bank.pending') || 'Pending'}
                      </span>
                    )}
                  </div>

                  {payment.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-stone-400 italic">
                      &ldquo;{payment.notes}&rdquo;
                    </p>
                  )}

                  {/* Running total indicator */}
                  {index < paymentsWithTotal.length - 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-stone-700">
                      <span className="text-xs text-gray-400 dark:text-stone-500">
                        {t('expenses.payment.runningTotal') || 'Running total'}: {formatCurrency(payment.runningTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
