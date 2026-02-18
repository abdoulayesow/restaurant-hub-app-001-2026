'use client'

import { Wallet, CheckCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { CashRunwayData } from '@/lib/projection-utils'
import { formatCurrencyCompact } from '@/lib/currency-utils'

interface CashRunwayCardProps {
  data: CashRunwayData
}

const INFINITE_RUNWAY = -1

function isInfiniteRunway(days: number | null): boolean {
  return days === null || days === INFINITE_RUNWAY || days === Infinity
}

export function CashRunwayCard({ data }: CashRunwayCardProps) {
  const { t, locale } = useLocale()

  const formatDays = (days: number | null) => {
    if (isInfiniteRunway(days)) return t('projection.profitable') || 'Profitable'
    return Math.floor(days!).toString()
  }

  const allProfitable =
    isInfiniteRunway(data.scenarios.optimistic) &&
    isInfiniteRunway(data.scenarios.expected) &&
    isInfiniteRunway(data.scenarios.conservative)

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-emerald-500/10">
          <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
            {t('projection.cashRunway') || 'Cash Runway'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {formatCurrencyCompact(data.currentBalance, locale)}
          </p>
        </div>
      </div>

      {allProfitable ? (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <div className="p-2 rounded-full bg-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t('projection.cashRunwayProfitable') || 'Business is profitable'}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('projection.cashRunwayProfitableDescription') || 'Revenue exceeds expenses across all scenarios'}
          </p>
        </div>
      ) : (
        /* Scenarios - Compact Grid */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-stone-600 dark:text-stone-300">
                {t('projection.optimistic') || 'Best'}
              </span>
            </div>
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {formatDays(data.scenarios.optimistic)}{!isInfiniteRunway(data.scenarios.optimistic) && ` ${t('projection.days') || 'd'}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-stone-600 dark:text-stone-300">
                {t('projection.expected') || 'Expected'}
              </span>
            </div>
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {formatDays(data.scenarios.expected)}{!isInfiniteRunway(data.scenarios.expected) && ` ${t('projection.days') || 'd'}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-stone-600 dark:text-stone-300">
                {t('projection.conservative') || 'Worst'}
              </span>
            </div>
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {formatDays(data.scenarios.conservative)}{!isInfiniteRunway(data.scenarios.conservative) && ` ${t('projection.days') || 'd'}`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
