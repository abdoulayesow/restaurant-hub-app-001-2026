'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  User,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Store,
  Settings,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { BlissLogoNav, blissPalettes } from '@/components/brand/BlissLogo'
import { canAccessDashboard, getRoleDisplayName } from '@/lib/roles'

export function EditorHeader() {
  const { data: session } = useSession()
  const { t, locale, setLocale } = useLocale()
  const { theme, toggleTheme } = useTheme()
  const { restaurants, currentRestaurant, currentRole, currentPalette, setCurrentRestaurant } = useRestaurant()
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  // Map old palette names to new Bliss Patisserie palettes
  const blissPaletteMap: Record<string, keyof typeof blissPalettes> = {
    terracotta: 'royalPlum',
    warmBrown: 'cafeCreme',
    burntSienna: 'rosePetal',
    gold: 'pistache',
  }
  const currentBlissPalette = blissPaletteMap[currentPalette] || 'royalPlum'
  const accentColor = blissPalettes[currentBlissPalette].primary

  // Use currentRole from RestaurantProvider (per-restaurant role)
  const isOwnerRole = canAccessDashboard(currentRole)

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Bakery Selector */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href={isOwnerRole ? '/dashboard' : '/editor'} className="flex items-center">
              <BlissLogoNav palette={currentBlissPalette} />
            </Link>

            {/* Restaurant Selector - Always visible */}
            {currentRestaurant && (
              <div className="relative">
                <button
                  onClick={() => restaurants.length > 1 && setRestaurantDropdownOpen(!restaurantDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    restaurants.length > 1
                      ? 'hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer'
                      : 'cursor-default'
                  }`}
                  style={{
                    backgroundColor: `${accentColor}15`,
                    borderLeft: `3px solid ${accentColor}`
                  }}
                >
                  <Store className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300 max-w-[150px] truncate">
                    {currentRestaurant.name}
                  </span>
                  {restaurants.length > 1 && (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </button>

                {restaurantDropdownOpen && restaurants.length > 1 && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-50">
                    {restaurants.map((restaurant, index) => {
                      const paletteKey = ['terracotta', 'warmBrown', 'burntSienna', 'gold'][index % 4] as keyof typeof blissPaletteMap
                      const blissPaletteName = blissPaletteMap[paletteKey]
                      const restaurantPalette = blissPalettes[blissPaletteName]
                      return (
                        <button
                          key={restaurant.id}
                          onClick={() => {
                            setCurrentRestaurant(restaurant)
                            setRestaurantDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 ${
                            restaurant.id === currentRestaurant.id
                              ? 'font-medium'
                              : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: restaurantPalette.primary }}
                          />
                          <span className="flex-1">
                            {restaurant.name}
                            {restaurant.location && (
                              <span className="block text-xs text-stone-500">{restaurant.location}</span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              className="hidden sm:flex items-center px-2 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gold-500" />
              ) : (
                <Moon className="w-5 h-5 text-stone-600" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                )}
                <span className="hidden sm:block text-sm font-medium text-stone-700 dark:text-stone-300 max-w-[100px] truncate">
                  {session?.user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-stone-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-700">
                    <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{session?.user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded">
                      {getRoleDisplayName(currentRole, locale as 'fr' | 'en')}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    <User className="w-4 h-4" />
                    {t('common.profile')}
                  </Link>
                  {isOwnerRole && (
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <Settings className="w-4 h-4" />
                      {t('common.settings')}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
