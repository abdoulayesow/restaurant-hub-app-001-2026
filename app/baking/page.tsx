'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /baking to /baking/production
export default function BakingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/baking/production')
  }, [router])

  return null
}
