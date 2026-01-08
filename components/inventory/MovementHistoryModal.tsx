'use client'

import { useState, useEffect } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'
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
  const { currentBakery } = useBakery()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && item && currentBakery) {
      fetchMovements()
    }
  }, [isOpen, item, currentBakery])

  const fetchMovements = async () => {
    if (!item || !currentBakery) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/stock-movements?bakeryId=${currentBakery.id}&itemId=${item.id}&limit=50`
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
        return <RefreshCw className="w-5 h-5 text-yellow-500" />
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
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('inventory.movementHistory')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getItemName()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchMovements}
                className="mt-4 text-gold-600 hover:text-gold-700 dark:text-gold-400"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getMovementIcon(movement.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getMovementLabel(movement.type)}
                          </span>
                          <span className={`font-semibold ${getQuantityColor(movement.quantity)}`}>
                            {formatQuantity(movement.quantity)}
                          </span>
                        </div>
                        {movement.reason && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {movement.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span>{formatDate(movement.createdAt)}</span>
                          <span>•</span>
                          <span>{movement.createdByName || movement.createdBy}</span>
                        </div>
                      </div>
                    </div>
                    {movement.unitCost !== null && movement.type === 'Purchase' && (
                      <div className="text-right text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
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
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
