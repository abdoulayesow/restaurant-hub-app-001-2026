'use client'

import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface StatusBadgeProps {
  status: 'Pending' | 'Approved' | 'Rejected'
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useLocale()

  const config = {
    Pending: {
      label: t('common.pending') || 'Pending',
      icon: Clock,
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-500/20',
    },
    Approved: {
      label: t('common.approved') || 'Approved',
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-500/20',
    },
    Rejected: {
      label: t('common.rejected') || 'Rejected',
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-500/20',
    },
  }

  const { label, icon: Icon, bgColor, textColor, borderColor } = config[status]

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm'

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        border ${bgColor} ${textColor} ${borderColor} ${sizeClasses}
      `}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  )
}

export default StatusBadge
