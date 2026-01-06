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
import { NavigationHeader } from '@/components/layout/NavigationHeader'
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
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-cream-200 dark:bg-dark-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-cream-200 dark:bg-dark-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-terracotta-900 dark:text-cream-100"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            {t('dashboard.title')}
          </h1>
          <p className="text-terracotta-600/70 dark:text-cream-300/70 mt-1">
            {currentBakery?.name || 'Loading...'}
            {currentBakery?.location && ` - ${currentBakery.location}`}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
                  <Wallet className="w-6 h-6 text-terracotta-500 dark:text-terracotta-400" />
                </div>
                <h3 className="text-sm font-medium text-terracotta-600/80 dark:text-cream-300/80">
                  {t('dashboard.totalBalance')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
              0 GNF
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60 mt-2">--</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-400/10">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-terracotta-600/80 dark:text-cream-300/80">
                  {t('dashboard.totalRevenue')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
              0 GNF
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">--</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-400/10">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-sm font-medium text-terracotta-600/80 dark:text-cream-300/80">
                  {t('dashboard.totalExpenses')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
              0 GNF
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">--</p>
          </div>

          {/* Profit Margin */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                  <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-terracotta-600/80 dark:text-cream-300/80">
                  {t('dashboard.profitMargin')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100">
              0%
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60 mt-2">--</p>
          </div>
        </div>

        {/* Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Alerts */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 flex items-center gap-2"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('dashboard.lowStockAlerts')}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
                0
              </span>
            </div>
            <div className="text-center py-8 text-terracotta-600/60 dark:text-cream-300/60">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 flex items-center gap-2"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                <Clock className="w-5 h-5 text-terracotta-500" />
                {t('dashboard.pendingApprovals')}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-400">
                0
              </span>
            </div>
            <div className="text-center py-8 text-terracotta-600/60 dark:text-cream-300/60">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('dashboard.revenueOverTime')}
            </h3>
            <div className="h-64 flex items-center justify-center text-terracotta-600/60 dark:text-cream-300/60">
              <p>{t('common.noData')}</p>
            </div>
          </div>

          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('dashboard.expensesByCategory')}
            </h3>
            <div className="h-64 flex items-center justify-center text-terracotta-600/60 dark:text-cream-300/60">
              <p>{t('common.noData')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
