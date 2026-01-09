'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
import { Logo, colorPalettes } from '@/components/brand/Logo'
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
  '/finances/expenses': 'expenses',
  '/finances/bank': 'bank',
  '/sales': 'sales',
  '/expenses': 'expenses',
  '/bank': 'bank',
}

export function NavigationHeader() {
  const { data: session } = useSession()
  const { t, locale, setLocale } = useLocale()
  const { theme, toggleTheme } = useTheme()
  const { restaurants, currentRestaurant, currentPalette, setCurrentRestaurant } = useRestaurant()
  const pathname = usePathname()

  const [navSheetOpen, setNavSheetOpen] = useState<string | null>(null)
  const [restaurantSheetOpen, setRestaurantSheetOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const accentColor = colorPalettes[currentPalette].primary
  const isManager = session?.user?.role === 'Manager'

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
        : colorPalettes.terracotta.primary, // All unselected use terracotta
      icon: <TypeIcon className="w-5 h-5" strokeWidth={2.5} />,
      isActive: restaurant.id === currentRestaurant?.id
    }
  })

  return (
    <>
      <header className="
        sticky top-0 z-40
        bg-cream-100/95 dark:bg-dark-900/95 backdrop-blur-md
        border-b border-terracotta-200/60 dark:border-terracotta-400/20
        grain-overlay
      ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LEFT: Logo + Restaurant trigger */}
            <button
              onClick={() => setRestaurantSheetOpen(true)}
              className="
                flex items-center gap-3
                p-2 -ml-2 rounded-2xl
                hover:bg-cream-100 dark:hover:bg-dark-800
                transition-all duration-300
                group
              "
              aria-label={t('restaurant.switchRestaurant') || 'Switch restaurant'}
            >
              <div className="relative">
                <Logo size="lg" variant="icon" palette={currentPalette} />
                {/* Steam animation on hover */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <div
                      className="w-0.5 h-3 rounded-full"
                      style={{
                        backgroundColor: accentColor,
                        animation: 'breadSteam 1.5s ease-in-out infinite'
                      }}
                    />
                    <div
                      className="w-0.5 h-4 rounded-full"
                      style={{
                        backgroundColor: accentColor,
                        animation: 'breadSteam 1.5s ease-in-out infinite 0.2s'
                      }}
                    />
                    <div
                      className="w-0.5 h-3 rounded-full"
                      style={{
                        backgroundColor: accentColor,
                        animation: 'breadSteam 1.5s ease-in-out infinite 0.4s'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="hidden sm:block">
                <h1
                  className="text-xl font-bold text-terracotta-900 dark:text-cream-100 leading-tight tracking-tight"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  Bakery<span style={{ color: accentColor }}>Hub</span>
                </h1>
                {currentRestaurant && (
                  <p className="text-xs text-terracotta-600/70 dark:text-cream-300/70 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: accentColor }}
                    />
                    {currentRestaurant.name}
                  </p>
                )}
              </div>
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
                      font-medium text-sm tracking-wide
                      transition-all duration-300 ease-out
                      ${hasActiveSubItem
                        ? 'text-white shadow-md'
                        : 'bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-dark-700'
                      }
                    `}
                    style={hasActiveSubItem ? { backgroundColor: accentColor } : undefined}
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
                  bg-cream-100 dark:bg-dark-800
                  text-terracotta-900 dark:text-cream-100
                  hover:bg-cream-200 dark:hover:bg-dark-700
                  transition-colors
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
                  bg-cream-100 dark:bg-dark-800
                  hover:bg-cream-200 dark:hover:bg-dark-700
                  transition-all duration-300
                "
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-terracotta-600" />
                )}
              </button>

              {/* User menu */}
              <div className="relative user-dropdown-container">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-full
                    bg-cream-100 dark:bg-dark-800
                    hover:bg-cream-200 dark:hover:bg-dark-700
                    transition-colors
                  "
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-terracotta-900 dark:text-cream-100 max-w-[100px] truncate">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-terracotta-600/60 dark:text-cream-300/60" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-cream-50 dark:bg-dark-900 rounded-xl shadow-lg border border-terracotta-200/40 dark:border-terracotta-400/20 overflow-hidden z-50"
                    role="menu"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-terracotta-200/30 dark:border-terracotta-400/15 bg-cream-100/50 dark:bg-dark-800/50">
                      <p className="text-sm font-semibold text-terracotta-900 dark:text-cream-100 truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-terracotta-600/70 dark:text-cream-300/70 truncate mt-0.5">
                        {session?.user?.email}
                      </p>
                      <span
                        className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {session?.user?.role}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-terracotta-800 dark:text-cream-200 hover:bg-terracotta-50 dark:hover:bg-dark-800 transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-terracotta-600 dark:text-cream-400" />
                        <span>{t('common.profile')}</span>
                      </Link>
                      {isManager && (
                        <Link
                          href="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-terracotta-800 dark:text-cream-200 hover:bg-terracotta-50 dark:hover:bg-dark-800 transition-colors"
                          role="menuitem"
                        >
                          <Settings className="w-4 h-4 text-terracotta-600 dark:text-cream-400" />
                          <span>{t('common.settings')}</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-terracotta-200/30 dark:border-terracotta-400/15 py-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
                  bg-cream-100 dark:bg-dark-800
                  hover:bg-cream-200 dark:hover:bg-dark-700
                  transition-colors
                "
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-terracotta-900 dark:text-cream-100" />
                ) : (
                  <Menu className="w-5 h-5 text-terracotta-900 dark:text-cream-100" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-terracotta-500/15 dark:border-terracotta-400/20" aria-label="Mobile navigation">
              {filteredNavigationItems.map(item => {
                const Icon = item.icon
                const hasActiveSubItem = item.subItems.some(sub => sub.id === activeSubItemId)

                return (
                  <div key={item.id} className="mb-2">
                    <div
                      className={`
                        flex items-center gap-3 px-4 py-2 rounded-xl
                        text-sm font-semibold uppercase tracking-wider
                        ${hasActiveSubItem
                          ? 'text-white'
                          : 'text-terracotta-600/70 dark:text-cream-300/70'
                        }
                      `}
                      style={hasActiveSubItem ? { backgroundColor: accentColor } : undefined}
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
                                ? 'bg-cream-200 dark:bg-dark-700 text-terracotta-900 dark:text-cream-100'
                                : 'text-terracotta-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-dark-800'
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
              <div className="mt-4 pt-4 border-t border-terracotta-500/15 dark:border-terracotta-400/20">
                <button
                  onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cream-100 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
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
          color: activeSubItemId === subItem.id ? accentColor : colorPalettes.terracotta.primary,
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
