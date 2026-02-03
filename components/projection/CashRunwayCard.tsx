'use client'

import { Wallet } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { CashRunwayData } from '@/lib/projection-utils'
import { formatCurrencyCompact } from '@/lib/currency-utils'

interface CashRunwayCardProps {
  data: CashRunwayData
  palette: 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
}

export function CashRunwayCard({ data }: CashRunwayCardProps) {
  const { t, locale } = useLocale()

  const formatDays = (days: number) => {
    if (days === Infinity) return '∞'
    return Math.floor(days).toString()
  }

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

      {/* Scenarios - Compact Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-stone-600 dark:text-stone-300">
              {t('projection.optimistic') || 'Best'}
            </span>
          </div>
          <span className="font-bold text-stone-900 dark:text-stone-100">
            {formatDays(data.scenarios.optimistic)} {t('projection.days') || 'd'}
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
            {formatDays(data.scenarios.expected)} {t('projection.days') || 'd'}
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
            {formatDays(data.scenarios.conservative)} {t('projection.days') || 'd'}
          </span>
        </div>
      </div>
    </div>
  )
}
