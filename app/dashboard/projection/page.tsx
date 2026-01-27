'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Target, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

export default function ProjectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user?.role !== 'Manager') {
      router.push('/editor')
    }
  }, [session, status, router])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  if (status === 'loading' || restaurantLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-stone-100">
            {t('projection.title') || 'Projections'}
          </h1>
          <p className="text-gray-600 dark:text-stone-400 mt-1">
            {currentRestaurant?.name || 'Loading...'}
          </p>
        </div>

        {/* Projection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Weekly Forecast */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-stone-700">
                <Calendar className="w-6 h-6 text-gray-600 dark:text-stone-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-stone-100">
                {t('projection.weeklyForecast') || 'Weekly Forecast'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('projection.basedOnHistory') || 'Based on historical data'}
            </p>
          </div>

          {/* Monthly Target */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-400/10">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-stone-100">
                {t('projection.monthlyTarget') || 'Monthly Target'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(0)}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-stone-400">
                0% {t('projection.achieved') || 'achieved'}
              </span>
            </div>
          </div>

          {/* Growth Trend */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-stone-100">
                {t('projection.growthTrend') || 'Growth Trend'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              --
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('projection.vsLastMonth') || 'vs last month'}
            </p>
          </div>
        </div>

        {/* Projections Chart Placeholder */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
            {t('projection.revenueProjection') || 'Revenue Projection'}
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-stone-600" />
              <p className="text-gray-500 dark:text-stone-400 max-w-md">
                {t('projection.noDataYet') || 'Start recording sales to see revenue projections and growth forecasts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Expected Revenue */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              {t('projection.expectedRevenue') || 'Expected Revenue'}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-stone-700">
                <span className="text-gray-600 dark:text-stone-300">
                  {t('projection.thisWeek') || 'This Week'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-stone-700">
                <span className="text-gray-600 dark:text-stone-300">
                  {t('projection.thisMonth') || 'This Month'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-stone-300">
                  {t('projection.thisQuarter') || 'This Quarter'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">{formatCurrency(0)}</span>
              </div>
            </div>
          </div>

          {/* Expected Expenses */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              {t('projection.expectedExpenses') || 'Expected Expenses'}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-stone-700">
                <span className="text-gray-600 dark:text-stone-300">
                  {t('projection.thisWeek') || 'This Week'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-stone-700">
                <span className="text-gray-600 dark:text-stone-300">
                  {t('projection.thisMonth') || 'This Month'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-stone-300">
                  {t('projection.thisQuarter') || 'This Quarter'}
                </span>
                <span className="font-medium text-gray-900 dark:text-stone-100">{formatCurrency(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
