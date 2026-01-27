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
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ExpensesPieChart } from '@/components/dashboard/ExpensesPieChart'
import { UnpaidExpensesWidget } from '@/components/dashboard/UnpaidExpensesWidget'
import { InventoryValueCard } from '@/components/dashboard/InventoryValueCard'
import { ExpiringItemsWidget } from '@/components/dashboard/ExpiringItemsWidget'
import { ExpiryStatus } from '@/lib/inventory-helpers'

interface DashboardData {
  kpis: {
    totalRevenue: number
    totalExpenses: number
    profit: number
    profitMargin: number
    balance: number
    inventoryValue: number
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
  unpaidExpenses?: {
    expenses: Array<{
      id: string
      categoryName: string
      amountGNF: number
      totalPaidAmount: number
      date: string
      supplier?: { name: string } | null
    }>
    totalOutstanding: number
    count: number
  }
  inventoryValuation?: {
    totalValue: number
    byCategory: Array<{
      category: string
      value: number
      itemCount: number
      percentOfTotal: number
    }>
  }
  expiringItems?: {
    items: Array<{
      id: string
      name: string
      nameFr: string
      category: string | null
      currentStock: number
      unit: string
      expiryDate: string | null
      status: ExpiryStatus
      daysUntilExpiry: number | null
    }>
    expiredCount: number
    warningCount: number
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
      <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-stone-800 rounded-xl"></div>
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
    <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Period Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 dark:text-stone-400 mt-1">
              {currentRestaurant?.name || 'Loading...'}
              {currentRestaurant?.location && ` • ${currentRestaurant.location}`}
            </p>
          </div>

          {/* Period Toggle */}
          <div className="flex bg-white dark:bg-stone-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-stone-700">
            {([7, 30, 90] as PeriodDays[]).map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  period === days
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-700'
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
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                  <Wallet className="w-5 h-5 text-gray-700 dark:text-stone-300" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('dashboard.totalBalance')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.balance || 0)} GNF`}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400 mt-2">
              {loading ? '--' : `${t('dashboard.period' + period + 'Days')}`}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('dashboard.totalRevenue')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.totalRevenue || 0)} GNF`}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
              {loading ? '--' : `+${formatGNF(dashboardData?.kpis.totalRevenue || 0)} GNF`}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                  <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('dashboard.totalExpenses')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {loading ? '...' : `${formatGNF(dashboardData?.kpis.totalExpenses || 0)} GNF`}
            </p>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">
              {loading ? '--' : `-${formatGNF(dashboardData?.kpis.totalExpenses || 0)} GNF`}
            </p>
          </div>

          {/* Profit Margin */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('dashboard.profitMargin')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {loading ? '...' : `${dashboardData?.kpis.profitMargin || 0}%`}
            </p>
            <p className={`text-sm mt-2 ${
              (dashboardData?.kpis.profit || 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {loading ? '--' : `${(dashboardData?.kpis.profit || 0) >= 0 ? '+' : ''}${formatGNF(dashboardData?.kpis.profit || 0)} GNF`}
            </p>
          </div>
        </div>

        {/* Alerts & Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('dashboard.lowStockAlerts')}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  <div key={i} className="h-12 bg-gray-100 dark:bg-stone-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : lowStockCount > 0 ? (
              <div className="space-y-2">
                {dashboardData?.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors cursor-pointer group"
                    onClick={() => router.push('/inventory')}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                          {getLocalizedName(item)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-stone-400">
                          {item.currentStock} / {item.minStock} {item.unit}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300 transition-colors" />
                  </div>
                ))}
                {lowStockCount > 5 && (
                  <button
                    onClick={() => router.push('/inventory?lowStock=true')}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-gray-300 py-2 transition-colors"
                  >
                    {t('dashboard.viewAll')} ({lowStockCount})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-stone-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noAlerts')}</p>
              </div>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                {t('dashboard.pendingApprovals')}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                totalPending > 0
                  ? 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              }`}>
                {totalPending}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-stone-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : totalPending > 0 ? (
              <div className="space-y-3">
                {(dashboardData?.pendingApprovals.sales || 0) > 0 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors cursor-pointer group"
                    onClick={() => router.push('/finances/sales?status=Pending')}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                        {t('nav.sales')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-stone-400">
                        {dashboardData?.pendingApprovals.sales} {t('common.pending').toLowerCase()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300 transition-colors" />
                  </div>
                )}
                {(dashboardData?.pendingApprovals.expenses || 0) > 0 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors cursor-pointer group"
                    onClick={() => router.push('/finances/expenses?status=Pending')}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                        {t('nav.expenses')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-stone-400">
                        {dashboardData?.pendingApprovals.expenses} {t('common.pending').toLowerCase()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300 transition-colors" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-stone-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noAlerts')}</p>
              </div>
            )}
          </div>

          {/* Unpaid Expenses Widget */}
          <UnpaidExpensesWidget
            expenses={dashboardData?.unpaidExpenses?.expenses || []}
            totalOutstanding={dashboardData?.unpaidExpenses?.totalOutstanding || 0}
            loading={loading}
          />

          {/* Expiring Items Widget */}
          <ExpiringItemsWidget
            items={dashboardData?.expiringItems?.items || []}
            expiredCount={dashboardData?.expiringItems?.expiredCount || 0}
            warningCount={dashboardData?.expiringItems?.warningCount || 0}
            loading={loading}
          />

          {/* Inventory Value Widget */}
          <InventoryValueCard
            totalValue={dashboardData?.inventoryValuation?.totalValue || 0}
            byCategory={dashboardData?.inventoryValuation?.byCategory || []}
            loading={loading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
              {t('dashboard.revenueOverTime')}
            </h3>
            {loading ? (
              <div className="h-64 bg-gray-100 dark:bg-stone-700 rounded-lg animate-pulse"></div>
            ) : (
              <RevenueChart data={dashboardData?.revenueByDay || []} />
            )}
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
              {t('dashboard.expensesByCategory')}
            </h3>
            {loading ? (
              <div className="h-64 bg-gray-100 dark:bg-stone-700 rounded-lg animate-pulse"></div>
            ) : (
              <ExpensesPieChart data={dashboardData?.expensesByCategory || []} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
