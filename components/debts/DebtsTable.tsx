'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, DollarSign, Clock, TrendingUp, CheckCircle, AlertCircle, Ban } from 'lucide-react'
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
  description: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  payments: Payment[]
}

interface DebtsTableProps {
  debts: Debt[]
  onViewDetails: (debt: Debt) => void
  onRecordPayment: (debt: Debt) => void
  isManager?: boolean
  loading?: boolean
}

type SortField = 'customer' | 'principalAmount' | 'remainingAmount' | 'dueDate' | 'status'
type SortDirection = 'asc' | 'desc'

export default function DebtsTable({ debts, onViewDetails, onRecordPayment, isManager: _isManager, loading }: DebtsTableProps) {
  const { t, locale } = useLocale()
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Skeleton row component for loading state
  const SkeletonRow = ({ index }: { index: number }) => (
    <tr
      className="animate-pulse"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-stone-700 rounded" />
          <div className="h-3 w-24 bg-gray-100 dark:bg-stone-600 rounded" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-stone-700 rounded" />
      </td>
      <td className="px-6 py-4 min-w-[200px]">
        <div className="space-y-2">
          <div className="h-2 w-full bg-gray-200 dark:bg-stone-700 rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded" />
            <div className="h-3 w-16 bg-amber-100 dark:bg-amber-900/30 rounded" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-stone-700 rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-24 bg-gray-200 dark:bg-stone-700 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-stone-700 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-stone-700 rounded-lg" />
        </div>
      </td>
    </tr>
  )

  // Format currency - compact version for table
  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K'
    }
    return amount.toLocaleString(locale === 'fr' ? 'fr-GN' : 'en-GN')
  }

  // Format currency - full version
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Format date using UTC utility to avoid timezone shifts
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return formatUTCDateForDisplay(dateString, locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedDebts = [...debts].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'customer':
        comparison = a.customer.name.localeCompare(b.customer.name)
        break
      case 'principalAmount':
        comparison = a.principalAmount - b.principalAmount
        break
      case 'remainingAmount':
        comparison = a.remainingAmount - b.remainingAmount
        break
      case 'dueDate':
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0
        comparison = aDate - bDate
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const statusConfig = {
    Outstanding: {
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      icon: Clock
    },
    PartiallyPaid: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      icon: TrendingUp
    },
    FullyPaid: {
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle
    },
    Overdue: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: AlertCircle
    },
    WrittenOff: {
      color: 'bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-400 border-gray-200 dark:border-stone-600',
      icon: Ban
    }
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-stone-200 transition-colors group"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4 text-gray-700 dark:text-stone-300" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-700 dark:text-stone-300" />
        )
      ) : (
        <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  )

  // Loading skeleton state
  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-lg border border-gray-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-stone-700 border-b border-gray-200 dark:border-stone-600">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                  {t('customers.customer') || 'Customer'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                  {t('debts.principalAmount') || 'Principal'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider min-w-[200px]">
                  {t('debts.paymentProgress') || 'Progress'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider min-w-[140px]">
                  {t('debts.dueDate') || 'Due Date'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                  {t('debts.status') || 'Status'}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                  {t('common.actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
              {[0, 1, 2, 3, 4].map((index) => (
                <SkeletonRow key={index} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (debts.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-lg border border-gray-200 dark:border-stone-700 p-12 text-center">
        <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-stone-600 mb-4" />
        <p className="text-gray-500 dark:text-stone-400 text-lg">{t('debts.noDebts') || 'No debts found'}</p>
        <p className="text-gray-400 dark:text-stone-500 text-sm mt-2">
          {t('debts.noDebtsDescription') || 'Debts will appear here when credit sales are made'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-lg border border-gray-200 dark:border-stone-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-stone-700 border-b border-gray-200 dark:border-stone-600">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                <SortButton field="customer" label={t('customers.customer') || 'Customer'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                <SortButton field="principalAmount" label={t('debts.principalAmount') || 'Principal'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider min-w-[200px]">
                <SortButton field="remainingAmount" label={t('debts.paymentProgress') || 'Progress'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider min-w-[140px]">
                <SortButton field="dueDate" label={t('debts.dueDate') || 'Due Date'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                <SortButton field="status" label={t('debts.status') || 'Status'} />
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase tracking-wider">
                {t('common.actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
            {sortedDebts.map((debt, index) => {
              const StatusIcon = statusConfig[debt.status].icon
              const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff'
              const progressPercent = debt.principalAmount > 0 ? (debt.paidAmount / debt.principalAmount) * 100 : 0

              return (
                <tr
                  key={debt.id}
                  className="hover:bg-gray-50 dark:hover:bg-stone-900/50 transition-colors group"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-stone-100">
                        {debt.customer.name}
                      </p>
                      {debt.customer.phone && (
                        <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                          {debt.customer.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-stone-500 mt-0.5">
                        {t(`customers.types.${debt.customer.customerType}`) || debt.customer.customerType}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-stone-100">
                      {formatCurrency(debt.principalAmount)}
                    </p>
                  </td>
                  {/* Combined Payment Progress Column */}
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      {/* Progress bar */}
                      <div className="relative h-2 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                            progressPercent >= 100
                              ? 'bg-emerald-500'
                              : progressPercent > 0
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : 'bg-gray-300 dark:bg-stone-600'
                          }`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                        {/* Remaining portion indicator */}
                        {progressPercent > 0 && progressPercent < 100 && (
                          <div
                            className="absolute inset-y-0 right-0 bg-amber-200 dark:bg-amber-900/50 rounded-r-full"
                            style={{ width: `${100 - progressPercent}%` }}
                          />
                        )}
                      </div>
                      {/* Amounts row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatCurrencyCompact(debt.paidAmount)}
                          </span>
                          <span className="text-gray-400 dark:text-stone-500">
                            {t('debts.paid') || 'paid'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {formatCurrencyCompact(debt.remainingAmount)}
                          </span>
                          <span className="text-gray-400 dark:text-stone-500">
                            {t('debts.left') || 'left'}
                          </span>
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-700 dark:text-stone-300'}`}>
                      {formatDate(debt.dueDate)}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                        {t('debts.Overdue') || 'Overdue'}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[debt.status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {t(`debts.${debt.status}`) || debt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetails(debt)}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        title={t('common.viewDetails') || 'View Details'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff' && (
                        <button
                          onClick={() => onRecordPayment(debt)}
                          className="p-2 text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title={t('debts.recordPayment') || 'Record Payment'}
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
