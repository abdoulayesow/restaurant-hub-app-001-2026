'use client'

import { useState, useMemo, useCallback } from 'react'
import { AlertTriangle, AlertCircle, TrendingDown, CheckCircle, HelpCircle, ArrowUpDown } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatUTCDateForDisplay } from '@/lib/date-utils'

// After JSON serialization, depletionDate is string | null (not Date | null)
interface SerializedStockForecast {
  itemId: string
  itemName: string
  category: string
  currentStock: number
  unit: string
  dailyAverageUsage: number
  daysUntilDepletion: number | null
  depletionDate: string | null
  status: 'CRITICAL' | 'WARNING' | 'LOW' | 'OK' | 'NO_DATA'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface StockDepletionTableProps {
  forecasts: SerializedStockForecast[]
  pagination?: {
    total: number
    hasMore: boolean
    limit: number
  }
}

type SortField = 'name' | 'stock' | 'usage' | 'daysLeft' | 'status'
type SortDirection = 'asc' | 'desc'
type FilterStatus = 'ALL' | 'CRITICAL' | 'WARNING' | 'LOW' | 'OK' | 'NO_DATA'

export function StockDepletionTable({ forecasts, pagination }: StockDepletionTableProps) {
  const { t, locale } = useLocale()
  const [sortField, setSortField] = useState<SortField>('daysLeft')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')

  const getStatusConfig = useCallback((status: SerializedStockForecast['status']) => {
    switch (status) {
      case 'CRITICAL':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: t('projection.status.critical') || 'Critical',
          priority: 0
        }
      case 'WARNING':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          label: t('projection.status.warning') || 'Warning',
          priority: 1
        }
      case 'LOW':
        return {
          icon: <TrendingDown className="w-4 h-4" />,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          label: t('projection.status.low') || 'Low Stock',
          priority: 2
        }
      case 'OK':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          label: t('projection.status.ok') || 'OK',
          priority: 3
        }
      default:
        return {
          icon: <HelpCircle className="w-4 h-4" />,
          color: 'text-stone-500 dark:text-stone-400',
          bgColor: 'bg-stone-50 dark:bg-stone-900/20',
          borderColor: 'border-stone-200 dark:border-stone-700',
          label: t('projection.status.noData') || 'No Data',
          priority: 4
        }
    }
  }, [t])

  const getConfidenceBadge = (confidence: SerializedStockForecast['confidence']) => {
    const configs = {
      HIGH: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: t('projection.confidenceLevel.high') || 'High' },
      MEDIUM: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30', label: t('projection.confidenceLevel.medium') || 'Medium' },
      LOW: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30', label: t('projection.confidenceLevel.low') || 'Low' }
    }
    const config = configs[confidence]
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedForecasts = useMemo(() => {
    let result = [...forecasts]

    // Filter out rows with no data (all "—" values)
    result = result.filter(f => f.status !== 'NO_DATA')

    // Filter by status
    if (filterStatus !== 'ALL') {
      result = result.filter(f => f.status === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.itemName.localeCompare(b.itemName)
          break
        case 'stock':
          comparison = a.currentStock - b.currentStock
          break
        case 'usage':
          comparison = a.dailyAverageUsage - b.dailyAverageUsage
          break
        case 'daysLeft':
          // Null values go to the end
          if (a.daysUntilDepletion === null && b.daysUntilDepletion === null) return 0
          if (a.daysUntilDepletion === null) return 1
          if (b.daysUntilDepletion === null) return -1
          comparison = a.daysUntilDepletion - b.daysUntilDepletion
          break
        case 'status':
          const aConfig = getStatusConfig(a.status)
          const bConfig = getStatusConfig(b.status)
          comparison = aConfig.priority - bConfig.priority
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [forecasts, filterStatus, sortField, sortDirection, getStatusConfig])

  const statusCounts = useMemo(() => {
    return forecasts.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [forecasts])

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-stone-200 dark:border-stone-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {t('projection.stockDepletion') || 'Stock Depletion Forecast'}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('projection.stockDepletionDescription') || 'Monitor ingredient levels and prevent stockouts'}
            </p>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'CRITICAL', 'WARNING', 'LOW', 'OK', 'NO_DATA'] as FilterStatus[]).map((status) => {
              const count = status === 'ALL' ? forecasts.length : (statusCounts[status] || 0)
              const isActive = filterStatus === status
              const statusConfig = status !== 'ALL' ? getStatusConfig(status as SerializedStockForecast['status']) : null

              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md scale-105'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                  }`}
                >
                  {status === 'ALL' ? t('common.all') || 'All' : statusConfig?.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-700">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {t('projection.ingredient') || 'Ingredient'}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('stock')}
                className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {t('projection.currentStock') || 'Current Stock'}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('usage')}
                className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {t('projection.dailyUsage') || 'Daily Usage'}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('daysLeft')}
                className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {t('projection.daysLeft') || 'Days Left'}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                {t('projection.depletionDate') || 'Depletion Date'}
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {t('projection.statusLabel') || 'Status'}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                {t('projection.confidence') || 'Confidence'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {filteredAndSortedForecasts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <HelpCircle className="w-12 h-12 text-stone-300 dark:text-stone-600" />
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {t('projection.noForecasts') || 'No forecasts match your filter'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedForecasts.map((forecast) => {
                const statusConfig = getStatusConfig(forecast.status)
                return (
                  <tr
                    key={forecast.itemId}
                    className="hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors"
                  >
                    {/* Ingredient Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {forecast.itemName}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {forecast.category}
                        </div>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {forecast.currentStock.toFixed(1)} {forecast.unit}
                      </div>
                    </td>

                    {/* Daily Usage */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-600 dark:text-stone-300">
                        {forecast.dailyAverageUsage > 0
                          ? `${forecast.dailyAverageUsage.toFixed(2)} ${forecast.unit}/day`
                          : '—'}
                      </div>
                    </td>

                    {/* Days Left */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${statusConfig.color}`}>
                        {forecast.daysUntilDepletion !== null
                          ? `${forecast.daysUntilDepletion} ${t('projection.days') || 'days'}`
                          : '—'}
                      </div>
                    </td>

                    {/* Depletion Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-600 dark:text-stone-300">
                        {forecast.depletionDate
                          ? formatUTCDateForDisplay(
                              forecast.depletionDate,
                              locale === 'fr' ? 'fr-GN' : 'en-GN',
                              { month: 'short', day: 'numeric', year: 'numeric' }
                            )
                          : '—'
                        }
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getConfidenceBadge(forecast.confidence)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      {filteredAndSortedForecasts.length > 0 && (
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>
              {t('projection.showingResults') || 'Showing'} {filteredAndSortedForecasts.length} {t('projection.of') || 'of'} {pagination?.total ?? forecasts.length} {t('projection.items') || 'items'}
              {pagination?.hasMore && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  ({t('projection.moreItemsAvailable') || 'more items available'})
                </span>
              )}
            </span>
            <span>
              {t('projection.sortedBy') || 'Sorted by'}: <span className="font-semibold capitalize">{sortField}</span> ({sortDirection === 'asc' ? '↑' : '↓'})
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
