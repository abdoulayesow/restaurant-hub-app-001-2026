'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NavigationHeader } from '@/components/layout/NavigationHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

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
