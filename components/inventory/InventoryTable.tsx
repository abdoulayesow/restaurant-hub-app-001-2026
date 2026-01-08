'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, Plus, Minus, History, ChevronUp, ChevronDown, Eye } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { StockStatusBadge, StockStatus } from './StockStatusBadge'
import { getCategoryLabel } from './CategoryFilter'

export interface InventoryItem {
  id: string
  name: string
  nameFr: string | null
  category: string
  unit: string
  currentStock: number
  minStock: number
  reorderPoint: number
  unitCostGNF: number
  supplierId: string | null
  supplier: { id: string; name: string } | null
  expiryDays: number | null
  isActive: boolean
  stockStatus: StockStatus
  createdAt: string
  updatedAt: string
}

interface InventoryTableProps {
  items: InventoryItem[]
  isManager: boolean
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
}

type SortField = 'name' | 'category' | 'currentStock' | 'minStock' | 'unitCostGNF'
type SortDirection = 'asc' | 'desc'

export function InventoryTable({
  items,
  isManager,
  onEdit,
  onDelete,
  onAdjust,
  onViewHistory,
}: InventoryTableProps) {
  const { t, locale } = useLocale()
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Handle row click to navigate to detail page
  const handleRowClick = (itemId: string) => {
    router.push(`/inventory/${itemId}`)
  }

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal: string | number = a[sortField]
    let bVal: string | number = b[sortField]

    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    // Handle number comparison
    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const getItemName = (item: InventoryItem) => {
    if (locale === 'fr' && item.nameFr) {
      return item.nameFr
    }
    return item.name
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t('inventory.noItems')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('inventory.itemName')}
                <SortIcon field="name" />
              </th>
              <th
                onClick={() => handleSort('category')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('inventory.category')}
                <SortIcon field="category" />
              </th>
              <th
                onClick={() => handleSort('currentStock')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('inventory.currentStock')}
                <SortIcon field="currentStock" />
              </th>
              <th
                onClick={() => handleSort('minStock')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('inventory.minStock')}
                <SortIcon field="minStock" />
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.status')}
              </th>
              <th
                onClick={() => handleSort('unitCostGNF')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hidden sm:table-cell"
              >
                {t('inventory.unitCost')}
                <SortIcon field="unitCostGNF" />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item.id)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getItemName(item)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.supplier?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getCategoryLabel(item.category, t)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                  {item.currentStock} {t(`units.${item.unit}`)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                  {item.minStock} {t(`units.${item.unit}`)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <StockStatusBadge status={item.stockStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100 hidden sm:table-cell">
                  {formatCurrency(item.unitCostGNF)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(item.id)
                      }}
                      className="p-2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('common.view') + ' ' + t('common.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAdjust(item)
                      }}
                      className="p-2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('inventory.adjust')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewHistory(item)
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('inventory.movementHistory')}
                    >
                      <History className="w-4 h-4" />
                    </button>
                    {isManager && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(item)
                          }}
                          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(item)
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
