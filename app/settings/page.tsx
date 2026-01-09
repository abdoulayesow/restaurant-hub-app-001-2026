'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, Store, Settings2, Building2, LayoutGrid, Bell } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { RestaurantTypeSettings } from '@/components/settings/RestaurantTypeSettings'
import { RestaurantSettings } from '@/components/settings/RestaurantSettings'
import { RestaurantConfigSettings } from '@/components/settings/RestaurantConfigSettings'
import { RestaurantManagement } from '@/components/settings/RestaurantManagement'
import { NotificationPreferences } from '@/components/settings/NotificationPreferences'

type TabId = 'type' | 'operations' | 'config' | 'restaurants' | 'notifications'

interface Tab {
  id: TabId
  labelKey: string
  labelFallback: string
  labelFr: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { id: 'type', labelKey: 'settings.tabType', labelFallback: 'Type & Features', labelFr: 'Type & Options', icon: Store },
  { id: 'operations', labelKey: 'settings.tabOperations', labelFallback: 'Operations', labelFr: 'Opérations', icon: Settings2 },
  { id: 'config', labelKey: 'settings.tabConfig', labelFallback: 'Configuration', labelFr: 'Configuration', icon: Building2 },
  { id: 'restaurants', labelKey: 'settings.tabRestaurants', labelFallback: 'Restaurants', labelFr: 'Restaurants', icon: LayoutGrid },
  { id: 'notifications', labelKey: 'settings.tabNotifications', labelFallback: 'Notifications', labelFr: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const [activeTab, setActiveTab] = useState<TabId>('type')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const isManager = session?.user?.role === 'Manager'

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

  // Redirect if not authenticated or not a manager
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    } else if (!isManager) {
      router.push('/dashboard')
    }
  }, [session, status, isManager, router])

  if (status === 'loading' || !session || !isManager) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-cream-200 dark:bg-dark-800 rounded-lg" />
              <div className="h-8 bg-cream-200 dark:bg-dark-800 rounded-lg w-48" />
            </div>
            <div className="h-5 bg-cream-200 dark:bg-dark-800 rounded w-72" />
            <div className="flex gap-2 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-36 bg-cream-200 dark:bg-dark-800 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-cream-200 dark:bg-dark-800 rounded-2xl mt-6" />
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
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="
              w-10 h-10 rounded-xl
              bg-gradient-to-br from-terracotta-400 to-terracotta-600
              flex items-center justify-center
              shadow-md shadow-terracotta-500/20
            ">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-3xl font-bold text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('settings.title') || (locale === 'fr' ? 'Paramètres' : 'Settings')}
            </h1>
          </div>
          <p className="text-terracotta-600 dark:text-cream-300 ml-[52px]">
            {t('settings.subtitle') || (locale === 'fr'
              ? 'Configurez les paramètres opérationnels de votre boulangerie'
              : 'Configure your bakery operational settings'
            )}
          </p>
        </div>

        {/* Tab Bar */}
        <div className="mb-8">
          <div className="
            inline-flex p-1.5 gap-1
            bg-cream-100 dark:bg-dark-800
            rounded-2xl
            shadow-inner shadow-terracotta-900/5 dark:shadow-black/20
          ">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-3
                    rounded-xl font-medium text-sm
                    transition-all duration-300 ease-out
                    ${isActive
                      ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/30'
                      : 'text-terracotta-700 dark:text-cream-200 hover:bg-cream-200/70 dark:hover:bg-dark-700/70'
                    }
                  `}
                  aria-selected={isActive}
                  role="tab"
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="
                      absolute inset-0 rounded-xl
                      bg-gradient-to-t from-terracotta-600/20 to-transparent
                      pointer-events-none
                    " />
                  )}

                  <Icon className={`
                    w-4.5 h-4.5 relative z-10
                    transition-transform duration-300
                    ${isActive ? 'scale-110' : ''}
                  `} />

                  <span className="relative z-10 hidden sm:inline">
                    {getTabLabel(tab)}
                  </span>
                </button>
              )
            })}
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
          {activeTab === 'type' && <RestaurantTypeSettings />}

          {activeTab === 'operations' && <RestaurantSettings />}

          {activeTab === 'config' && <RestaurantConfigSettings />}

          {activeTab === 'restaurants' && <RestaurantManagement />}

          {activeTab === 'notifications' && <NotificationPreferences />}
        </div>
      </main>
    </div>
  )
}
