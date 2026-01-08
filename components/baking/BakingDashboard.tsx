'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChefHat, Package, Coins, Plus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'
import { CriticalIngredientsCard } from './CriticalIngredientsCard'
import { ProductionReadinessCard } from './ProductionReadinessCard'

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
  const { currentBakery } = useBakery()

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    if (!currentBakery) return

    try {
      const response = await fetch(
        `/api/inventory?bakeryId=${currentBakery.id}&lowStock=true`
      )
      if (response.ok) {
        const data = await response.json()
        setLowStockItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error)
    }
  }, [currentBakery])

  // Fetch today's production logs
  const fetchProductionLogs = useCallback(async () => {
    if (!currentBakery) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(
        `/api/production?bakeryId=${currentBakery.id}&dateFrom=${today}&dateTo=${today}`
      )
      if (response.ok) {
        const data = await response.json()
        setProductionLogs(data.productionLogs || [])
      }
    } catch (error) {
      console.error('Error fetching production logs:', error)
    }
  }, [currentBakery])

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchLowStockItems(), fetchProductionLogs()])
      setLoading(false)
    }

    if (currentBakery) {
      fetchAll()
    }
  }, [currentBakery, fetchLowStockItems, fetchProductionLogs])

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
        <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
              <ChefHat className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" />
            </div>
            <span className="text-sm text-terracotta-600/80 dark:text-cream-300/80">
              {t('production.todaysProduction') || "Today's Production"}
            </span>
          </div>
          <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
            {loading ? '...' : todaysProductionCount}
          </p>
          <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
            {t('production.itemsLogged') || 'items logged'} • {todaysTotalQuantity}{' '}
            {t('production.totalUnits') || 'total units'}
          </p>
        </div>

        {/* Ingredient Status */}
        <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`p-2.5 rounded-xl ${
                criticalCount > 0
                  ? 'bg-red-500/10 dark:bg-red-400/10'
                  : lowCount > 0
                    ? 'bg-amber-500/10 dark:bg-amber-400/10'
                    : 'bg-green-500/10 dark:bg-green-400/10'
              }`}
            >
              <Package
                className={`w-5 h-5 ${
                  criticalCount > 0
                    ? 'text-red-500 dark:text-red-400'
                    : lowCount > 0
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-green-500 dark:text-green-400'
                }`}
              />
            </div>
            <span className="text-sm text-terracotta-600/80 dark:text-cream-300/80">
              {t('production.ingredientStatus') || 'Ingredient Status'}
            </span>
          </div>
          <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
            {loading ? '...' : criticalCount + lowCount === 0 ? (
              <span className="text-green-600 dark:text-green-400">
                {t('production.allGood') || 'All Good'}
              </span>
            ) : (
              criticalCount + lowCount
            )}
          </p>
          <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
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
        <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 dark:bg-green-400/10">
              <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-terracotta-600/80 dark:text-cream-300/80">
              {t('production.estimatedCost') || 'Est. Ingredient Cost'}
            </span>
          </div>
          <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
            {loading ? '...' : formatCurrency(todaysEstimatedCost)}
          </p>
          <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
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
            bg-terracotta-500 text-white
            shadow-lg shadow-terracotta-500/30
            flex items-center justify-center
            hover:bg-terracotta-600 active:scale-95
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
