'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  ChefHat,
  Utensils,
  Package,
  Wallet,
  Receipt,
  Building2,
  DollarSign,
  Users,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { BlissLogoNav, blissPalettes } from '@/components/brand/BlissLogo'
import { canAccessDashboard, getRoleDisplayName } from '@/lib/roles'
import { FloatingActionPicker, type FloatingActionItem } from '@/components/ui/FloatingActionPicker'
import { useFilteredNavigation } from '@/hooks/useFilteredNavigation'
import { getRestaurantTypeIcon } from '@/config/restaurantTypes'

// Navigation configuration
export interface NavSubItem {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  href: string
}

export interface NavItemConfig {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  subItems: NavSubItem[]
}

const navigationItems: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelFr: 'Tableau',
    icon: LayoutDashboard,
    subItems: [
      { id: 'current', label: 'Current', labelFr: 'Actuel', icon: TrendingUp, href: '/dashboard' },
      { id: 'projection', label: 'Projection', labelFr: 'Projection', icon: Target, href: '/dashboard/projection' },
    ]
  },
  {
    id: 'baking',
    label: 'Baking',
    labelFr: 'Boulangerie',
    icon: ChefHat,
    subItems: [
      { id: 'production', label: 'Production', labelFr: 'Production', icon: Utensils, href: '/baking/production' },
      { id: 'inventory', label: 'Inventory', labelFr: 'Inventaire', icon: Package, href: '/baking/inventory' },
    ]
  },
  {
    id: 'finances',
    label: 'Finances',
    labelFr: 'Finances',
    icon: Wallet,
    subItems: [
      { id: 'sales', label: 'Sales', labelFr: 'Ventes', icon: TrendingUp, href: '/finances/sales' },
      { id: 'clients', label: 'Clients', labelFr: 'Clients', icon: Users, href: '/finances/clients' },
      { id: 'debts', label: 'Debts', labelFr: 'Dettes', icon: DollarSign, href: '/finances/debts' },
      { id: 'expenses', label: 'Expenses', labelFr: 'Dépenses', icon: Receipt, href: '/finances/expenses' },
      { id: 'bank', label: 'Bank', labelFr: 'Banque', icon: Building2, href: '/finances/bank' },
    ]
  },
]

// Map routes to sub-item IDs for active state
const routeToSubItem: Record<string, string> = {
  '/dashboard': 'current',
  '/dashboard/projection': 'projection',
  '/baking': 'production',
  '/baking/production': 'production',
  '/baking/inventory': 'inventory',
  '/inventory': 'inventory',
  '/production': 'production',
  '/finances/sales': 'sales',
  '/finances/clients': 'clients',
  '/finances/debts': 'debts',
  '/finances/expenses': 'expenses',
  '/finances/bank': 'bank',
  '/sales': 'sales',
  '/clients': 'clients',
  '/debts': 'debts',
  '/expenses': 'expenses',
  '/bank': 'bank',
}

export function NavigationHeader() {
  const { data: session } = useSession()
  const { t, locale, setLocale } = useLocale()
  const { theme, toggleTheme } = useTheme()
  const { restaurants, currentRestaurant, currentRole, currentPalette, setCurrentRestaurant } = useRestaurant()
  const pathname = usePathname()

  const [navSheetOpen, setNavSheetOpen] = useState<string | null>(null)
  const [restaurantSheetOpen, setRestaurantSheetOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Use Bliss Patisserie colors - map old palette names to new
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

  // Theme-aware button color for floating pickers
  // Light mode: gray-900 (#111827), Dark mode: stone-600 (#57534e)
  const navButtonColor = theme === 'dark' ? '#57534e' : '#111827'

  // Filter navigation based on restaurant's enabled features
  const filteredNavigationItems = useFilteredNavigation(navigationItems)

  // Determine active sub-item based on current path
  const activeSubItemId = routeToSubItem[pathname] || ''

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-dropdown-container')) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setNavSheetOpen(null)
  }, [pathname])

  // Handle restaurant selection from floating picker
  const handleRestaurantSelect = (item: FloatingActionItem) => {
    const restaurant = restaurants.find(r => r.id === item.id)
    if (restaurant) {
      setCurrentRestaurant(restaurant)
    }
  }

  // Map restaurants to FloatingActionItems - use restaurant type icon, active gets current palette color
  const restaurantPickerItems: FloatingActionItem[] = restaurants.map((restaurant) => {
    const TypeIcon = getRestaurantTypeIcon((restaurant as { restaurantType?: string })?.restaurantType)
    return {
      id: restaurant.id,
      label: restaurant.name,
      sublabel: restaurant.location || undefined,
      color: restaurant.id === currentRestaurant?.id
        ? accentColor
        : navButtonColor, // Use theme-aware color for unselected
      icon: <TypeIcon className="w-5 h-5" strokeWidth={2.5} />,
      isActive: restaurant.id === currentRestaurant?.id
    }
  })

  return (
    <>
      <header className="
        sticky top-0 z-40
        bg-[rgb(223,216,227)] dark:bg-stone-800
        border-b border-gray-200 dark:border-stone-700/40
        dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]
      ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LEFT: Logo + Restaurant trigger */}
            <button
              onClick={() => setRestaurantSheetOpen(true)}
              className="
                flex items-center gap-3
                p-2 -ml-2 rounded-2xl
                hover:bg-gray-200 dark:hover:bg-stone-700/50
                transition-all duration-300
                group
              "
              aria-label={t('restaurant.switchRestaurant') || 'Switch restaurant'}
            >
              {/* Bliss Patisserie Logo */}
              <BlissLogoNav palette={currentBlissPalette} />

              {/* Restaurant name indicator */}
              {currentRestaurant && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-gray-300 dark:border-stone-600/50">
                  <span
                    className="w-2 h-2 rounded-full inline-block animate-pulse"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-stone-300">
                    {currentRestaurant.name}
                  </span>
                </div>
              )}
            </button>

            {/* CENTER: Navigation pills (Desktop) */}
            <nav className="hidden lg:flex items-center gap-2" aria-label="Main navigation">
              {filteredNavigationItems.map(item => {
                const hasActiveSubItem = item.subItems.some(sub => sub.id === activeSubItemId)
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    onClick={() => setNavSheetOpen(item.id)}
                    aria-expanded={navSheetOpen === item.id}
                    aria-haspopup="true"
                    className={`
                      flex items-center justify-center gap-2
                      min-w-[130px] px-4 py-2.5 rounded-full
                      font-medium text-sm
                      transition-all duration-300 ease-out
                      ${hasActiveSubItem
                        ? 'bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 shadow-sm'
                        : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200 hover:bg-gray-200 dark:hover:bg-stone-700/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                    <span>{locale === 'fr' ? item.labelFr : item.label}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </nav>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2">
              {/* Language toggle - circular button */}
              <button
                onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                className="
                  hidden sm:flex items-center justify-center
                  w-10 h-10 rounded-full
                  text-xs font-bold tracking-wider
                  text-gray-600 dark:text-stone-400
                  hover:text-gray-900 dark:hover:text-stone-200
                  hover:bg-gray-200 dark:hover:bg-stone-700/50
                  transition-all duration-300
                "
                aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
              >
                {locale === 'fr' ? 'EN' : 'FR'}
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="
                  w-10 h-10 flex items-center justify-center rounded-full
                  text-gray-600 dark:text-stone-400
                  hover:text-gray-900 dark:hover:text-stone-200
                  hover:bg-gray-200 dark:hover:bg-stone-700/50
                  transition-all duration-300
                "
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* User menu */}
              <div className="relative user-dropdown-container">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-full
                    bg-white dark:bg-stone-700
                    shadow-sm hover:shadow
                    transition-all duration-300
                  "
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-stone-600"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-stone-100 max-w-[100px] truncate">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-stone-400" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-gray-200 dark:border-stone-700/50 overflow-hidden z-50"
                    role="menu"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-stone-700/50 bg-gray-50 dark:bg-stone-700/50">
                      <p className="text-sm font-semibold text-gray-900 dark:text-stone-100 truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-stone-400 truncate mt-0.5">
                        {session?.user?.email}
                      </p>
                      <span
                        className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-medium rounded-full text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {getRoleDisplayName(currentRole, locale as 'fr' | 'en')}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-gray-500 dark:text-stone-400" />
                        <span>{t('common.profile')}</span>
                      </Link>
                      {isOwnerRole && (
                        <Link
                          href="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
                          role="menuitem"
                        >
                          <Settings className="w-4 h-4 text-gray-500 dark:text-stone-400" />
                          <span>{t('common.settings')}</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 dark:border-stone-700/50 py-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="
                  lg:hidden
                  w-10 h-10 flex items-center justify-center rounded-full
                  text-gray-600 dark:text-stone-400
                  hover:text-gray-900 dark:hover:text-stone-200
                  hover:bg-gray-200 dark:hover:bg-stone-700/50
                  transition-all duration-300
                "
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-900 dark:text-stone-100" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600 dark:text-stone-400" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-gray-200 dark:border-stone-700/50" aria-label="Mobile navigation">
              {filteredNavigationItems.map(item => {
                const Icon = item.icon
                const hasActiveSubItem = item.subItems.some(sub => sub.id === activeSubItemId)

                return (
                  <div key={item.id} className="mb-2">
                    <div
                      className={`
                        flex items-center gap-3 px-4 py-2 rounded-xl
                        text-sm font-medium
                        ${hasActiveSubItem
                          ? 'bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 shadow-sm'
                          : 'text-gray-500 dark:text-stone-400'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {locale === 'fr' ? item.labelFr : item.label}
                    </div>
                    <div className="pl-4 mt-1 space-y-1">
                      {item.subItems.map(subItem => {
                        const SubIcon = subItem.icon
                        const isSubActive = activeSubItemId === subItem.id

                        return (
                          <Link
                            key={subItem.id}
                            href={subItem.href}
                            className={`
                              flex items-center gap-3 px-4 py-3 rounded-xl
                              text-sm font-medium
                              ${isSubActive
                                ? 'bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 shadow-sm'
                                : 'text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700/50'
                              }
                            `}
                          >
                            <SubIcon className="w-4 h-4" />
                            {locale === 'fr' ? subItem.labelFr : subItem.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Mobile language toggle */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-stone-700/50">
                <button
                  onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 font-medium shadow-sm"
                >
                  {locale === 'fr' ? 'Switch to English' : 'Passer en fran\u00e7ais'}
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Floating Restaurant Picker */}
      <FloatingActionPicker
        isOpen={restaurantSheetOpen}
        onClose={() => setRestaurantSheetOpen(false)}
        items={restaurantPickerItems}
        onSelect={handleRestaurantSelect}
        position="bottom"
      />

      {/* Navigation Floating Pickers */}
      {filteredNavigationItems.map(item => {
        const navItems: FloatingActionItem[] = item.subItems.map(subItem => ({
          id: subItem.id,
          label: locale === 'fr' ? subItem.labelFr : subItem.label,
          color: activeSubItemId === subItem.id ? accentColor : navButtonColor,
          icon: React.createElement(subItem.icon, { className: 'w-4 h-4', strokeWidth: 2.5 }),
          isActive: activeSubItemId === subItem.id
        }))

        return (
          <FloatingActionPicker
            key={item.id}
            isOpen={navSheetOpen === item.id}
            onClose={() => setNavSheetOpen(null)}
            items={navItems}
            onSelect={(selected) => {
              const subItem = item.subItems.find(sub => sub.id === selected.id)
              if (subItem) {
                window.location.href = subItem.href
              }
            }}
            position="top"
            showCloseButton={false}
          />
        )
      })}
    </>
  )
}

export default NavigationHeader
