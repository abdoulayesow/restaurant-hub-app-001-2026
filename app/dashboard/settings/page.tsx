'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { RestaurantSettings } from '@/components/settings/RestaurantSettings'
import { RestaurantConfigSettings } from '@/components/settings/RestaurantConfigSettings'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLocale()

  const isManager = session?.user?.role === 'Manager'

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
      <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-stone-800 rounded-2xl"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-gray-700" />
            <h1
              className="text-3xl font-bold text-gray-900 dark:text-stone-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('settings.title') || 'Bakery Settings'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-stone-300">
            {t('settings.subtitle') || 'Configure your bakery operational settings'}
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Stock Deduction Settings */}
          <RestaurantSettings />

          {/* Restaurant Configuration */}
          <RestaurantConfigSettings />
        </div>
      </main>
    </div>
  )
}
