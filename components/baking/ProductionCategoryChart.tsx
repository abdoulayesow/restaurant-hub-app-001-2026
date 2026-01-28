'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Croissant, Wheat, TrendingUp } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ProductionLog {
  id: string
  productName: string
  productNameFr?: string | null
  quantity: number
  productionType?: 'Patisserie' | 'Boulangerie' | null
  date: string
}

interface ProductionCategoryChartProps {
  productionLogs: ProductionLog[]
  loading?: boolean
}

const CATEGORY_CONFIG = {
  Patisserie: {
    color: '#D4AF37', // Classic gold
    darkColor: '#B8860B',
    icon: Croissant,
    gradient: 'from-amber-400 to-yellow-500',
  },
  Boulangerie: {
    color: '#C45C26', // Terracotta
    darkColor: '#A04A1E',
    icon: Wheat,
    gradient: 'from-orange-500 to-amber-600',
  },
  Uncategorized: {
    color: '#9CA3AF', // Gray
    darkColor: '#6B7280',
    icon: TrendingUp,
    gradient: 'from-gray-400 to-gray-500',
  },
}

export function ProductionCategoryChart({
  productionLogs,
  loading = false,
}: ProductionCategoryChartProps) {
  const { t } = useLocale()

  // Calculate category breakdown
  const categoryData = useMemo(() => {
    const breakdown = productionLogs.reduce(
      (acc, log) => {
        const category = log.productionType || 'Uncategorized'
        acc[category] = (acc[category] || 0) + log.quantity
        return acc
      },
      {} as Record<string, number>
    )

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

    return Object.entries(breakdown)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        config: CATEGORY_CONFIG[name as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.Uncategorized,
      }))
      .sort((a, b) => b.value - a.value)
  }, [productionLogs])

  const totalQuantity = categoryData.reduce((sum, item) => sum + item.value, 0)
  const hasData = categoryData.length > 0 && totalQuantity > 0

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-stone-700 rounded w-2/3 mb-4" />
          <div className="flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-stone-700" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-stone-700 rounded" />
            <div className="h-8 bg-gray-200 dark:bg-stone-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
          <TrendingUp className="w-5 h-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-stone-100">
            {t('production.categoryBreakdown') || 'Production by Category'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-stone-400">
            {t('production.todaysOutput') || "Today's output"}
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-stone-700 flex items-center justify-center">
            <Croissant className="w-8 h-8 text-gray-300 dark:text-stone-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-stone-400">
            {t('production.noProductionToday') || 'No production logged today'}
          </p>
        </div>
      ) : (
        <>
          {/* Donut Chart */}
          <div className="relative h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.config.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white dark:bg-stone-700 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-stone-600">
                          <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                            {t(`production.type${data.name}`) || data.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-stone-400">
                            {data.value} {t('production.units') || 'units'} ({data.percentage}%)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                {totalQuantity}
              </span>
              <span className="text-xs text-gray-500 dark:text-stone-400">
                {t('production.totalUnits') || 'total'}
              </span>
            </div>
          </div>

          {/* Category Legend */}
          <div className="space-y-2">
            {categoryData.map((item) => {
              const Icon = item.config.icon
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 transition-colors hover:bg-gray-100 dark:hover:bg-stone-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${item.config.color}20` }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: item.config.color }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-stone-100">
                      {t(`production.type${item.name}`) || item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-stone-100">
                      {item.value}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${item.config.color}20`,
                        color: item.config.color,
                      }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default ProductionCategoryChart
