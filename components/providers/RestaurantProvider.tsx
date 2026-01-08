'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PaletteName, colorPalettes } from '@/components/brand/Logo'
import { Toast } from '@/components/ui/Toast'
import { useLocale } from './LocaleProvider'

interface Restaurant {
  id: string
  name: string
  location: string | null
  restaurantType: string
  inventoryEnabled: boolean
  productionEnabled: boolean
}

type ToastState = {
  message: string
  color: string
} | null

interface RestaurantContextType {
  restaurants: Restaurant[]
  currentRestaurant: Restaurant | null
  currentPalette: PaletteName
  setCurrentRestaurant: (restaurant: Restaurant) => void
  loading: boolean
  restaurantType: string
  inventoryEnabled: boolean
  productionEnabled: boolean
}

const RestaurantContext = createContext<RestaurantContextType | null>(null)

// Palette names in order for cycling through restaurants
const paletteNames: PaletteName[] = ['terracotta', 'warmBrown', 'burntSienna', 'gold']

// Get palette for restaurant based on its index in the list
function getPaletteForRestaurantIndex(index: number): PaletteName {
  return paletteNames[index % paletteNames.length]
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const { t } = useLocale()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [currentRestaurant, setCurrentRestaurantState] = useState<Restaurant | null>(null)
  const [currentPalette, setCurrentPalette] = useState<PaletteName>('terracotta')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch user's accessible restaurants only when authenticated
  useEffect(() => {
    // Skip fetching if not authenticated
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session) {
      setLoading(false)
      return
    }

    const fetchRestaurants = async () => {
      try {
        const res = await fetch('/api/restaurants/my-restaurants')
        if (res.ok) {
          const data = await res.json()
          const fetchedRestaurants = data.restaurants || []
          setRestaurants(fetchedRestaurants)

          // Set default restaurant from localStorage or first in list
          const savedRestaurantId = localStorage.getItem('currentRestaurantId')
          const savedRestaurant = fetchedRestaurants.find((r: Restaurant) => r.id === savedRestaurantId)

          let selectedRestaurant: Restaurant | null = null
          let selectedIndex = 0

          if (savedRestaurant) {
            selectedRestaurant = savedRestaurant
            selectedIndex = fetchedRestaurants.findIndex((r: Restaurant) => r.id === savedRestaurant.id)
          } else if (data.defaultRestaurant) {
            selectedRestaurant = data.defaultRestaurant
            selectedIndex = fetchedRestaurants.findIndex((r: Restaurant) => r.id === data.defaultRestaurant.id)
          } else if (fetchedRestaurants.length > 0) {
            selectedRestaurant = fetchedRestaurants[0]
            selectedIndex = 0
          }

          if (selectedRestaurant) {
            setCurrentRestaurantState(selectedRestaurant)
            setCurrentPalette(getPaletteForRestaurantIndex(selectedIndex >= 0 ? selectedIndex : 0))
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error)
      } finally {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }

    fetchRestaurants()
  }, [session, status])

  const setCurrentRestaurant = useCallback((restaurant: Restaurant) => {
    const previousRestaurant = currentRestaurant
    setCurrentRestaurantState(restaurant)
    localStorage.setItem('currentRestaurantId', restaurant.id)

    // Find restaurant index and set palette
    const restaurantIndex = restaurants.findIndex(r => r.id === restaurant.id)
    const newPalette = getPaletteForRestaurantIndex(restaurantIndex >= 0 ? restaurantIndex : 0)
    setCurrentPalette(newPalette)

    // Show toast notification only if this is a switch (not initial load)
    if (previousRestaurant && previousRestaurant.id !== restaurant.id && !isInitialLoad) {
      const palette = colorPalettes[newPalette]
      setToast({
        message: `${t('common.switchedTo') || 'Switched to'} ${restaurant.name}`,
        color: palette.primary
      })
    }
  }, [restaurants, currentRestaurant, isInitialLoad, t])

  // Derive feature flags from current restaurant with defaults
  const restaurantType = currentRestaurant?.restaurantType || 'Bakery'
  const inventoryEnabled = currentRestaurant?.inventoryEnabled ?? true
  const productionEnabled = currentRestaurant?.productionEnabled ?? true

  return (
    <RestaurantContext.Provider value={{
      restaurants,
      currentRestaurant,
      currentPalette,
      setCurrentRestaurant,
      loading,
      restaurantType,
      inventoryEnabled,
      productionEnabled,
    }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          color={toast.color}
          type="info"
          onClose={() => setToast(null)}
        />
      )}
    </RestaurantContext.Provider>
  )
}

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider')
  }
  return context
}
