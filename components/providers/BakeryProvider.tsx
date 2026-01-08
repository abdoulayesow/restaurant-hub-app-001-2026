'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PaletteName, colorPalettes } from '@/components/brand/Logo'
import { Toast } from '@/components/ui/Toast'
import { useLocale } from './LocaleProvider'

interface Bakery {
  id: string
  name: string
  location: string | null
}

type ToastState = {
  message: string
  color: string
} | null

interface BakeryContextType {
  bakeries: Bakery[]
  currentBakery: Bakery | null
  currentPalette: PaletteName
  setCurrentBakery: (bakery: Bakery) => void
  loading: boolean
}

const BakeryContext = createContext<BakeryContextType | null>(null)

// Palette names in order for cycling through bakeries
const paletteNames: PaletteName[] = ['terracotta', 'warmBrown', 'burntSienna', 'gold']

// Get palette for bakery based on its index in the list
function getPaletteForBakeryIndex(index: number): PaletteName {
  return paletteNames[index % paletteNames.length]
}

export function BakeryProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const { t } = useLocale()
  const [bakeries, setBakeries] = useState<Bakery[]>([])
  const [currentBakery, setCurrentBakeryState] = useState<Bakery | null>(null)
  const [currentPalette, setCurrentPalette] = useState<PaletteName>('terracotta')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch user's accessible bakeries only when authenticated
  useEffect(() => {
    // Skip fetching if not authenticated
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session) {
      setLoading(false)
      return
    }

    const fetchBakeries = async () => {
      try {
        const res = await fetch('/api/bakeries/my-bakeries')
        if (res.ok) {
          const data = await res.json()
          const fetchedBakeries = data.bakeries || []
          setBakeries(fetchedBakeries)

          // Set default bakery from localStorage or first in list
          const savedBakeryId = localStorage.getItem('currentBakeryId')
          const savedBakery = fetchedBakeries.find((b: Bakery) => b.id === savedBakeryId)

          let selectedBakery: Bakery | null = null
          let selectedIndex = 0

          if (savedBakery) {
            selectedBakery = savedBakery
            selectedIndex = fetchedBakeries.findIndex((b: Bakery) => b.id === savedBakery.id)
          } else if (data.defaultBakery) {
            selectedBakery = data.defaultBakery
            selectedIndex = fetchedBakeries.findIndex((b: Bakery) => b.id === data.defaultBakery.id)
          } else if (fetchedBakeries.length > 0) {
            selectedBakery = fetchedBakeries[0]
            selectedIndex = 0
          }

          if (selectedBakery) {
            setCurrentBakeryState(selectedBakery)
            setCurrentPalette(getPaletteForBakeryIndex(selectedIndex >= 0 ? selectedIndex : 0))
          }
        }
      } catch (error) {
        console.error('Failed to fetch bakeries:', error)
      } finally {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }

    fetchBakeries()
  }, [session, status])

  const setCurrentBakery = useCallback((bakery: Bakery) => {
    const previousBakery = currentBakery
    setCurrentBakeryState(bakery)
    localStorage.setItem('currentBakeryId', bakery.id)

    // Find bakery index and set palette
    const bakeryIndex = bakeries.findIndex(b => b.id === bakery.id)
    const newPalette = getPaletteForBakeryIndex(bakeryIndex >= 0 ? bakeryIndex : 0)
    setCurrentPalette(newPalette)

    // Show toast notification only if this is a switch (not initial load)
    if (previousBakery && previousBakery.id !== bakery.id && !isInitialLoad) {
      const palette = colorPalettes[newPalette]
      setToast({
        message: `${t('common.switchedTo') || 'Switched to'} ${bakery.name}`,
        color: palette.primary
      })
    }
  }, [bakeries, currentBakery, isInitialLoad, t])

  return (
    <BakeryContext.Provider value={{ bakeries, currentBakery, currentPalette, setCurrentBakery, loading }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          color={toast.color}
          type="info"
          onClose={() => setToast(null)}
        />
      )}
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
