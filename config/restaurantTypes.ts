import { Croissant, Coffee, UtensilsCrossed, Zap, type LucideIcon } from 'lucide-react'

/**
 * Restaurant type configuration
 * Maps RestaurantType enum from Prisma schema to icons and labels
 */

export type RestaurantType = 'Bakery' | 'Cafe' | 'Restaurant' | 'FastFood'

export interface RestaurantTypeConfig {
  type: RestaurantType
  icon: LucideIcon
  labelEn: string
  labelFr: string
  descriptionEn: string
  descriptionFr: string
  appName: string
}

export const restaurantTypeConfigs: Record<RestaurantType, RestaurantTypeConfig> = {
  Bakery: {
    type: 'Bakery',
    icon: Croissant,
    labelEn: 'Bakery',
    labelFr: 'Boulangerie',
    descriptionEn: 'Bread, pastries, and baked goods',
    descriptionFr: 'Pain, pâtisseries et produits de boulangerie',
    appName: 'Bakery Hub',
  },
  Cafe: {
    type: 'Cafe',
    icon: Coffee,
    labelEn: 'Café',
    labelFr: 'Café',
    descriptionEn: 'Coffee shop with light food',
    descriptionFr: 'Café avec restauration légère',
    appName: 'Cafe Hub',
  },
  Restaurant: {
    type: 'Restaurant',
    icon: UtensilsCrossed,
    labelEn: 'Restaurant',
    labelFr: 'Restaurant',
    descriptionEn: 'Full-service dining',
    descriptionFr: 'Service de restauration complet',
    appName: 'Restaurant Hub',
  },
  FastFood: {
    type: 'FastFood',
    icon: Zap,
    labelEn: 'Fast Food',
    labelFr: 'Restauration Rapide',
    descriptionEn: 'Quick service restaurant',
    descriptionFr: 'Service rapide',
    appName: 'Food Hub',
  },
}

/**
 * Get restaurant type config by type string
 */
export function getRestaurantTypeConfig(type: string | undefined): RestaurantTypeConfig {
  if (type && type in restaurantTypeConfigs) {
    return restaurantTypeConfigs[type as RestaurantType]
  }
  // Default to Bakery if type is unknown
  return restaurantTypeConfigs.Bakery
}

/**
 * Get restaurant type icon component
 */
export function getRestaurantTypeIcon(type: string | undefined): LucideIcon {
  return getRestaurantTypeConfig(type).icon
}

/**
 * Get all restaurant types as array for dropdowns
 */
export function getAllRestaurantTypes(): RestaurantTypeConfig[] {
  return Object.values(restaurantTypeConfigs)
}

/**
 * Get restaurant type label based on locale
 */
export function getRestaurantTypeLabel(type: string | undefined, locale: 'en' | 'fr' = 'en'): string {
  const config = getRestaurantTypeConfig(type)
  return locale === 'fr' ? config.labelFr : config.labelEn
}
