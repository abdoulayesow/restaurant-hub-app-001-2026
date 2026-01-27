'use client'

import { X, Check, MapPin, Store } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { colorPalettes, type PaletteName } from '@/components/brand/Logo'

interface Restaurant {
  id: string
  name: string
  location: string | null
}

interface RestaurantDrawerProps {
  isOpen: boolean
  onClose: () => void
  restaurants: Restaurant[]
  currentRestaurantId: string | null
  onSelectRestaurant: (restaurant: Restaurant) => void
}

const paletteNames: PaletteName[] = ['terracotta', 'warmBrown', 'burntSienna', 'gold']

export function RestaurantDrawer({
  isOpen,
  onClose,
  restaurants,
  currentRestaurantId,
  onSelectRestaurant,
}: RestaurantDrawerProps) {
  const { t } = useLocale()
  const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="
          animate-slide-in
          fixed left-0 top-0 bottom-0 w-80
          bg-white dark:bg-stone-800
          shadow-lg
                    z-50
          flex flex-col
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="restaurant-drawer-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="restaurant-drawer-title"
              className="text-xl font-serif text-gray-900 dark:text-stone-100"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {t('restaurant.myRestaurants') || 'My Restaurants'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors"
              aria-label={t('common.close') || 'Close'}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
            </button>
          </div>

          {/* Current restaurant highlight */}
          {currentRestaurant && (
            <div
              className="p-4 rounded-2xl bg-gray-100 dark:bg-stone-700"
              style={{
                borderLeft: `4px solid ${colorPalettes[paletteNames[restaurants.findIndex(r => r.id === currentRestaurantId) % 4]].primary}`
              }}
            >
              <p className="text-xs uppercase tracking-wider text-gray-600/70 dark:text-stone-300/70 mb-1 font-medium">
                {t('restaurant.currentlyActive') || 'Currently Active'}
              </p>
              <p
                className="text-lg text-gray-900 dark:text-stone-100"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                {currentRestaurant.name}
              </p>
              {currentRestaurant.location && (
                <p className="text-sm text-gray-600/80 dark:text-stone-300/80 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {currentRestaurant.location}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Restaurant list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs uppercase tracking-wider text-gray-600/70 dark:text-stone-300/70 mb-3 px-2 font-medium">
            {t('restaurant.switchRestaurant') || 'Switch Restaurant'}
          </p>

          <div className="space-y-2">
            {restaurants.map((restaurant, index) => {
              const isSelected = restaurant.id === currentRestaurantId
              const restaurantPalette = colorPalettes[paletteNames[index % 4]]

              return (
                <button
                  key={restaurant.id}
                  onClick={() => {
                    onSelectRestaurant(restaurant)
                    onClose()
                  }}
                  className={`
                    w-full p-4 rounded-xl text-left
                    transition-all duration-200
                    ${isSelected
                      ? 'bg-gray-200 dark:bg-stone-700'
                      : 'hover:bg-gray-100 dark:hover:bg-stone-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Color indicator with initial */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor: restaurantPalette.primary,
                        fontFamily: "'DM Serif Display', Georgia, serif"
                      }}
                    >
                      {restaurant.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-stone-100 font-medium truncate">
                        {restaurant.name}
                      </p>
                      {restaurant.location && (
                        <p className="text-sm text-gray-600/70 dark:text-stone-300/70 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {restaurant.location}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-5 h-5 text-gray-700 dark:text-stone-300 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-stone-700">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600/60 dark:text-stone-300/60">
            <Store className="w-4 h-4" />
            <span>
              {restaurants.length} {restaurants.length === 1
                ? (t('restaurant.restaurantAccessible') || 'restaurant accessible')
                : (t('restaurant.restaurantsAccessible') || 'restaurants accessible')
              }
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default RestaurantDrawer
