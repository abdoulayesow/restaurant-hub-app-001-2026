'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Package,
  Plus,
  History,
  Edit2,
  Calendar,
  DollarSign,
  Truck,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  AlertTriangle,
  Loader2,
  TrendingDown,
  Clock,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { StockStatusBadge, getStockStatus } from './StockStatusBadge'
import { getCategoryLabel } from './CategoryFilter'
import { InventoryItem, RestockPrediction } from './InventoryCard'

interface StockMovement {
  id: string
  type: 'Purchase' | 'Usage' | 'Waste' | 'Adjustment'
  quantity: number
  unitCost: number | null
  reason: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string
}

interface ViewItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  isManager: boolean
  onEdit: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  initialTab?: 'overview' | 'history'
}

// Restock Forecast Card Component
function RestockForecastCard({
  prediction,
  unit,
  t,
}: {
  prediction: RestockPrediction
  unit: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string) => any
}) {
  const { status, daysUntilReorder, dailyUsage, confidence, dataPoints } = prediction

  // Status-based styling
  const statusConfig = {
    reorder_now: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800/60',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-700 dark:text-red-300',
      label: t('inventory.restock.reorderNow') || 'Reorder Now',
      Icon: AlertTriangle,
      animate: true,
    },
    reorder_soon: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/60',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-700 dark:text-amber-300',
      label: t('inventory.restock.reorderIn')?.replace('{days}', String(daysUntilReorder)) || `Reorder in ~${daysUntilReorder} days`,
      Icon: Clock,
      animate: false,
    },
    stable: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      label: daysUntilReorder !== null
        ? (t('inventory.restock.reorderIn')?.replace('{days}', String(daysUntilReorder)) || `Reorder in ~${daysUntilReorder} days`)
        : (t('inventory.restock.stable') || 'Stock Stable'),
      Icon: CheckCircle2,
      animate: false,
    },
    no_data: {
      bg: 'bg-gray-50 dark:bg-stone-800',
      border: 'border-gray-200 dark:border-stone-700',
      iconBg: 'bg-gray-100 dark:bg-stone-700',
      iconColor: 'text-gray-500 dark:text-stone-400',
      textColor: 'text-gray-600 dark:text-stone-400',
      label: t('inventory.restock.noData') || 'No Usage Data',
      Icon: HelpCircle,
      animate: false,
    },
  }

  const config = statusConfig[status]
  const { Icon } = config

  // Confidence badge colors
  const confidenceColors = {
    high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    low: 'bg-gray-100 text-gray-600 dark:bg-stone-700 dark:text-stone-400',
  }

  // Format daily usage
  const formattedUsage = dailyUsage > 0
    ? (t('inventory.restock.dailyUsage')
        ?.replace('{rate}', dailyUsage.toFixed(2))
        ?.replace('{unit}', t(`units.${unit}`) || unit) || `Daily usage: ~${dailyUsage.toFixed(2)} ${unit}/day`)
    : null

  return (
    <div
      className={`
        relative overflow-hidden
        p-4 rounded-lg
        ${config.bg}
        border ${config.border}
        transition-all duration-300
      `}
    >
      {/* Subtle animated pulse for urgent status */}
      {config.animate && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className={`
          shrink-0
          w-10 h-10 rounded-lg
          ${config.iconBg}
          flex items-center justify-center
          ${config.animate ? 'animate-pulse' : ''}
        `}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with title and confidence badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wide">
              {t('inventory.restock.title') || 'Restock Forecast'}
            </span>
            {status !== 'no_data' && (
              <span className={`
                inline-flex items-center gap-1
                px-2 py-0.5 rounded-full
                text-[10px] font-semibold uppercase tracking-wider
                ${confidenceColors[confidence]}
              `}>
                {t(`inventory.restock.${confidence}`) || confidence}
              </span>
            )}
          </div>

          {/* Main status text */}
          <div className={`font-semibold ${config.textColor}`}>
            {config.label}
          </div>

          {/* Daily usage rate */}
          {formattedUsage && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-gray-400 dark:text-stone-500" />
              <span className="text-xs text-gray-500 dark:text-stone-400">
                {formattedUsage}
              </span>
            </div>
          )}

          {/* Data points indicator */}
          {dataPoints > 0 && (
            <div className="text-[10px] text-gray-400 dark:text-stone-500 mt-1">
              {t('inventory.restock.basedOn')?.replace('{count}', String(dataPoints)) || `Based on ${dataPoints} data points`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ViewItemModal({
  isOpen,
  onClose,
  item,
  isManager,
  onEdit,
  onAdjust,
  initialTab = 'overview',
}: ViewItemModalProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>(initialTab)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [movementError, setMovementError] = useState<string | null>(null)

  // Fetch movements when history tab is active
  const fetchMovements = useCallback(async () => {
    if (!item || !currentRestaurant) return

    setLoadingMovements(true)
    setMovementError(null)

    try {
      const response = await fetch(
        `/api/stock-movements?restaurantId=${currentRestaurant.id}&itemId=${item.id}&limit=50`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch movements')
      }

      const data = await response.json()
      setMovements(data.movements || [])
    } catch (err) {
      setMovementError(t('errors.generic'))
      console.error('Error fetching movements:', err)
    } finally {
      setLoadingMovements(false)
    }
  }, [item, currentRestaurant, t])

  // Reset tab when modal opens with new item
  useEffect(() => {
    if (isOpen && item) {
      setActiveTab(initialTab)
      setMovements([])
      setMovementError(null)
    }
  }, [isOpen, item?.id, initialTab])

  // Fetch movements when switching to history tab
  useEffect(() => {
    if (isOpen && item && activeTab === 'history' && movements.length === 0 && !loadingMovements) {
      fetchMovements()
    }
  }, [isOpen, item, activeTab, movements.length, loadingMovements, fetchMovements])

  if (!isOpen || !item) return null

  // Get display name based on locale
  const displayName = locale === 'fr' && item.nameFr ? item.nameFr : item.name
  const altName = locale === 'fr' ? item.name : item.nameFr

  // Calculate stock meter percentage
  const stockRatio = item.minStock > 0 ? (item.currentStock / item.minStock) * 100 : 100
  const meterWidth = Math.min(Math.max(stockRatio, 0), 100)

  // Get status color classes
  const status = item.stockStatus || getStockStatus(item.currentStock, item.minStock)
  const statusColors = {
    critical: {
      border: 'border-l-red-500 dark:border-l-red-400',
      meter: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    low: {
      border: 'border-l-amber-500 dark:border-l-amber-400',
      meter: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    ok: {
      border: 'border-l-emerald-500 dark:border-l-emerald-400',
      meter: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  }
  const colors = statusColors[status]

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-GN') + ' GNF'
  }

  // Format date for movements
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const formatQuantity = (quantity: number) => {
    const sign = quantity > 0 ? '+' : ''
    return `${sign}${quantity.toFixed(2)} ${t(`units.${item.unit}`)}`
  }

  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'Purchase':
        return <ArrowUpCircle className="w-5 h-5 text-green-500" />
      case 'Usage':
        return <ArrowDownCircle className="w-5 h-5 text-blue-500" />
      case 'Waste':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'Adjustment':
        return <RefreshCw className="w-5 h-5 text-amber-500" />
    }
  }

  const getMovementLabel = (type: StockMovement['type']) => {
    const labels: Record<StockMovement['type'], string> = {
      Purchase: t('inventory.purchase'),
      Usage: t('inventory.usage'),
      Waste: t('inventory.waste'),
      Adjustment: t('inventory.adjustment'),
    }
    return labels[type]
  }

  const getQuantityColor = (quantity: number) => {
    return quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="shrink-0 bg-gray-50 dark:bg-stone-800 z-10 border-b border-gray-200 dark:border-stone-700">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-3 rounded-lg ${colors.bg} border-l-4 ${colors.border}`}>
                  <Package className="w-6 h-6 text-gray-600 dark:text-stone-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-stone-100 truncate">
                    {displayName}
                  </h2>
                  {altName && (
                    <p className="text-sm text-gray-500 dark:text-stone-400 truncate mt-0.5">
                      {altName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300">
                      {getCategoryLabel(item.category, t)}
                    </span>
                    <StockStatusBadge status={status} />
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-t border-gray-100 dark:border-stone-700/50">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-stone-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {t('inventory.overview') || 'Overview'}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'history'
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-stone-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <History className="w-4 h-4" />
                {t('inventory.history') || 'History'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Stock Meter */}
              <div className={`p-4 rounded-lg ${colors.bg}`}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-stone-400 font-medium">
                    {t('inventory.stockLevel') || 'Stock Level'}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                    {Math.round(stockRatio)}%
                  </span>
                </div>
                <div className="relative h-2.5 bg-gray-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${colors.meter}`}
                    style={{ width: `${meterWidth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                      {item.currentStock}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-stone-400">
                      {t('inventory.current') || 'Current'} ({item.unit})
                    </div>
                  </div>
                  <div className="h-10 w-px bg-gray-200 dark:bg-stone-700" />
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-gray-700 dark:text-stone-200 tabular-nums">
                      {item.minStock}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-stone-400">
                      {t('inventory.minimum') || 'Minimum'} ({item.unit})
                    </div>
                  </div>
                </div>
              </div>

              {/* Restock Forecast Card */}
              {item.restockPrediction && (
                <RestockForecastCard
                  prediction={item.restockPrediction}
                  unit={item.unit}
                  t={t}
                />
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Reorder Point */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                    <Package className="w-3.5 h-3.5" />
                    {t('inventory.reorderPoint') || 'Reorder Point'}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                    {item.reorderPoint} <span className="text-xs font-normal opacity-70">{item.unit}</span>
                  </div>
                </div>

                {/* Unit Cost */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {t('inventory.unitCost') || 'Unit Cost'}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                    {formatCurrency(item.unitCostGNF)}
                  </div>
                </div>

                {/* Expiry Days */}
                {item.expiryDays && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('inventory.expiryDays') || 'Expiry Days'}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-stone-100 tabular-nums">
                      {item.expiryDays} <span className="text-xs font-normal opacity-70">{t('common.days')}</span>
                    </div>
                  </div>
                )}

                {/* Supplier */}
                {item.supplier && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-stone-400 text-xs font-medium mb-1">
                      <Truck className="w-3.5 h-3.5" />
                      {t('inventory.supplier') || 'Supplier'}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-stone-100 truncate">
                      {item.supplier.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Total Value */}
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-100 dark:bg-stone-800 border border-gray-200 dark:border-stone-700">
                <span className="text-sm text-gray-600 dark:text-stone-300 font-medium">
                  {t('inventory.totalStockValue')}
                </span>
                <span className="font-bold text-gray-900 dark:text-stone-100 tabular-nums">
                  {formatCurrency(item.currentStock * item.unitCostGNF)}
                </span>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div>
              {loadingMovements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                </div>
              ) : movementError ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 mb-4">{movementError}</p>
                  <button
                    onClick={fetchMovements}
                    className="text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-100 font-medium"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                    <History className="w-6 h-6 text-gray-400 dark:text-stone-500" />
                  </div>
                  <p className="text-gray-600 dark:text-stone-400">{t('common.noData')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="bg-gray-50 dark:bg-stone-800 rounded-lg p-4 border border-gray-200 dark:border-stone-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getMovementIcon(movement.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-stone-100">
                                {getMovementLabel(movement.type)}
                              </span>
                              <span className={`font-semibold ${getQuantityColor(movement.quantity)}`}>
                                {formatQuantity(movement.quantity)}
                              </span>
                            </div>
                            {movement.reason && (
                              <p className="text-sm text-gray-600 dark:text-stone-400 mt-1">
                                {movement.reason}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-stone-500">
                              <span>{formatDate(movement.createdAt)}</span>
                              <span className="text-gray-300 dark:text-stone-600">•</span>
                              <span>{movement.createdByName || movement.createdBy}</span>
                            </div>
                          </div>
                        </div>
                        {movement.unitCost !== null && movement.type === 'Purchase' && (
                          <div className="text-right text-sm shrink-0 ml-4">
                            <span className="text-gray-600 dark:text-stone-400 bg-gray-100 dark:bg-stone-700 px-2 py-1 rounded-lg">
                              {new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN').format(movement.unitCost)} GNF/{t(`units.${item.unit}`)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 bg-gray-50 dark:bg-stone-800 p-6 border-t border-gray-200 dark:border-stone-700">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                onAdjust(item)
                onClose()
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('inventory.adjust') || 'Adjust'}
            </button>

            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  onClick={() => {
                    onEdit(item)
                    onClose()
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit') || 'Edit'}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 font-medium transition-colors"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
