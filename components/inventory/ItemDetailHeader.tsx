'use client'

import { Package, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

interface ItemDetailHeaderProps {
  item: {
    id: string
    name: string
    nameFr?: string | null
    category: string
    unit: string
    currentStock: number
    minStock: number
    unitCostGNF: number
    supplier?: {
      name: string
    } | null
  }
  onAdjustStock?: () => void
}

export default function ItemDetailHeader({
  item,
  onAdjustStock,
}: ItemDetailHeaderProps) {
  const { t, locale } = useLocale()
  const { currentPalette } = useBakery()

  const itemName = locale === 'fr' && item.nameFr ? item.nameFr : item.name

  // Calculate stock status
  const stockPercentage = item.minStock > 0
    ? (item.currentStock / item.minStock) * 100
    : 100

  const getStockStatus = () => {
    if (item.currentStock <= 0) {
      return {
        label: t('inventory.critical'),
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: AlertCircle,
      }
    } else if (item.currentStock < item.minStock) {
      return {
        label: t('inventory.lowStock'),
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        icon: AlertTriangle,
      }
    } else {
      return {
        label: t('inventory.inStock'),
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        icon: CheckCircle,
      }
    }
  }

  const status = getStockStatus()
  const StatusIcon = status.icon

  // Calculate total stock value
  const stockValue = item.currentStock * item.unitCostGNF

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 bg-${currentPalette}-50 dark:bg-${currentPalette}-900/20 rounded-lg`}>
              <Package className={`w-8 h-8 text-${currentPalette}-600 dark:text-${currentPalette}-400`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {itemName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.category} • {item.unit}
                {item.supplier && (
                  <>
                    {' • '}
                    {t('inventory.supplier')}: {item.supplier.name}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor}`}>
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Progress Bar */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('inventory.currentStock')}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('inventory.minStock')}: {item.minStock} {item.unit}
          </span>
        </div>
        <div className="relative">
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                stockPercentage >= 100
                  ? 'bg-green-500'
                  : stockPercentage >= 50
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.currentStock}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              {item.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('inventory.unitCost')}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {item.unitCostGNF.toLocaleString()} GNF
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Stock Value
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {stockValue.toLocaleString()} GNF
          </p>
        </div>
        <div className="flex items-end justify-end">
          {onAdjustStock && (
            <button
              onClick={onAdjustStock}
              className={`px-4 py-2 bg-${currentPalette}-600 text-white rounded-lg hover:bg-${currentPalette}-700 transition-colors`}
            >
              {t('inventory.adjust')} {t('inventory.currentStock')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
