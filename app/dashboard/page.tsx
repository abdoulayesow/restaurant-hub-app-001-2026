'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Package,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ExpensesPieChart } from '@/components/dashboard/ExpensesPieChart'

interface DashboardData {
  kpis: {
    totalRevenue: number
    totalExpenses: number
    profit: number
    profitMargin: number
    balance: number
  }
  revenueByDay: Array<{ date: string; amount: number }>
  expensesByCategory: Array<{ name: string; nameFr: string; amount: number; color: string }>
  lowStockItems: Array<{
    id: string
    name: string
    nameFr: string
    currentStock: number
    minStock: number
    unit: string
    status: 'critical' | 'low'
  }>
  pendingApprovals: {
    sales: number
    expenses: number
  }
}

type PeriodDays = 7 | 30 | 90

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(30)

  const fetchDashboardData = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?restaurantId=${currentRestaurant.id}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant?.id, period])

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

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchDashboardData()
    }
  }, [currentRestaurant?.id, period, fetchDashboardData])

  // Format GNF amount
  const formatGNF = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
  }

  // Get localized item name
  const getLocalizedName = (item: { name: string; nameFr: string }) => {
    return locale === 'fr' ? item.nameFr : item.name
  }

  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-plum-100 dark:bg-plum-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-plum-100 dark:bg-plum-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const totalPending = (dashboardData?.pendingApprovals.sales || 0) + (dashboardData?.pendingApprovals.expenses || 0)
  const lowStockCount = dashboardData?.lowStockItems.length || 0

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Period Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3">
              <h1 className="bliss-display text-3xl font-bold text-plum-800 dark:text-cream-100">
                {t('dashboard.title')}
              </h1>
              <Sparkles className="w-6 h-6 text-mauve-400 animate-sparkle" />
            </div>
            <p className="bliss-body text-plum-500 dark:text-plum-300 mt-1">
              {currentRestaurant?.name || 'Loading...'}
              {currentRestaurant?.location && ` • ${currentRestaurant.location}`}
            </p>
          </div>

          {/* Period Toggle */}
          <div className="flex bg-plum-100 dark:bg-plum-800 rounded-xl p-1 shadow-inner-plum">
            {([7, 30, 90] as PeriodDays[]).map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 bliss-body text-sm font-medium rounded-lg transition-all duration-300 ${
                  period === days
                    ? 'bg-plum-700 text-cream-50 shadow-plum'
                    : 'text-plum-600 dark:text-plum-300 hover:bg-plum-200 dark:hover:bg-plum-700'
                }`}
              >
                {t(`dashboard.period${days}Days`)}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700 bliss-card-stagger-1 hover:shadow-plum-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-plum-100 dark:bg-plum-700">
                  <Wallet className="w-6 h-6 text-plum-600 dark:text-plum-300" />
                </div>
                <h3 className="bliss-body text-sm font-medium text-plum-500 dark:text-plum-300">
                  {t('dashboard.totalBalance')}
                </h3>
              </div>
            </div>
            <p className="bliss-display text-2xl font-bold text-plum-800 dark:text-cream-100">
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.balance || 0)} GNF`}
            </p>
            <p className="bliss-body text-sm text-plum-400 dark:text-plum-400 mt-2">
              {loading ? '--' : `${t('dashboard.period' + period + 'Days')}`}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700 bliss-card-stagger-2 hover:shadow-plum-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="bliss-body text-sm font-medium text-plum-500 dark:text-plum-300">
                  {t('dashboard.totalRevenue')}
                </h3>
              </div>
            </div>
            <p className="bliss-display text-2xl font-bold text-plum-800 dark:text-cream-100">
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.totalRevenue || 0)} GNF`}
            </p>
            <p className="bliss-body text-sm text-emerald-600 dark:text-emerald-400 mt-2">
              {loading ? '--' : `+${formatGNF(dashboardData?.kpis.totalRevenue || 0)} GNF`}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700 bliss-card-stagger-3 hover:shadow-plum-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                  <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="bliss-body text-sm font-medium text-plum-500 dark:text-plum-300">
                  {t('dashboard.totalExpenses')}
                </h3>
              </div>
            </div>
            <p className="bliss-display text-2xl font-bold text-plum-800 dark:text-cream-100">
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.totalExpenses || 0)} GNF`}
            </p>
            <p className="bliss-body text-sm text-rose-600 dark:text-rose-400 mt-2">
              {loading ? '--' : `-${formatGNF(dashboardData?.kpis.totalExpenses || 0)} GNF`}
            </p>
          </div>

          {/* Profit Margin */}
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700 bliss-card-stagger-4 hover:shadow-plum-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-mauve-100 dark:bg-mauve-900/30">
                  <Percent className="w-6 h-6 text-mauve-600 dark:text-mauve-400" />
                </div>
                <h3 className="bliss-body text-sm font-medium text-plum-500 dark:text-plum-300">
                  {t('dashboard.profitMargin')}
                </h3>
              </div>
            </div>
            <p className="bliss-display text-2xl font-bold text-plum-800 dark:text-cream-100">
              {loading ? '...' : `${dashboardData?.kpis.profitMargin || 0}%`}
            </p>
            <p className={`bliss-body text-sm mt-2 ${
              (dashboardData?.kpis.profit || 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {loading ? '--' : `${(dashboardData?.kpis.profit || 0) >= 0 ? '+' : ''}${formatGNF(dashboardData?.kpis.profit || 0)} GNF`}
            </p>
          </div>
        </div>

        {/* Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Alerts */}
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('dashboard.lowStockAlerts')}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full bliss-label text-xs ${
                lowStockCount > 0
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              }`}>
                {lowStockCount}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-plum-100 dark:bg-plum-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : lowStockCount > 0 ? (
              <div className="space-y-2">
                {dashboardData?.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-cream-100 dark:bg-plum-700/50 hover:bg-plum-50 dark:hover:bg-plum-700 transition-colors cursor-pointer group"
                    onClick={() => router.push('/inventory')}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></span>
                      <div>
                        <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100">
                          {getLocalizedName(item)}
                        </p>
                        <p className="bliss-body text-xs text-plum-400 dark:text-plum-400">
                          {item.currentStock} / {item.minStock} {item.unit}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-plum-400 group-hover:text-plum-600 dark:group-hover:text-plum-300 transition-colors" />
                  </div>
                ))}
                {lowStockCount > 5 && (
                  <button
                    onClick={() => router.push('/inventory?lowStock=true')}
                    className="w-full text-center bliss-body text-sm text-plum-500 hover:text-plum-700 dark:text-plum-400 dark:hover:text-plum-300 py-2 transition-colors"
                  >
                    {t('dashboard.viewAll')} ({lowStockCount})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-plum-400 dark:text-plum-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="bliss-body">{t('dashboard.noAlerts')}</p>
              </div>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-plum-500" />
                {t('dashboard.pendingApprovals')}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full bliss-label text-xs ${
                totalPending > 0
                  ? 'bg-plum-100 dark:bg-plum-700 text-plum-700 dark:text-plum-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              }`}>
                {totalPending}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-plum-100 dark:bg-plum-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : totalPending > 0 ? (
              <div className="space-y-3">
                {(dashboardData?.pendingApprovals.sales || 0) > 0 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-xl bg-cream-100 dark:bg-plum-700/50 hover:bg-plum-50 dark:hover:bg-plum-700 transition-colors cursor-pointer group"
                    onClick={() => router.push('/finances/sales?status=Pending')}
                  >
                    <div>
                      <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100">
                        {t('nav.sales')}
                      </p>
                      <p className="bliss-body text-xs text-plum-400 dark:text-plum-400">
                        {dashboardData?.pendingApprovals.sales} {t('common.pending').toLowerCase()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-plum-400 group-hover:text-plum-600 dark:group-hover:text-plum-300 transition-colors" />
                  </div>
                )}
                {(dashboardData?.pendingApprovals.expenses || 0) > 0 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-xl bg-cream-100 dark:bg-plum-700/50 hover:bg-plum-50 dark:hover:bg-plum-700 transition-colors cursor-pointer group"
                    onClick={() => router.push('/finances/expenses?status=Pending')}
                  >
                    <div>
                      <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100">
                        {t('nav.expenses')}
                      </p>
                      <p className="bliss-body text-xs text-plum-400 dark:text-plum-400">
                        {dashboardData?.pendingApprovals.expenses} {t('common.pending').toLowerCase()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-plum-400 group-hover:text-plum-600 dark:group-hover:text-plum-300 transition-colors" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-plum-400 dark:text-plum-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="bliss-body">{t('dashboard.noAlerts')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700">
            <h3 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100 mb-4">
              {t('dashboard.revenueOverTime')}
            </h3>
            {loading ? (
              <div className="h-64 bg-plum-100 dark:bg-plum-700 rounded-lg animate-pulse"></div>
            ) : (
              <RevenueChart data={dashboardData?.revenueByDay || []} />
            )}
          </div>

          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss border border-plum-100 dark:border-plum-700">
            <h3 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100 mb-4">
              {t('dashboard.expensesByCategory')}
            </h3>
            {loading ? (
              <div className="h-64 bg-plum-100 dark:bg-plum-700 rounded-lg animate-pulse"></div>
            ) : (
              <ExpensesPieChart data={dashboardData?.expensesByCategory || []} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
