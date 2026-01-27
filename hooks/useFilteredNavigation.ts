import { useMemo } from 'react'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import type { NavItemConfig } from '@/components/layout/NavigationHeader'

/**
 * Filter navigation items based on restaurant's enabled features
 *
 * When inventoryEnabled=false: Hides Inventory sub-item from Baking section
 * When productionEnabled=false: Hides Production sub-item from Baking section
 * If both are disabled: Hides entire Baking section
 */

interface RestaurantWithFeatures {
  id: string
  name: string
  location: string | null
  restaurantType?: string
  inventoryEnabled?: boolean
  productionEnabled?: boolean
}

export function useFilteredNavigation(navigationItems: NavItemConfig[]): NavItemConfig[] {
  const { currentRestaurant } = useRestaurant()

  return useMemo(() => {
    // Cast to get feature flags (they come from API)
    const restaurant = currentRestaurant as RestaurantWithFeatures | null

    // If no restaurant or features are undefined, show all items
    if (!restaurant) {
      return navigationItems
    }

    // Default to true if not specified
    const inventoryEnabled = restaurant.inventoryEnabled ?? true
    const productionEnabled = restaurant.productionEnabled ?? true

    // If both features are enabled, return original items
    if (inventoryEnabled && productionEnabled) {
      return navigationItems
    }

    // Filter navigation items
    return navigationItems
      .map(navItem => {
        // Handle Baking section specifically
        if (navItem.id === 'baking') {
          const filteredSubItems = navItem.subItems.filter(subItem => {
            if (subItem.id === 'inventory' && !inventoryEnabled) return false
            if (subItem.id === 'production' && !productionEnabled) return false
            return true
          })

          // If no sub-items remain, exclude the entire section
          if (filteredSubItems.length === 0) {
            return null
          }

          // Return section with filtered sub-items
          return {
            ...navItem,
            subItems: filteredSubItems,
          }
        }

        return navItem
      })
      .filter((item): item is NavItemConfig => item !== null)
  }, [navigationItems, currentRestaurant])
}

/**
 * Check if a specific feature is enabled for the current restaurant
 */
export function useFeatureEnabled(feature: 'inventory' | 'production'): boolean {
  const { currentRestaurant } = useRestaurant()
  const restaurant = currentRestaurant as RestaurantWithFeatures | null

  if (!restaurant) return true // Default to enabled

  if (feature === 'inventory') {
    return restaurant.inventoryEnabled ?? true
  }
  if (feature === 'production') {
    return restaurant.productionEnabled ?? true
  }

  return true
}
