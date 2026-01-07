'use client'

import Link from 'next/link'
import { Clock, CheckCircle, Receipt } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Deposit {
  id: string
  date: string
  amount: number
  status: 'Pending' | 'Deposited'
  saleId?: string | null
  sale?: {
    id: string
    date: string
    totalGNF: number
  } | null
  comments?: string | null
  bankRef?: string | null
  receiptUrl?: string | null
  depositedAt?: string | null
  depositedBy: string
  depositedByName?: string | null
}

interface DepositCardProps {
  deposit: Deposit
  onMarkDeposited: (depositId: string) => void
  canEdit: boolean
}

export function DepositCard({ deposit, onMarkDeposited, canEdit }: DepositCardProps) {
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const getStatusBadge = () => {
    if (deposit.status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="w-3 h-3" />
          {t('bank.pending') || 'Pending'}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        {t('bank.deposited') || 'Deposited'}
      </span>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header: Date + Status Badge */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(deposit.date)}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-cream-100">{formatCurrency(deposit.amount)}</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Bank Reference (if deposited) */}
      {deposit.bankRef && (
        <div className="mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('bank.bankRef') || 'Bank Ref'}:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-cream-100 ml-2">{deposit.bankRef}</span>
        </div>
      )}

      {/* Linked Sale Info */}
      {deposit.sale && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <Link
            href={`/sales/${deposit.sale.id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('bank.sale') || 'Sale'}: {formatDate(deposit.sale.date)} - {formatCurrency(deposit.sale.totalGNF)}
          </Link>
        </div>
      )}

      {/* Comments */}
      {deposit.comments && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">"{deposit.comments}"</p>
      )}

      {/* Deposited Info */}
      {deposit.status === 'Deposited' && deposit.depositedAt && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('bank.depositedOn') || 'Deposited on'} {formatDate(deposit.depositedAt)}
        </p>
      )}

      {/* Action Buttons */}
      {canEdit && deposit.status === 'Pending' && (
        <button
          onClick={() => onMarkDeposited(deposit.id)}
          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {t('bank.markAsDeposited') || 'Mark as Deposited'}
        </button>
      )}
    </div>
  )
}
