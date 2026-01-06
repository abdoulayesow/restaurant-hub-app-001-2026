'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface Bakery {
  id: string
  name: string
  location: string | null
}

interface BakeryContextType {
  bakeries: Bakery[]
  currentBakery: Bakery | null
  setCurrentBakery: (bakery: Bakery) => void
  loading: boolean
}

const BakeryContext = createContext<BakeryContextType | null>(null)

export function BakeryProvider({ children }: { children: ReactNode }) {
  const [bakeries, setBakeries] = useState<Bakery[]>([])
  const [currentBakery, setCurrentBakeryState] = useState<Bakery | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user's accessible bakeries
  useEffect(() => {
    const fetchBakeries = async () => {
      try {
        const res = await fetch('/api/bakeries/my-bakeries')
        if (res.ok) {
          const data = await res.json()
          setBakeries(data.bakeries || [])

          // Set default bakery from localStorage or first in list
          const savedBakeryId = localStorage.getItem('currentBakeryId')
          const savedBakery = data.bakeries?.find((b: Bakery) => b.id === savedBakeryId)

          if (savedBakery) {
            setCurrentBakeryState(savedBakery)
          } else if (data.defaultBakery) {
            setCurrentBakeryState(data.defaultBakery)
          } else if (data.bakeries?.length > 0) {
            setCurrentBakeryState(data.bakeries[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch bakeries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBakeries()
  }, [])

  const setCurrentBakery = useCallback((bakery: Bakery) => {
    setCurrentBakeryState(bakery)
    localStorage.setItem('currentBakeryId', bakery.id)
  }, [])

  return (
    <BakeryContext.Provider value={{ bakeries, currentBakery, setCurrentBakery, loading }}>
      {children}
    </BakeryContext.Provider>
  )
}

export function useBakery() {
  const context = useContext(BakeryContext)
  if (!context) {
    throw new Error('useBakery must be used within a BakeryProvider')
  }
  return context
}
