'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canAccessDashboard } from '@/lib/roles'
import { formatDateShort } from '@/lib/date-utils'
import { CashRunwayCard } from '@/components/projection/CashRunwayCard'
import { ProfitabilityCard } from '@/components/projection/ProfitabilityCard'
import { DemandForecastCard } from '@/components/projection/DemandForecastCard'
import { StockDepletionTable } from '@/components/projection/StockDepletionTable'
import { DemandForecastChart, type ForecastPeriod } from '@/components/projection/DemandForecastChart'
import type {
  StockForecast,
  ReorderRecommendation,
  CashRunwayData,
  DemandForecast,
  ProfitabilityData
} from '@/lib/projection-utils'

interface ProjectionData {
  stockForecasts: StockForecast[]
  reorderRecommendations: ReorderRecommendation[]
  cashRunway: CashRunwayData
  demandForecasts: DemandForecast[]
  profitability: ProfitabilityData
  historicalData: Array<{ date: string; revenue: number; expenses: number }>
}

export default function ProjectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, currentPalette, loading: restaurantLoading } = useRestaurant()

  const [projectionData, setProjectionData] = useState<ProjectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<ForecastPeriod>('7d')

  const hasAccess = canAccessDashboard(currentRole)

  useEffect(() => {
    if (status === 'loading' || restaurantLoading) return
    if (!session) {
      router.push('/login')
      return
    }
    if (!hasAccess) {
      router.push('/editor')
    }
  }, [session, status, hasAccess, restaurantLoading, router])

  useEffect(() => {
    async function fetchProjections() {
      if (!currentRestaurant?.id) return

      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          restaurantId: currentRestaurant.id,
          analysisWindow: '30',
          forecastPeriods: '7,14,30'
        })

        const response = await fetch(`/api/projections?${params}`)

        if (!response.ok) {
          throw new Error('Failed to fetch projections')
        }

        const data = await response.json()
        setProjectionData(data)
      } catch (err) {
        console.error('Error fetching projections:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProjections()
  }, [currentRestaurant?.id])

  // Loading skeleton
  if (status === 'loading' || restaurantLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded w-1/3"></div>

            {/* KPI cards skeleton */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
              <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
              <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
            </div>

            {/* Table skeleton */}
            <div className="h-96 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              {t('projection.errorTitle') || 'Failed to Load Projections'}
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!projectionData) return null

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                {t('projection.title') || 'Business Projections'}
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                {currentRestaurant?.name} • {t('projection.analysisWindow') || 'Based on 30-day analysis'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-700/50 rounded-lg">
                {(['7d', '14d', '30d'] as ForecastPeriod[]).map((period) => {
                  const isSelected = selectedPeriod === period
                  const periodLabel = period === '7d'
                    ? (t('projection.period7d') || '7 days')
                    : period === '14d'
                    ? (t('projection.period14d') || '14 days')
                    : (t('projection.period30d') || '30 days')

                  return (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                        ${isSelected
                          ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-terracotta-500/30'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                        }
                      `}
                    >
                      {periodLabel}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <TrendingUp className="w-4 h-4" />
                <span>{t('projection.lastUpdated') || 'Updated'}: {formatDateShort(new Date(), locale)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <CashRunwayCard data={projectionData.cashRunway} palette={currentPalette as 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'} />
          <DemandForecastCard forecasts={projectionData.demandForecasts} selectedPeriod={selectedPeriod} />
          <ProfitabilityCard data={projectionData.profitability} palette={currentPalette as 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'} />
        </div>

        {/* Stock Depletion Section (PRIMARY FOCUS) */}
        <div className="mb-8">
          <StockDepletionTable forecasts={projectionData.stockForecasts} />
        </div>

        {/* Revenue & Expense Projection Chart */}
        <div className="mb-8">
          <DemandForecastChart
            forecasts={projectionData.demandForecasts}
            historicalData={projectionData.historicalData}
            palette={currentPalette as 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'}
            selectedPeriod={selectedPeriod}
          />
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-stone-700 dark:text-stone-300">
              <p className="font-semibold mb-1">
                {t('projection.disclaimerTitle') || 'Important Note'}
              </p>
              <p className="text-stone-600 dark:text-stone-400">
                {t('projection.disclaimer') || 'These projections are estimates based on historical data and statistical models. Actual results may vary. Use this data as a guide for planning, not as absolute predictions.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
