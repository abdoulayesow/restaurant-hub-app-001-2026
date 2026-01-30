'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canAccessAdmin } from '@/lib/roles'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { currentRole, loading: restaurantLoading } = useRestaurant()

  const hasAccess = canAccessAdmin(currentRole)

  // Redirect if not authenticated or doesn't have access
  useEffect(() => {
    if (status === 'loading' || restaurantLoading) return
    if (!session) {
      router.push('/login')
    } else if (!hasAccess) {
      router.push('/dashboard')
    }
  }, [session, status, hasAccess, restaurantLoading, router])

  if (status === 'loading' || restaurantLoading || !session || !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 dark:bg-stone-800 rounded-2xl"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <NavigationHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
