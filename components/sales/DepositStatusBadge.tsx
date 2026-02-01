'use client'

import React from 'react'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface BankTransaction {
  id: string
  status: 'Pending' | 'Confirmed'
  confirmedAt?: string | null
  method: 'Cash' | 'OrangeMoney' | 'Card'
}

interface DepositStatusBadgeProps {
  sale: {
    cashGNF: number
    orangeMoneyGNF: number
    cardGNF: number
    status: 'Pending' | 'Approved' | 'Rejected'
    bankTransactions?: BankTransaction[]
  }
  size?: 'sm' | 'md'
}

export function DepositStatusBadge({ sale, size = 'md' }: DepositStatusBadgeProps) {
  const { t } = useLocale()

  // If sale not approved, show pending approval
  if (sale.status !== 'Approved') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}>
        <AlertCircle className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-stone-400 dark:text-stone-500`} />
        <span className="font-medium text-stone-600 dark:text-stone-400">
          {t('sales.pendingApproval') || 'Pending approval'}
        </span>
      </div>
    )
  }

  // Check if cash has been deposited
  const hasCashDeposit = sale.bankTransactions?.some(
    txn => txn.method === 'Cash' && txn.status === 'Confirmed'
  ) || false

  const badges: React.ReactElement[] = []

  // Orange Money - Auto-deposited when approved
  if (sale.orangeMoneyGNF > 0) {
    badges.push(
      <div
        key="orange"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 ${
          size === 'sm' ? 'text-xs' : 'text-xs'
        }`}
        title={t('sales.autoDepositedOrange') || 'Orange Money auto-deposited on approval'}
      >
        <CheckCircle2 className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
        <span className="font-semibold text-emerald-700 dark:text-emerald-300 tracking-tight">
          Orange
        </span>
      </div>
    )
  }

  // Card - Auto-deposited when approved
  if (sale.cardGNF > 0) {
    badges.push(
      <div
        key="card"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 ${
          size === 'sm' ? 'text-xs' : 'text-xs'
        }`}
        title={t('sales.autoDepositedCard') || 'Card payment auto-deposited on approval'}
      >
        <CheckCircle2 className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
        <span className="font-semibold text-emerald-700 dark:text-emerald-300 tracking-tight">
          Card
        </span>
      </div>
    )
  }

  // Cash - Manual deposit required
  if (sale.cashGNF > 0) {
    if (hasCashDeposit) {
      badges.push(
        <div
          key="cash"
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 ${
            size === 'sm' ? 'text-xs' : 'text-xs'
          }`}
          title={t('sales.cashDeposited') || 'Cash deposited and confirmed'}
        >
          <CheckCircle2 className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
          <span className="font-semibold text-emerald-700 dark:text-emerald-300 tracking-tight">
            Cash
          </span>
        </div>
      )
    } else {
      badges.push(
        <div
          key="cash"
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 animate-pulse ${
            size === 'sm' ? 'text-xs' : 'text-xs'
          }`}
          title={t('sales.cashPendingDeposit') || 'Cash awaiting deposit'}
        >
          <Clock className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-600 dark:text-amber-400`} />
          <span className="font-semibold text-amber-700 dark:text-amber-300 tracking-tight">
            Cash
          </span>
        </div>
      )
    }
  }

  // If no payment methods with amounts, show "No deposits"
  if (badges.length === 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}>
        <span className="text-stone-500 dark:text-stone-400">—</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges}
    </div>
  )
}
