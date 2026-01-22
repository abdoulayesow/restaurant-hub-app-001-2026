'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  Trash2,
  Settings,
  ExternalLink,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { MovementType } from '@prisma/client'

interface StockMovement {
  id: string
  type: MovementType
  quantity: number
  unitCost: number | null
  reason: string | null
  createdByName: string | null
  createdAt: string
  productionLogId: string | null
  expenseId: string | null
  productionLog?: {
    id: string
    productName: string
  } | null
  expense?: {
    id: string
    description: string | null
  } | null
}

interface StockMovementHistoryProps {
  movements: StockMovement[]
  unit: string
  initialStock?: number
}

export default function StockMovementHistory({
  movements,
  unit,
  initialStock = 0,
}: StockMovementHistoryProps) {
  const { t, locale } = useLocale()
  const { currentPalette } = useRestaurant()

  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filter movements by type
  const filteredMovements =
    typeFilter === 'all'
      ? movements
      : movements.filter((m) => m.type === typeFilter)

  // Paginate
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  // Note: Pagination is calculated but display uses movementsWithBalance
  // const paginatedMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage)

  // Calculate running balance (from oldest to newest, then reverse for display)
  const reversedMovements = [...filteredMovements].reverse()
  const movementsWithBalance: (StockMovement & { runningBalance: number })[] = []

  for (let index = 0; index < reversedMovements.length; index++) {
    const movement = reversedMovements[index]
    const previousBalance = index === 0
      ? initialStock
      : movementsWithBalance[index - 1].runningBalance

    const runningBalance = previousBalance + movement.quantity

    movementsWithBalance.push({
      ...movement,
      runningBalance,
    })
  }

  movementsWithBalance.reverse()

  const paginatedWithBalance = movementsWithBalance.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case 'Purchase':
        return ArrowUpCircle
      case 'Usage':
        return ArrowDownCircle
      case 'Waste':
        return Trash2
      case 'Adjustment':
        return Settings
      default:
        return Package
    }
  }

  const getMovementColor = (type: MovementType) => {
    switch (type) {
      case 'Purchase':
        return 'text-green-600 dark:text-green-400'
      case 'Usage':
        return 'text-blue-600 dark:text-blue-400'
      case 'Waste':
        return 'text-red-600 dark:text-red-400'
      case 'Adjustment':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('inventory.movementHistory')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No stock movements recorded yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('inventory.movementHistory')}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredMovements.length} {filteredMovements.length === 1 ? 'movement' : 'movements'}
          </span>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'all'
                ? `bg-${currentPalette}-600 text-white`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('common.all')}
          </button>
          <button
            onClick={() => setTypeFilter('Purchase')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'Purchase'
                ? `bg-${currentPalette}-600 text-white`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('inventory.purchase')}
          </button>
          <button
            onClick={() => setTypeFilter('Usage')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'Usage'
                ? `bg-${currentPalette}-600 text-white`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('inventory.usage')}
          </button>
          <button
            onClick={() => setTypeFilter('Waste')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'Waste'
                ? `bg-${currentPalette}-600 text-white`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('inventory.waste')}
          </button>
          <button
            onClick={() => setTypeFilter('Adjustment')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'Adjustment'
                ? `bg-${currentPalette}-600 text-white`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('inventory.adjustment')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Running Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reason/Link
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created By
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedWithBalance.map((movement) => {
              const Icon = getMovementIcon(movement.type)
              const color = getMovementColor(movement.type)

              return (
                <tr
                  key={movement.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(movement.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className={`text-sm font-medium ${color}`}>
                        {t(`inventory.${movement.type.toLowerCase()}`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`text-sm font-semibold ${
                        movement.quantity > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {movement.quantity > 0 ? '+' : ''}
                      {movement.quantity} {unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {movement.unitCost
                      ? `${movement.unitCost.toLocaleString()} GNF`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    {movement.runningBalance.toFixed(2)} {unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {movement.productionLogId && movement.productionLog ? (
                      <Link
                        href={`/baking/production/${movement.productionLogId}`}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {movement.productionLog.productName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : movement.expenseId && movement.expense ? (
                      <Link
                        href={`/finances/expenses?id=${movement.expenseId}`}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {movement.expense.description || 'Expense'}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : movement.reason ? (
                      movement.reason
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {movement.createdByName || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, filteredMovements.length)} of{' '}
              {filteredMovements.length} movements
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
