'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChefHat, Package, Coins, Plus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { CriticalIngredientsCard } from './CriticalIngredientsCard'
import { ProductionReadinessCard } from './ProductionReadinessCard'
import { getTodayDateString } from '@/lib/date-utils'

type ProductionStatus = 'Planning' | 'Ready' | 'InProgress' | 'Complete'

interface LowStockItem {
  id: string
  name: string
  nameFr?: string | null
  currentStock: number
  minStock: number
  unit: string
  stockStatus: 'critical' | 'low' | 'ok'
}

interface ProductionLog {
  id: string
  productName: string
  productNameFr?: string | null
  quantity: number
  preparationStatus: ProductionStatus
  date: string
  estimatedCostGNF?: number | null
}

interface BakingDashboardProps {
  onAddProduction?: () => void
}

export function BakingDashboard({ onAddProduction }: BakingDashboardProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    if (!currentRestaurant) return

    try {
      const response = await fetch(
        `/api/inventory?restaurantId=${currentRestaurant.id}&lowStock=true`
      )
      if (response.ok) {
        const data = await response.json()
        setLowStockItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error)
    }
  }, [currentRestaurant])

  // Fetch today's production logs
  const fetchProductionLogs = useCallback(async () => {
    if (!currentRestaurant) return

    try {
      const today = getTodayDateString()
      const response = await fetch(
        `/api/production?restaurantId=${currentRestaurant.id}&dateFrom=${today}&dateTo=${today}`
      )
      if (response.ok) {
        const data = await response.json()
        setProductionLogs(data.productionLogs || [])
      }
    } catch (error) {
      console.error('Error fetching production logs:', error)
    }
  }, [currentRestaurant])

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchLowStockItems(), fetchProductionLogs()])
      setLoading(false)
    }

    if (currentRestaurant) {
      fetchAll()
    }
  }, [currentRestaurant, fetchLowStockItems, fetchProductionLogs])

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: ProductionStatus) => {
    try {
      const response = await fetch(`/api/production/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preparationStatus: newStatus }),
      })

      if (response.ok) {
        // Update local state
        setProductionLogs((prev) =>
          prev.map((log) =>
            log.id === id ? { ...log, preparationStatus: newStatus } : log
          )
        )
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Calculate summary stats
  const todaysProductionCount = productionLogs.length
  const todaysTotalQuantity = productionLogs.reduce((sum, log) => sum + log.quantity, 0)
  const todaysEstimatedCost = productionLogs.reduce(
    (sum, log) => sum + (log.estimatedCostGNF || 0),
    0
  )
  const criticalCount = lowStockItems.filter((i) => i.stockStatus === 'critical').length
  const lowCount = lowStockItems.filter((i) => i.stockStatus === 'low').length

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Production */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
              <ChefHat className="w-5 h-5 text-gray-700 dark:text-stone-300" />
            </div>
            <span className="text-sm text-gray-600 dark:text-stone-400">
              {t('production.todaysProduction') || "Today's Production"}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
            {loading ? '...' : todaysProductionCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-stone-400">
            {t('production.itemsLogged') || 'items logged'} • {todaysTotalQuantity}{' '}
            {t('production.totalUnits') || 'total units'}
          </p>
        </div>

        {/* Ingredient Status */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`p-2.5 rounded-lg ${
                criticalCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30'
                  : lowCount > 0
                    ? 'bg-amber-50 dark:bg-amber-900/30'
                    : 'bg-green-50 dark:bg-green-900/30'
              }`}
            >
              <Package
                className={`w-5 h-5 ${
                  criticalCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : lowCount > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                }`}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-stone-400">
              {t('production.ingredientStatus') || 'Ingredient Status'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
            {loading ? '...' : criticalCount + lowCount === 0 ? (
              <span className="text-green-600 dark:text-green-400">
                {t('production.allGood') || 'All Good'}
              </span>
            ) : (
              criticalCount + lowCount
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-stone-400">
            {criticalCount > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {criticalCount} {t('production.critical') || 'critical'}
              </span>
            )}
            {criticalCount > 0 && lowCount > 0 && ', '}
            {lowCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {lowCount} {t('production.low') || 'low'}
              </span>
            )}
            {criticalCount === 0 && lowCount === 0 && (
              t('production.stockLevelsOk') || 'All stock levels OK'
            )}
          </p>
        </div>

        {/* Estimated Cost */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/30">
              <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-stone-400">
              {t('production.estimatedCost') || 'Est. Ingredient Cost'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
            {loading ? '...' : formatCurrency(todaysEstimatedCost)}
          </p>
          <p className="text-xs text-gray-500 dark:text-stone-400">
            {t('production.forTodaysProduction') || "for today's production"}
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Production Status Card */}
        <ProductionReadinessCard
          productionLogs={productionLogs}
          loading={loading}
          onStatusChange={handleStatusChange}
        />

        {/* Low Stock Alerts Card */}
        <CriticalIngredientsCard items={lowStockItems} loading={loading} />
      </div>

      {/* Quick Add Button (floating on mobile) */}
      {onAddProduction && (
        <button
          onClick={onAddProduction}
          className="
            fixed bottom-6 right-6 md:hidden
            w-14 h-14 rounded-full
            bg-gray-900 dark:bg-white text-white dark:text-gray-900
            shadow-lg
            flex items-center justify-center
            hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95
            transition-all
          "
          aria-label={t('production.logProduction') || 'Log Production'}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

export default BakingDashboard
