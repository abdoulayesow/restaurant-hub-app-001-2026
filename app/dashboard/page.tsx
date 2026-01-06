'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Package,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLocale()
  const { currentBakery, loading: bakeryLoading } = useBakery()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    // Only managers can access dashboard
    if (session.user?.role !== 'Manager') {
      router.push('/editor')
    }
  }, [session, status, router])

  if (status === 'loading' || bakeryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentBakery?.name || 'Loading...'}
            {currentBakery?.location && ` - ${currentBakery.location}`}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gold-100 dark:bg-gold-900/20 rounded-lg">
                  <Wallet className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard.totalBalance')}
                </h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              0 GNF
            </p>
            <p className="text-sm text-gray-500 mt-2">--</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard.totalRevenue')}
                </h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              0 GNF
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">--</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard.totalExpenses')}
                </h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              0 GNF
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">--</p>
          </div>

          {/* Profit Margin */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboard.profitMargin')}
                </h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              0%
            </p>
            <p className="text-sm text-gray-500 mt-2">--</p>
          </div>
        </div>

        {/* Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                {t('dashboard.lowStockAlerts')}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                0
              </span>
            </div>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold-500" />
                {t('dashboard.pendingApprovals')}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-400">
                0
              </span>
            </div>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.revenueOverTime')}
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>{t('common.noData')}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.expensesByCategory')}
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>{t('common.noData')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
