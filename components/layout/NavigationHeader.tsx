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
import { colorPalettes } from '@/components/brand/Logo'
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
  '/finances/debts': 'debts',
  '/finances/expenses': 'expenses',
  '/finances/bank': 'bank',
  '/sales': 'sales',
  '/debts': 'debts',
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

  // Use Bliss Patisserie colors - map old palette names to new
  const blissPaletteMap: Record<string, keyof typeof blissPalettes> = {
    terracotta: 'royalPlum',
    warmBrown: 'cafeCreme',
    burntSienna: 'rosePetal',
    gold: 'pistache',
  }
  const currentBlissPalette = blissPaletteMap[currentPalette] || 'royalPlum'
  const accentColor = blissPalettes[currentBlissPalette].primary
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
        bg-cream-50/95 dark:bg-plum-900/95 backdrop-blur-md
        border-b border-plum-200/40 dark:border-plum-700/30
        diagonal-stripes-bliss
      ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LEFT: Logo + Restaurant trigger */}
            <button
              onClick={() => setRestaurantSheetOpen(true)}
              className="
                flex items-center gap-3
                p-2 -ml-2 rounded-2xl
                hover:bg-plum-50 dark:hover:bg-plum-800/50
                transition-all duration-300
                group
              "
              aria-label={t('restaurant.switchRestaurant') || 'Switch restaurant'}
            >
              {/* Bliss Patisserie Logo */}
              <BlissLogoNav palette={currentBlissPalette} />

              {/* Restaurant name indicator */}
              {currentRestaurant && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-plum-200/30 dark:border-plum-700/30">
                  <span
                    className="w-2 h-2 rounded-full inline-block animate-pulse"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-xs bliss-body text-plum-600 dark:text-plum-300">
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
                      bliss-body font-medium text-sm tracking-wide
                      transition-all duration-300 ease-out
                      btn-lift
                      ${hasActiveSubItem
                        ? 'text-cream-50 shadow-plum'
                        : 'bg-plum-50 dark:bg-plum-800/50 text-plum-700 dark:text-cream-100 hover:bg-plum-100 dark:hover:bg-plum-700/50'
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
                  bliss-body text-xs font-bold tracking-wider
                  bg-plum-50 dark:bg-plum-800/50
                  text-plum-700 dark:text-cream-100
                  hover:bg-plum-100 dark:hover:bg-plum-700/50
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
                  bg-plum-50 dark:bg-plum-800/50
                  hover:bg-plum-100 dark:hover:bg-plum-700/50
                  transition-all duration-300
                "
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-plum-600" />
                )}
              </button>

              {/* User menu */}
              <div className="relative user-dropdown-container">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-full
                    bg-plum-50 dark:bg-plum-800/50
                    hover:bg-plum-100 dark:hover:bg-plum-700/50
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
                      className="w-8 h-8 rounded-full ring-2 ring-plum-200 dark:ring-plum-600"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <User className="w-4 h-4 text-cream-50" />
                    </div>
                  )}
                  <span className="hidden sm:block bliss-body text-sm font-medium text-plum-800 dark:text-cream-100 max-w-[100px] truncate">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-plum-500/60 dark:text-plum-300/60" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-cream-50 dark:bg-plum-900 rounded-2xl shadow-plum-lg border border-plum-200/40 dark:border-plum-700/30 overflow-hidden z-50 animate-fade-in-up"
                    role="menu"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-plum-200/30 dark:border-plum-700/20 bg-plum-50/50 dark:bg-plum-800/50 diagonal-stripes-bliss">
                      <p className="bliss-elegant text-sm font-semibold text-plum-800 dark:text-cream-100 truncate">
                        {session?.user?.name}
                      </p>
                      <p className="bliss-body text-xs text-plum-600/70 dark:text-plum-300/70 truncate mt-0.5">
                        {session?.user?.email}
                      </p>
                      <span
                        className="inline-block mt-2 px-2.5 py-0.5 bliss-label text-[10px] rounded-full text-cream-50"
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
                        className="flex items-center space-x-3 px-4 py-2.5 bliss-body text-sm text-plum-700 dark:text-cream-200 hover:bg-plum-50 dark:hover:bg-plum-800 transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-plum-500 dark:text-plum-400" />
                        <span>{t('common.profile')}</span>
                      </Link>
                      {isManager && (
                        <Link
                          href="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 bliss-body text-sm text-plum-700 dark:text-cream-200 hover:bg-plum-50 dark:hover:bg-plum-800 transition-colors"
                          role="menuitem"
                        >
                          <Settings className="w-4 h-4 text-plum-500 dark:text-plum-400" />
                          <span>{t('common.settings')}</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-plum-200/30 dark:border-plum-700/20 py-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 bliss-body text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
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
                  bg-plum-50 dark:bg-plum-800/50
                  hover:bg-plum-100 dark:hover:bg-plum-700/50
                  transition-all duration-300
                "
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-plum-800 dark:text-cream-100" />
                ) : (
                  <Menu className="w-5 h-5 text-plum-800 dark:text-cream-100" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-plum-200/30 dark:border-plum-700/20 animate-fade-in-up" aria-label="Mobile navigation">
              {filteredNavigationItems.map(item => {
                const Icon = item.icon
                const hasActiveSubItem = item.subItems.some(sub => sub.id === activeSubItemId)

                return (
                  <div key={item.id} className="mb-2">
                    <div
                      className={`
                        flex items-center gap-3 px-4 py-2 rounded-xl
                        bliss-label text-sm
                        ${hasActiveSubItem
                          ? 'text-cream-50'
                          : 'text-plum-500 dark:text-plum-400'
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
                              bliss-body text-sm font-medium
                              ${isSubActive
                                ? 'bg-plum-100 dark:bg-plum-800 text-plum-800 dark:text-cream-100'
                                : 'text-plum-700 dark:text-cream-200 hover:bg-plum-50 dark:hover:bg-plum-800/50'
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
              <div className="mt-4 pt-4 border-t border-plum-200/30 dark:border-plum-700/20">
                <button
                  onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-plum-50 dark:bg-plum-800/50 text-plum-800 dark:text-cream-100 bliss-body font-medium"
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
