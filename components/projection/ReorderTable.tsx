'use client'

import { useMemo } from 'react'
import { ShoppingCart, AlertTriangle, Clock, Calendar } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ReorderRecommendation } from '@/lib/projection-utils'
import { formatAmount, formatCurrency } from '@/lib/currency-utils'

interface ReorderTableProps {
  recommendations: ReorderRecommendation[]
  palette: 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
}

export function ReorderTable({ recommendations, palette }: ReorderTableProps) {
  const { t, locale } = useLocale()

  const getUrgencyConfig = (urgency: ReorderRecommendation['urgency']) => {
    switch (urgency) {
      case 'URGENT':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: t('projection.urgent') || 'Urgent',
          priority: 0
        }
      case 'SOON':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          label: t('projection.soon') || 'Soon',
          priority: 1
        }
      case 'PLAN_AHEAD':
        return {
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          label: t('projection.planAhead') || 'Plan Ahead',
          priority: 2
        }
    }
  }

  const paletteColors = {
    terracotta: 'bg-[#C45C26]',
    warmBrown: 'bg-[#8B4513]',
    burntSienna: 'bg-[#A0522D]',
    gold: 'bg-[#D4AF37]'
  }

  const groupedByUrgency = useMemo(() => {
    const groups = {
      URGENT: [] as ReorderRecommendation[],
      SOON: [] as ReorderRecommendation[],
      PLAN_AHEAD: [] as ReorderRecommendation[]
    }

    recommendations.forEach(rec => {
      groups[rec.urgency].push(rec)
    })

    return groups
  }, [recommendations])

  const totalEstimatedCost = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + rec.estimatedCostGNF, 0)
  }, [recommendations])

  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`p-4 rounded-2xl ${paletteColors[palette]}/10`}>
            <ShoppingCart className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {t('projection.noReorders') || 'No Reorders Needed'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('projection.noReordersDescription') || 'All inventory levels are adequate. Check back later for recommendations.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Total Cost */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${paletteColors[palette]}/10`}>
              <ShoppingCart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {t('projection.reorderRecommendations') || 'Reorder Recommendations'}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                {recommendations.length} {t('projection.itemsNeedReorder') || 'items need attention'}
              </p>
            </div>
          </div>

          <div className="lg:text-right">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
              {t('projection.totalEstimatedCost') || 'Total Estimated Cost'}
            </p>
            <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
              {formatAmount(totalEstimatedCost, locale)}
              <span className="text-lg font-normal text-stone-500 ml-2">GNF</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Tables by Urgency */}
      {(['URGENT', 'SOON', 'PLAN_AHEAD'] as const).map((urgency) => {
        const items = groupedByUrgency[urgency]
        if (items.length === 0) return null

        const urgencyConfig = getUrgencyConfig(urgency)

        return (
          <div
            key={urgency}
            className={`bg-white dark:bg-stone-800 rounded-2xl shadow-sm border-2 ${urgencyConfig.borderColor} overflow-hidden`}
          >
            {/* Urgency Header */}
            <div className={`${urgencyConfig.bgColor} px-6 py-4 border-b ${urgencyConfig.borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={urgencyConfig.color}>
                    {urgencyConfig.icon}
                  </span>
                  <h3 className={`font-bold text-lg ${urgencyConfig.color}`}>
                    {urgencyConfig.label}
                  </h3>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    ({items.length} {t('projection.items') || 'items'})
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {t('projection.subtotal') || 'Subtotal'}
                  </p>
                  <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {formatCurrency(items.reduce((sum, item) => sum + item.estimatedCostGNF, 0), locale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      {t('projection.ingredient') || 'Ingredient'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      {t('projection.currentStock') || 'Current Stock'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      {t('projection.recommendedQuantity') || 'Recommended Order'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      {t('projection.estimatedCost') || 'Est. Cost'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      {t('projection.supplier') || 'Supplier'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                  {items.map((item) => (
                    <tr
                      key={item.itemId}
                      className="hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors"
                    >
                      {/* Ingredient */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {item.itemName}
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-600 dark:text-stone-300">
                          {item.currentStock.toFixed(1)} {item.unit}
                        </div>
                      </td>

                      {/* Recommended Order */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                            {item.recommendedOrderQuantity.toFixed(1)} {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* Estimated Cost */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {formatCurrency(item.estimatedCostGNF, locale)}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-600 dark:text-stone-300">
                          {item.supplierName || (
                            <span className="italic text-stone-400 dark:text-stone-500">
                              {t('projection.noSupplier') || 'No supplier'}
                            </span>
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
      })}
    </div>
  )
}
