'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, TrendingUp, Receipt, ChefHat, Calendar, Clock, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatDateForDisplay } from '@/lib/date-utils'

interface RecentSubmission {
  id: string
  type: 'sale' | 'expense' | 'production'
  date: string
  amount?: number
  description?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  submittedByName?: string
}

interface SubmissionsTableProps {
  submissions: RecentSubmission[]
  loading?: boolean
  onRefresh: () => void
}

type SortField = 'date' | 'type' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'
type FilterType = 'all' | 'sale' | 'expense' | 'production'

export function SubmissionsTable({ submissions, loading = false, onRefresh }: SubmissionsTableProps) {
  const { t, locale } = useLocale()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [displayLimit, setDisplayLimit] = useState(3)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-amber-500" />
    }
  }

  // Get type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'sale':
        return {
          icon: TrendingUp,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          label: t('common.sale') || 'Sale'
        }
      case 'expense':
        return {
          icon: Receipt,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: t('common.expense') || 'Expense'
        }
      case 'production':
        return {
          icon: ChefHat,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          label: t('common.production') || 'Production'
        }
      default:
        return {
          icon: Calendar,
          color: 'text-stone-600',
          bg: 'bg-stone-100',
          label: type
        }
    }
  }

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Filter submissions by type
  const filteredSubmissions = filterType === 'all'
    ? submissions
    : submissions.filter(s => s.type === filterType)

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Paginate
  const displayedSubmissions = sortedSubmissions.slice(0, displayLimit)
  const hasMore = sortedSubmissions.length > displayLimit

  // Determine available submission types (for filter options)
  const availableTypes = new Set(submissions.map(s => s.type))
  const hasSales = availableTypes.has('sale')
  const hasExpenses = availableTypes.has('expense')
  const hasProduction = availableTypes.has('production')
  const showFilter = availableTypes.size > 1 // Only show filter if multiple types exist

  // Sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
          {t('editor.allSubmissions') || 'All Submissions'}
        </h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filter Dropdown - Only show if multiple submission types exist */}
          {showFilter && (
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full sm:w-auto appearance-none pl-9 pr-10 py-2 bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="all">{t('editor.filterAll') || 'All'}</option>
                {hasSales && <option value="sale">{t('editor.filterSales') || 'Sales Only'}</option>}
                {hasExpenses && <option value="expense">{t('editor.filterExpenses') || 'Expenses Only'}</option>}
                {hasProduction && <option value="production">{t('editor.filterProduction') || 'Production Only'}</option>}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
            title={t('common.refresh') || 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedSubmissions.length === 0 ? (
        <div className="text-center py-12 text-stone-500 dark:text-stone-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{t('editor.noSubmissions') || 'No submissions yet'}</p>
          <p className="text-sm mt-1">{t('editor.startByAdding') || 'Start by adding a sale, expense, or production log'}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-700/50">
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      {t('editor.type') || 'Type'}
                      <SortIcon field="type" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      {t('editor.date') || 'Date'}
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700 dark:text-stone-100 hidden md:table-cell">
                    {t('editor.description') || 'Description'}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-stone-700 dark:text-stone-100">
                    {t('editor.amount') || 'Amount'}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-sm font-semibold text-stone-700 dark:text-stone-100 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t('common.status') || 'Status'}
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700 dark:text-stone-100 hidden lg:table-cell">
                    {t('editor.submittedBy') || 'Submitted By'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                {displayedSubmissions.map((submission) => {
                  const typeInfo = getTypeInfo(submission.type)
                  const TypeIcon = typeInfo.icon

                  return (
                    <tr
                      key={`${submission.type}-${submission.id}`}
                      className="hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                            <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                          </div>
                          <span className="font-medium text-stone-900 dark:text-white hidden sm:block">
                            {typeInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                          <Calendar className="w-4 h-4 text-stone-400" />
                          <span>{formatDateForDisplay(submission.date, locale)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-stone-600 dark:text-stone-400 truncate max-w-xs block">
                          {submission.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {submission.amount !== undefined ? (
                          <span className={`font-semibold ${submission.type === 'sale' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-white'}`}>
                            {formatCurrency(submission.amount)}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(submission.status)}
                          <span className={`text-sm font-medium ${
                            submission.status === 'Approved'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : submission.status === 'Rejected'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {t(`common.${submission.status.toLowerCase()}`) || submission.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                          {submission.submittedByName || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="p-4 border-t border-stone-200 dark:border-stone-700 flex justify-center">
              <button
                onClick={() => setDisplayLimit(prev => prev + 20)}
                className="px-4 py-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 rounded-lg transition-colors font-medium text-sm"
              >
                {t('editor.loadMore') || 'Load More'} ({sortedSubmissions.length - displayLimit} {t('editor.remaining') || 'remaining'})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
