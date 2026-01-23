'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

export type StockStatus = 'critical' | 'low' | 'ok'

interface StockStatusBadgeProps {
  status: StockStatus
  className?: string
}

export function StockStatusBadge({ status, className = '' }: StockStatusBadgeProps) {
  const { t } = useLocale()

  const statusConfig = {
    critical: {
      label: t('inventory.critical'),
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-800 dark:text-red-400',
    },
    low: {
      label: t('inventory.lowStock'),
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      textClass: 'text-yellow-800 dark:text-yellow-400',
    },
    ok: {
      label: t('inventory.inStock'),
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-800 dark:text-green-400',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass} ${className}`}
    >
      {config.label}
    </span>
  )
}

// Helper function to calculate stock status (exported for reuse)
export function getStockStatus(currentStock: number, minStock: number): StockStatus {
  if (currentStock <= 0 || (minStock > 0 && currentStock <= minStock * 0.1)) {
    return 'critical'
  }
  if (currentStock < minStock) {
    return 'low'
  }
  return 'ok'
}
