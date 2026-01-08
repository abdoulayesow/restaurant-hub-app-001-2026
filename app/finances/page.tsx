'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /finances to /finances/sales
export default function FinancesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/finances/sales')
  }, [router])

  return null
}
