'use client'

import { getRestaurantTypeConfig } from '@/config/restaurantTypes'

interface RestaurantTypeIconProps {
  type: string | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function RestaurantTypeIcon({
  type,
  size = 'md',
  className = '',
}: RestaurantTypeIconProps) {
  const config = getRestaurantTypeConfig(type)
  const Icon = config.icon

  return (
    <Icon
      className={`${sizeMap[size]} ${className}`}
      strokeWidth={2}
    />
  )
}
