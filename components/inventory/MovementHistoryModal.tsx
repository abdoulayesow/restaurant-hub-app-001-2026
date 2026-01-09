'use client'

import { useState, useEffect } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertTriangle, History, Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { InventoryItem } from './InventoryTable'

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

interface MovementHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
}

export function MovementHistoryModal({
  isOpen,
  onClose,
  item,
}: MovementHistoryModalProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && item && currentRestaurant) {
      fetchMovements()
    }
  }, [isOpen, item, currentRestaurant])

  const fetchMovements = async () => {
    if (!item || !currentRestaurant) return

    setLoading(true)
    setError(null)

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
      setError(t('errors.generic'))
      console.error('Error fetching movements:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !item) return null

  const getItemName = () => {
    if (locale === 'fr' && item.nameFr) {
      return item.nameFr
    }
    return item.name
  }

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
      <div className="relative bg-cream-50 dark:bg-dark-900 rounded-2xl warm-shadow-lg grain-overlay w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-terracotta-500/15 dark:border-terracotta-400/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
              <History className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" />
            </div>
            <div>
              <h2
                className="text-xl font-semibold text-terracotta-900 dark:text-cream-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {t('inventory.movementHistory')}
              </h2>
              <p className="text-sm text-terracotta-600 dark:text-cream-400 mt-0.5">
                {getItemName()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream-200 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-terracotta-600 dark:text-cream-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchMovements}
                className="text-terracotta-600 hover:text-terracotta-700 dark:text-terracotta-400 font-medium"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-cream-200 dark:bg-dark-700 flex items-center justify-center mx-auto mb-4">
                <History className="w-6 h-6 text-terracotta-400 dark:text-cream-500" />
              </div>
              <p className="text-terracotta-600 dark:text-cream-400">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="bg-cream-100 dark:bg-dark-800 rounded-xl p-4 border border-terracotta-200/30 dark:border-dark-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getMovementIcon(movement.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-terracotta-900 dark:text-cream-100">
                            {getMovementLabel(movement.type)}
                          </span>
                          <span className={`font-semibold ${getQuantityColor(movement.quantity)}`}>
                            {formatQuantity(movement.quantity)}
                          </span>
                        </div>
                        {movement.reason && (
                          <p className="text-sm text-terracotta-600 dark:text-cream-400 mt-1">
                            {movement.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-terracotta-500 dark:text-cream-500">
                          <span>{formatDate(movement.createdAt)}</span>
                          <span className="text-terracotta-300 dark:text-dark-500">•</span>
                          <span>{movement.createdByName || movement.createdBy}</span>
                        </div>
                      </div>
                    </div>
                    {movement.unitCost !== null && movement.type === 'Purchase' && (
                      <div className="text-right text-sm shrink-0 ml-4">
                        <span className="text-terracotta-600 dark:text-cream-400 bg-cream-200 dark:bg-dark-700 px-2 py-1 rounded-lg">
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

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-terracotta-500/15 dark:border-terracotta-400/20 shrink-0">
          <button
            onClick={onClose}
            className="
              px-4 py-2.5 rounded-xl
              border border-terracotta-200 dark:border-dark-600
              text-terracotta-700 dark:text-cream-300
              hover:bg-cream-100 dark:hover:bg-dark-800
              font-medium transition-colors
            "
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
