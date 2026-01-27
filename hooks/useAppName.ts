'use client'

import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { getRestaurantTypeConfig } from '@/config/restaurantTypes'

export function useAppName(): string {
  const { restaurantType } = useRestaurant()
  const config = getRestaurantTypeConfig(restaurantType)
  return config.appName
}
