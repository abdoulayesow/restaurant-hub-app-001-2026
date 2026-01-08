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
} from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'
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
  const { currentBakery, loading: bakeryLoading } = useBakery()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(30)

  const fetchDashboardData = useCallback(async () => {
    if (!currentBakery?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?bakeryId=${currentBakery.id}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentBakery?.id, period])

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
    if (currentBakery?.id) {
      fetchDashboardData()
    }
  }, [currentBakery?.id, period, fetchDashboardData])

  // Format GNF amount
  const formatGNF = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
  }

  // Get localized item name
  const getLocalizedName = (item: { name: string; nameFr: string }) => {
    return locale === 'fr' ? item.nameFr : item.name
  }

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

  const totalPending = (dashboardData?.pendingApprovals.sales || 0) + (dashboardData?.pendingApprovals.expenses || 0)
  const lowStockCount = dashboardData?.lowStockItems.length || 0

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Period Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
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

          {/* Period Toggle */}
          <div className="flex bg-cream-200 dark:bg-dark-700 rounded-lg p-1">
            {([7, 30, 90] as PeriodDays[]).map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === days
                    ? 'bg-terracotta-500 text-white'
                    : 'text-terracotta-700 dark:text-cream-300 hover:bg-cream-300 dark:hover:bg-dark-600'
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
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.balance || 0)} GNF`}
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60 mt-2">
              {loading ? '--' : `${t('dashboard.period' + period + 'Days')}`}
            </p>
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
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.totalRevenue || 0)} GNF`}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {loading ? '--' : `+${formatGNF(dashboardData?.kpis.totalRevenue || 0)} GNF`}
            </p>
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
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.totalExpenses || 0)} GNF`}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {loading ? '--' : `-${formatGNF(dashboardData?.kpis.totalExpenses || 0)} GNF`}
            </p>
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
              {loading ? '...' : `${dashboardData?.kpis.profitMargin || 0}%`}
            </p>
            <p className={`text-sm mt-2 ${
              (dashboardData?.kpis.profit || 0) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {loading ? '--' : `${(dashboardData?.kpis.profit || 0) >= 0 ? '+' : ''}${formatGNF(dashboardData?.kpis.profit || 0)} GNF`}
            </p>
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
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                lowStockCount > 0
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'bg-green-500/10 text-green-700 dark:text-green-400'
              }`}>
                {lowStockCount}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-cream-200 dark:bg-dark-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : lowStockCount > 0 ? (
              <div className="space-y-2">
                {dashboardData?.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-cream-50 dark:bg-dark-700 hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors cursor-pointer"
                    onClick={() => router.push('/inventory')}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></span>
                      <div>
                        <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                          {getLocalizedName(item)}
                        </p>
                        <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
                          {item.currentStock} / {item.minStock} {item.unit}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-terracotta-400 dark:text-cream-500" />
                  </div>
                ))}
                {lowStockCount > 5 && (
                  <button
                    onClick={() => router.push('/inventory?lowStock=true')}
                    className="w-full text-center text-sm text-terracotta-500 hover:text-terracotta-600 dark:text-terracotta-400 py-2"
                  >
                    {t('dashboard.viewAll')} ({lowStockCount})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-terracotta-600/60 dark:text-cream-300/60">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noAlerts')}</p>
              </div>
            )}
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
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                totalPending > 0
                  ? 'bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-400'
                  : 'bg-green-500/10 text-green-700 dark:text-green-400'
              }`}>
                {totalPending}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-cream-200 dark:bg-dark-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : totalPending > 0 ? (
              <div className="space-y-3">
                {(dashboardData?.pendingApprovals.sales || 0) > 0 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg bg-cream-50 dark:bg-dark-700 hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors cursor-pointer"
                    onClick={() => router.push('/finances/sales?status=Pending')}
                  >
                    <div>
                      <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                        {t('nav.sales')}
                      </p>
                      <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
                        {dashboardData?.pendingApprovals.sales} {t('common.pending').toLowerCase()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-terracotta-400 dark:text-cream-500" />
                  </div>
                )}
                {(dashboardData?.pendingApprovals.expenses || 0) > 0 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg bg-cream-50 dark:bg-dark-700 hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors cursor-pointer"
                    onClick={() => router.push('/finances/expenses?status=Pending')}
                  >
                    <div>
                      <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                        {t('nav.expenses')}
                      </p>
                      <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
                        {dashboardData?.pendingApprovals.expenses} {t('common.pending').toLowerCase()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-terracotta-400 dark:text-cream-500" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-terracotta-600/60 dark:text-cream-300/60">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noAlerts')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('dashboard.revenueOverTime')}
            </h3>
            {loading ? (
              <div className="h-64 bg-cream-200 dark:bg-dark-700 rounded-lg animate-pulse"></div>
            ) : (
              <RevenueChart data={dashboardData?.revenueByDay || []} />
            )}
          </div>

          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('dashboard.expensesByCategory')}
            </h3>
            {loading ? (
              <div className="h-64 bg-cream-200 dark:bg-dark-700 rounded-lg animate-pulse"></div>
            ) : (
              <ExpensesPieChart data={dashboardData?.expensesByCategory || []} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
