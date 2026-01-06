'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Redirect based on role
    const role = session.user?.role
    if (role === 'Manager') {
      router.push('/dashboard')
    } else {
      router.push('/editor')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    </div>
  )
}
