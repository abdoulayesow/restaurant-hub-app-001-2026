'use client'

import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ExpiryStatus } from '@/lib/inventory-helpers'

interface ExpiryStatusBadgeProps {
  status: ExpiryStatus
  daysUntilExpiry?: number | null
  showDays?: boolean
}

export function ExpiryStatusBadge({
  status,
  daysUntilExpiry,
  showDays = true,
}: ExpiryStatusBadgeProps) {
  const { t } = useLocale()

  const getStatusConfig = () => {
    switch (status) {
      case 'expired':
        return {
          icon: XCircle,
          label: t('inventory.expiry.expired') || 'Expired',
          bgColor: 'bg-rose-100 dark:bg-rose-900/30',
          textColor: 'text-rose-700 dark:text-rose-400',
          iconColor: 'text-rose-600 dark:text-rose-400',
        }
      case 'warning':
        return {
          icon: AlertCircle,
          label: t('inventory.expiry.expiringSoon') || 'Expiring Soon',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-400',
          iconColor: 'text-amber-600 dark:text-amber-400',
        }
      case 'fresh':
        return {
          icon: CheckCircle,
          label: t('inventory.expiry.fresh') || 'Fresh',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        }
      case 'non-perishable':
      default:
        return {
          icon: Clock,
          label: t('inventory.expiry.nonPerishable') || 'Non-Perishable',
          bgColor: 'bg-gray-100 dark:bg-gray-700/50',
          textColor: 'text-gray-700 dark:text-gray-400',
          iconColor: 'text-gray-500 dark:text-gray-400',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const getDaysText = () => {
    if (!showDays || daysUntilExpiry === null || daysUntilExpiry === undefined) {
      return null
    }

    if (daysUntilExpiry < 0) {
      const daysAgo = Math.abs(daysUntilExpiry)
      return `${daysAgo}${t('inventory.expiry.daysAgo') || 'd ago'}`
    }

    if (daysUntilExpiry === 0) {
      return t('inventory.expiry.today') || 'Today'
    }

    return `${daysUntilExpiry}${t('inventory.expiry.daysLeft') || 'd'}`
  }

  const daysText = getDaysText()

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      <span>{config.label}</span>
      {daysText && <span className="font-semibold">({daysText})</span>}
    </span>
  )
}
