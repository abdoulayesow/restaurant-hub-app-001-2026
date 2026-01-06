'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Receipt,
  Building2,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Store,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

const managerLinks = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'inventory', icon: Package },
  { href: '/production', label: 'production', icon: TrendingUp },
  { href: '/sales', label: 'sales', icon: TrendingUp },
  { href: '/expenses', label: 'expenses', icon: Receipt },
  { href: '/bank', label: 'bank', icon: Building2 },
]

const editorLinks = [
  { href: '/editor', label: 'dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'inventory', icon: Package },
  { href: '/production', label: 'production', icon: TrendingUp },
  { href: '/sales', label: 'sales', icon: TrendingUp },
  { href: '/expenses', label: 'expenses', icon: Receipt },
]

export function DashboardHeader() {
  const { data: session } = useSession()
  const { t, locale, setLocale } = useLocale()
  const { theme, toggleTheme } = useTheme()
  const { bakeries, currentBakery, setCurrentBakery } = useBakery()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bakeryDropdownOpen, setBakeryDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const isManager = session?.user?.role === 'Manager'
  const links = isManager ? managerLinks : editorLinks

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Bakery Selector */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href={isManager ? '/dashboard' : '/editor'} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center shadow-gold">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('common.appName')}
                </h1>
              </div>
            </Link>

            {/* Bakery Selector (if multiple bakeries) */}
            {bakeries.length > 1 && currentBakery && (
              <div className="relative">
                <button
                  onClick={() => setBakeryDropdownOpen(!bakeryDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Store className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {currentBakery.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {bakeryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {bakeries.map((bakery) => (
                      <button
                        key={bakery.id}
                        onClick={() => {
                          setCurrentBakery(bakery)
                          setBakeryDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          bakery.id === currentBakery.id
                            ? 'text-gold-600 dark:text-gold-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {bakery.name}
                        {bakery.location && (
                          <span className="block text-xs text-gray-500">{bakery.location}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gold-100 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(`common.${link.label}`)}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              className="hidden sm:flex items-center px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gold-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                  {session?.user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded">
                      {session?.user?.role}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User className="w-4 h-4" />
                    {t('common.profile')}
                  </Link>
                  {isManager && (
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4" />
                      {t('common.settings')}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-gold-100 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(`common.${link.label}`)}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
