'use client'

import { useMemo } from 'react'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { navigationItems, type NavItemConfig, type FeatureFlag } from '@/config/navigation'

export function useFilteredNavigation(): NavItemConfig[] {
  const { inventoryEnabled, productionEnabled } = useRestaurant()

  return useMemo(() => {
    const isFeatureEnabled = (feature?: FeatureFlag): boolean => {
      if (!feature) return true
      if (feature === 'inventory') return inventoryEnabled
      if (feature === 'production') return productionEnabled
      return true
    }

    return navigationItems
      .map(item => ({
        ...item,
        subItems: item.subItems.filter(sub => isFeatureEnabled(sub.requiresFeature)),
      }))
      .filter(item => item.subItems.length > 0)
  }, [inventoryEnabled, productionEnabled])
}
