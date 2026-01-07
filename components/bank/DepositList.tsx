'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { DepositCard } from './DepositCard'

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

interface DepositListProps {
  deposits: Deposit[]
  onMarkDeposited: (depositId: string) => void
  canEdit: boolean
  loading?: boolean
}

export function DepositList({ deposits, onMarkDeposited, canEdit, loading }: DepositListProps) {
  const { t } = useLocale()
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Deposited'>('All')

  // Filter deposits by status
  const filteredDeposits = deposits.filter(d => {
    if (statusFilter === 'All') return true
    return d.status === statusFilter
  })

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['All', 'Pending', 'Deposited'] as const).map((status) => {
          const count = status === 'All'
            ? deposits.length
            : deposits.filter(d => d.status === status).length

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                statusFilter === status
                  ? 'border-terracotta-500 text-terracotta-600 dark:text-terracotta-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t(`bank.${status.toLowerCase()}`) || status}
              <span className="ml-2 text-xs text-gray-400">
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600"></div>
        </div>
      ) : filteredDeposits.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('bank.noDeposits') || 'No deposits found'}
          </p>
        </div>
      ) : (
        /* Deposit Cards Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeposits.map((deposit) => (
            <DepositCard
              key={deposit.id}
              deposit={deposit}
              onMarkDeposited={onMarkDeposited}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
