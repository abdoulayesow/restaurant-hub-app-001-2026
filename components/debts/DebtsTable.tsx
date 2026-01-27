'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, DollarSign, Clock, TrendingUp, CheckCircle, AlertCircle, Ban } from 'lucide-react'
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

export default function DebtsTable({ debts, onViewDetails, onRecordPayment, isManager: _isManager, loading: _loading }: DebtsTableProps) {
  const { t } = useLocale()
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      icon: Ban
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
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

  if (debts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">{t('debts.noDebts') || 'No debts found'}</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          {t('debts.noDebtsDescription') || 'Debts will appear here when credit sales are made'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-stone-700 border-b border-gray-200 dark:border-stone-600">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="customer" label={t('customers.customer') || 'Customer'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="principalAmount" label={t('debts.principalAmount') || 'Principal'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('debts.paidAmount') || 'Paid'}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="remainingAmount" label={t('debts.remainingAmount') || 'Remaining'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="dueDate" label={t('debts.dueDate') || 'Due Date'} />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="status" label={t('debts.status') || 'Status'} />
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('common.actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedDebts.map((debt, index) => {
              const StatusIcon = statusConfig[debt.status].icon
              const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'FullyPaid' && debt.status !== 'WrittenOff'

              return (
                <tr
                  key={debt.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {debt.customer.name}
                      </p>
                      {debt.customer.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {debt.customer.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {debt.customer.customerType}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {debt.principalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">GNF</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {debt.paidAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {((debt.paidAmount / debt.principalAmount) * 100).toFixed(0)}%
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {debt.remainingAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">GNF</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {formatDate(debt.dueDate)}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                        Overdue
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[debt.status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {debt.status}
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
                          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          {t('debts.recordPayment') || 'Pay'}
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
