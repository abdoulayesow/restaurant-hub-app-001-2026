'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Activity,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Settings,
  ArrowRightCircle,
  ArrowLeftCircle,
  Package,
  Calendar,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { MovementType } from '@prisma/client'
import { formatDateForDisplay, isToday, isYesterday } from '@/lib/date-utils'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface StockMovement {
  id: string
  type: MovementType
  quantity: number
  unitCost: number | null
  reason: string | null
  createdByName: string | null
  createdAt: string
  item: {
    id: string
    name: string
    nameFr: string | null
    unit: string
  }
}

interface MovementSummary {
  totalPurchases: number
  totalUsage: number
  totalWaste: number
  totalAdjustments: number
  netChange: number
  movementsByType: Array<{
    type: MovementType
    count: number
    totalQuantity: number
  }>
  totalMovements: number
  topItems?: Array<{
    itemId: string
    name: string
    movementCount: number
  }>
}

interface StockMovementPanelProps {
  isOpen: boolean
  onClose: () => void
}

type DateRange = '7d' | '30d' | '90d'
type ViewMode = 'list' | 'chart'

const MOVEMENT_COLORS: Record<MovementType, string> = {
  Purchase: '#059669', // green-600
  Usage: '#2563eb', // blue-600
  Waste: '#dc2626', // red-600
  Adjustment: '#ea580c', // orange-600
  TransferOut: '#d97706', // amber-600
  TransferIn: '#10b981', // emerald-500
}

const CHART_COLORS = [
  '#059669',
  '#2563eb',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#10b981',
]

export default function StockMovementPanel({
  isOpen,
  onClose,
}: StockMovementPanelProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [summary, setSummary] = useState<MovementSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const getDateRangeParams = useCallback(() => {
    const now = new Date()
    const startDate = new Date()

    switch (dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    }
  }, [dateRange])

  const fetchData = useCallback(async () => {
    if (!currentRestaurant || !isOpen) return

    setLoading(true)

    try {
      const { startDate, endDate } = getDateRangeParams()

      const [movementsRes, summaryRes] = await Promise.all([
        fetch(
          `/api/stock-movements?restaurantId=${currentRestaurant.id}&startDate=${startDate}&endDate=${endDate}&limit=100`
        ),
        fetch(
          `/api/stock-movements/summary?restaurantId=${currentRestaurant.id}&startDate=${startDate}&endDate=${endDate}`
        ),
      ])

      if (movementsRes.ok) {
        const data = await movementsRes.json()
        setMovements(data.movements || [])
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant, isOpen, getDateRangeParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      case 'TransferOut':
        return ArrowRightCircle
      case 'TransferIn':
        return ArrowLeftCircle
      default:
        return Package
    }
  }

  const getMovementLabel = (type: MovementType) => {
    switch (type) {
      case 'TransferOut':
        return t('inventory.transfer.transferOut')
      case 'TransferIn':
        return t('inventory.transfer.transferIn')
      default:
        return t(`inventory.${type.toLowerCase()}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)

    if (isToday(date)) return t('inventory.movementPanel.today')
    if (isYesterday(date)) return t('inventory.movementPanel.yesterday')

    return formatDateForDisplay(date, locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const groupMovementsByDate = (movements: StockMovement[]) => {
    const grouped: Record<string, StockMovement[]> = {}

    movements.forEach((movement) => {
      const date = formatDateForDisplay(movement.createdAt, 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(movement)
    })

    return Object.entries(grouped).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    )
  }

  const getChartData = () => {
    if (!summary) return []

    return summary.movementsByType
      .filter((m) => m.count > 0)
      .map((m, index) => ({
        name: getMovementLabel(m.type),
        value: m.count,
        color: CHART_COLORS[index % CHART_COLORS.length],
        type: m.type,
      }))
  }

  const getTopItemsData = () => {
    if (!summary?.topItems) return []

    return summary.topItems.slice(0, 5).map((item) => ({
      name: item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name,
      count: item.movementCount,
    }))
  }

  if (!isOpen) return null

  const groupedMovements = groupMovementsByDate(movements)
  const chartData = getChartData()
  const topItemsData = getTopItemsData()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-1/2 bg-stone-50 dark:bg-stone-900 shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              {t('inventory.movementPanel.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-gold-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              {t('inventory.movementPanel.listView')}
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'chart'
                  ? 'bg-gold-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {t('inventory.movementPanel.chartView')}
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-gold-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {range === '7d'
                  ? t('dashboard.period7Days')
                  : range === '30d'
                  ? t('dashboard.period30Days')
                  : t('dashboard.period90Days')}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600" />
            </div>
          ) : viewMode === 'list' ? (
            // List View
            movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Package className="w-12 h-12 text-stone-300 dark:text-stone-600 mb-3" />
                <p className="text-stone-500 dark:text-stone-400">
                  {t('inventory.movementPanel.noMovements')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedMovements.map(([dateStr, dayMovements]) => (
                  <div key={dateStr}>
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(dayMovements[0].createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-stone-200 dark:bg-stone-700" />

                      {/* Movement Cards */}
                      <div className="space-y-3">
                        {dayMovements.map((movement) => {
                          const Icon = getMovementIcon(movement.type)
                          const color = MOVEMENT_COLORS[movement.type]

                          return (
                            <div
                              key={movement.id}
                              className="relative flex gap-3 pl-0"
                            >
                              {/* Timeline Icon */}
                              <div
                                className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: color + '20' }}
                              >
                                <Icon
                                  className="w-3.5 h-3.5"
                                  style={{ color }}
                                />
                              </div>

                              {/* Card */}
                              <div className="flex-1 bg-white dark:bg-stone-800 rounded-xl p-3 border border-stone-100 dark:border-stone-700">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <span
                                      className="text-xs font-medium"
                                      style={{ color }}
                                    >
                                      {getMovementLabel(movement.type)}
                                    </span>
                                    <h4 className="text-sm font-medium text-stone-800 dark:text-stone-100">
                                      {locale === 'fr' && movement.item.nameFr
                                        ? movement.item.nameFr
                                        : movement.item.name}
                                    </h4>
                                  </div>
                                  <span className="text-xs text-stone-500 dark:text-stone-400">
                                    {formatTime(movement.createdAt)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-sm font-semibold ${
                                      movement.quantity > 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}
                                  >
                                    {movement.quantity > 0 ? '+' : ''}
                                    {movement.quantity} {movement.item.unit}
                                  </span>
                                  {movement.reason && (
                                    <span className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[120px]">
                                      {movement.reason}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Chart View
            <div className="space-y-6">
              {/* Donut Chart - Movement Breakdown */}
              <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-100 dark:border-stone-700">
                <h3 className="text-sm font-medium text-stone-800 dark:text-stone-100 mb-3">
                  {t('inventory.movementPanel.breakdown')}
                </h3>

                {chartData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={MOVEMENT_COLORS[entry.type]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              value,
                              t('inventory.movements'),
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      {chartData.map((item) => (
                        <div
                          key={item.type}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: MOVEMENT_COLORS[item.type],
                              }}
                            />
                            <span className="text-stone-600 dark:text-stone-300">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-medium text-stone-800 dark:text-stone-100">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-stone-500 dark:text-stone-400 py-4">
                    {t('inventory.movementPanel.noMovements')}
                  </p>
                )}
              </div>

              {/* Bar Chart - Top Items */}
              {topItemsData.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-100 dark:border-stone-700">
                  <h3 className="text-sm font-medium text-stone-800 dark:text-stone-100 mb-3">
                    {t('inventory.movementPanel.topItems')}
                  </h3>

                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topItemsData}
                        layout="vertical"
                        margin={{ left: 0, right: 10 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{
                            fill: 'currentColor',
                            fontSize: 11,
                          }}
                          tickLine={false}
                          axisLine={false}
                          className="text-stone-600 dark:text-stone-300"
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            value,
                            t('inventory.movements'),
                          ]}
                          contentStyle={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#d97706"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Summary Stats */}
        {summary && (
          <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {t('inventory.movementPanel.netChange')}
                </span>
                <p
                  className={`text-lg font-semibold ${
                    summary.netChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {summary.netChange >= 0 ? '+' : ''}
                  {summary.netChange.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {t('inventory.movements')}
                </span>
                <p className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  {summary.totalMovements}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
