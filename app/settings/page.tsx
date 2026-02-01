'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, Building2, Settings2, LayoutGrid, Bell, Database, Trash2 } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canAccessSettings } from '@/lib/roles'
import { BakeryProfileSettings } from '@/components/settings/BakeryProfileSettings'
import { RestaurantSettings } from '@/components/settings/RestaurantSettings'
import { RestaurantManagement } from '@/components/settings/RestaurantManagement'
import { NotificationPreferences } from '@/components/settings/NotificationPreferences'
import { ReferenceDataSection } from '@/components/settings/ReferenceDataSection'
import { DataResetSection } from '@/components/settings/DataResetSection'

type TabId = 'profile' | 'operations' | 'reference' | 'data' | 'locations' | 'notifications'

interface Tab {
  id: TabId
  labelKey: string
  labelFallback: string
  labelFr: string
  icon: React.ElementType
  scope: 'restaurant' | 'account'
}

const tabs: Tab[] = [
  { id: 'profile', labelKey: 'settings.tabProfile', labelFallback: 'Bakery Profile', labelFr: 'Profil', icon: Building2, scope: 'restaurant' },
  { id: 'operations', labelKey: 'settings.tabOperations', labelFallback: 'Operations', labelFr: 'Opérations', icon: Settings2, scope: 'restaurant' },
  { id: 'reference', labelKey: 'settings.tabReference', labelFallback: 'Reference Data', labelFr: 'Données de référence', icon: Database, scope: 'restaurant' },
  { id: 'data', labelKey: 'settings.tabData', labelFallback: 'Data Management', labelFr: 'Gestion des données', icon: Trash2, scope: 'restaurant' },
  { id: 'locations', labelKey: 'settings.tabLocations', labelFallback: 'My Locations', labelFr: 'Mes restaurants', icon: LayoutGrid, scope: 'account' },
  { id: 'notifications', labelKey: 'settings.tabNotifications', labelFallback: 'Notifications', labelFr: 'Notifications', icon: Bell, scope: 'account' },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRole, loading: restaurantLoading } = useRestaurant()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const canAccess = canAccessSettings(currentRole)

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId
    if (hash && tabs.some(tab => tab.id === hash)) {
      setActiveTab(hash)
    }
  }, [])

  // Update URL hash when tab changes
  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return

    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTab(tabId)
      window.history.replaceState(null, '', `#${tabId}`)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 150)
  }

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === 'loading' || restaurantLoading) return
    if (!session) {
      router.push('/login')
    } else if (!canAccess) {
      router.push('/editor')
    }
  }, [session, status, canAccess, router, restaurantLoading])

  if (status === 'loading' || restaurantLoading || !session || !canAccess) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 dark:bg-stone-800 rounded-lg" />
              <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded-lg w-48" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-stone-800 rounded w-72" />
            <div className="flex gap-3 mt-6">
              <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 w-28 bg-stone-200 dark:bg-stone-700 rounded-lg" />
                ))}
              </div>
              <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                {[3, 4].map((i) => (
                  <div key={i} className="h-10 w-28 bg-stone-200 dark:bg-stone-700 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="h-96 bg-gray-200 dark:bg-stone-800 rounded-xl mt-6" />
          </div>
        </main>
      </div>
    )
  }

  const getTabLabel = (tab: Tab) => {
    const translated = t(tab.labelKey)
    if (translated && translated !== tab.labelKey) return translated
    return locale === 'fr' ? tab.labelFr : tab.labelFallback
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
              <Settings className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {t('settings.title') || (locale === 'fr' ? 'Paramètres' : 'Settings')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-stone-400 ml-[52px]">
            {t('settings.subtitle') || (locale === 'fr'
              ? 'Configurez les paramètres opérationnels de votre boulangerie'
              : 'Configure your bakery operational settings'
            )}
          </p>
        </div>

        {/* Tab Bar - Grouped by scope */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Restaurant Settings Group */}
            <div className="inline-flex p-1 gap-1 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700">
              {tabs.filter(t => t.scope === 'restaurant').map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                    aria-selected={isActive}
                    role="tab"
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                  </button>
                )
              })}
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-8 bg-stone-300 dark:bg-stone-600" />

            {/* Account Settings Group */}
            <div className="inline-flex p-1 gap-1 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700">
              {tabs.filter(t => t.scope === 'account').map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                    aria-selected={isActive}
                    role="tab"
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Scope Labels */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500 dark:text-stone-500">
            <span className="pl-2">
              {t('settings.scopeRestaurant') || (locale === 'fr' ? 'Paramètres restaurant' : 'Restaurant settings')}
            </span>
            <span className="hidden sm:inline-block w-px h-3 bg-transparent" />
            <span className="sm:pl-4">
              {t('settings.scopeAccount') || (locale === 'fr' ? 'Paramètres compte' : 'Account settings')}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div
          className={`
            transition-all duration-200 ease-out
            ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
          `}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'profile' && <BakeryProfileSettings />}

          {activeTab === 'operations' && <RestaurantSettings />}

          {activeTab === 'reference' && <ReferenceDataSection />}

          {activeTab === 'data' && <DataResetSection />}

          {activeTab === 'locations' && <RestaurantManagement />}

          {activeTab === 'notifications' && <NotificationPreferences />}
        </div>
      </main>
    </div>
  )
}
