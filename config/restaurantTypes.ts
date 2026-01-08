import { Croissant, Coffee, UtensilsCrossed, Zap, type LucideIcon } from 'lucide-react'

export type RestaurantTypeKey = 'Bakery' | 'Cafe' | 'Restaurant' | 'FastFood'

export interface RestaurantTypeConfig {
  key: RestaurantTypeKey
  icon: LucideIcon
  appName: string
}

export const restaurantTypeConfig: Record<RestaurantTypeKey, RestaurantTypeConfig> = {
  Bakery: {
    key: 'Bakery',
    icon: Croissant,
    appName: 'Bakery Hub',
  },
  Cafe: {
    key: 'Cafe',
    icon: Coffee,
    appName: 'Cafe Hub',
  },
  Restaurant: {
    key: 'Restaurant',
    icon: UtensilsCrossed,
    appName: 'Restaurant Hub',
  },
  FastFood: {
    key: 'FastFood',
    icon: Zap,
    appName: 'Food Hub',
  },
}

export function getRestaurantTypeConfig(type: string | undefined): RestaurantTypeConfig {
  return restaurantTypeConfig[(type as RestaurantTypeKey) || 'Bakery'] || restaurantTypeConfig.Bakery
}
