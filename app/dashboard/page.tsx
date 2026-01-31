'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
} from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canAccessDashboard } from '@/lib/roles'
import { PeriodSelector, PeriodOption } from '@/components/dashboard/PeriodSelector'
import { ViewToggle, ViewMode } from '@/components/dashboard/ViewToggle'
import { RevenueExpensesChart } from '@/components/dashboard/RevenueExpensesChart'
import { FoodCostRatioCard } from '@/components/dashboard/FoodCostRatioCard'
import { ExpenseBreakdownCard } from '@/components/dashboard/ExpenseBreakdownCard'
import { InventoryStatusCard } from '@/components/dashboard/InventoryStatusCard'
import { AlertsCard } from '@/components/dashboard/AlertsCard'
import { UnpaidExpensesWidget } from '@/components/dashboard/UnpaidExpensesWidget'
import { ExpiryStatus } from '@/lib/inventory-helpers'

interface DashboardData {
  kpis: {
    totalRevenue: number
    totalExpenses: number
    profit: number
    profitMargin: number
    balance: number
    inventoryValue: number
    revenueChange: number
    expensesChange: number
    foodCostRatio: number
    foodCostTarget: number
    foodExpenses: number
  }
  revenueByDay: Array<{ date: string; revenue: number; expenses: number }>
  expensesByCategory: Array<{ name: string; nameFr: string; amount: number; color: string }>
  expensesByGroup: Array<{ key: string; label: string; labelFr: string; amount: number; color: string }>
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
  stockConsumption?: {
    totalValue: number
    topItems: Array<{
      name: string
      nameFr: string
      quantity: number
      unit: string
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
  viewMode: ViewMode
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodOption>('30')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('business')

  const fetchDashboardData = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoading(true)
    try {
      let url = `/api/dashboard?restaurantId=${currentRestaurant.id}&viewMode=${viewMode}`

      if (period === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`
      } else {
        url += `&period=${period}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant?.id, period, customStartDate, customEndDate, viewMode])

  useEffect(() => {
    if (status === 'loading' || restaurantLoading) return
    if (!session) {
      router.push('/login')
      return
    }
    // Only Owner (and legacy Manager) can access dashboard
    if (!canAccessDashboard(currentRole)) {
      router.push('/editor')
    }
  }, [session, status, router, currentRole, restaurantLoading])

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchDashboardData()
    }
  }, [currentRestaurant?.id, fetchDashboardData])

  const handleCustomDatesChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate)
    setCustomEndDate(endDate)
  }

  // Format compact GNF
  const formatGNFCompact = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-stone-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const kpis = dashboardData?.kpis

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600 dark:text-stone-400 mt-1">
                {currentRestaurant?.name || t('common.loading')}
                {currentRestaurant?.location && ` • ${currentRestaurant.location}`}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <PeriodSelector
                period={period}
                onPeriodChange={setPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomDatesChange={handleCustomDatesChange}
              />
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {viewMode === 'cash' ? t('dashboard.cashIn') : t('dashboard.totalRevenue')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {loading ? '...' : `${formatGNFCompact(kpis?.totalRevenue || 0)} GNF`}
            </p>
            {!loading && kpis?.revenueChange !== undefined && (
              <div className={`flex items-center gap-1 text-sm mt-2 ${
                kpis.revenueChange >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {kpis.revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{kpis.revenueChange >= 0 ? '+' : ''}{kpis.revenueChange}% {t('dashboard.vsPrevious')}</span>
              </div>
            )}
          </div>

          {/* Expenses Card */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                  <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {viewMode === 'cash' ? t('dashboard.cashOut') : t('dashboard.totalExpenses')}
                </h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {loading ? '...' : `${formatGNFCompact(kpis?.totalExpenses || 0)} GNF`}
            </p>
            {!loading && kpis?.expensesChange !== undefined && (
              <div className={`flex items-center gap-1 text-sm mt-2 ${
                kpis.expensesChange <= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {kpis.expensesChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                <span>{kpis.expensesChange >= 0 ? '+' : ''}{kpis.expensesChange}% {t('dashboard.vsPrevious')}</span>
              </div>
            )}
          </div>

          {/* Profit/Margin Card */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${
                  (kpis?.profit || 0) >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/30'
                    : 'bg-rose-50 dark:bg-rose-900/30'
                }`}>
                  {(kpis?.profit || 0) >= 0 ? (
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('dashboard.profit')}
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                (kpis?.profitMargin || 0) >= 20
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : (kpis?.profitMargin || 0) >= 0
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
              }`}>
                <Percent className="w-3 h-3 inline mr-0.5" />
                {loading ? '--' : `${kpis?.profitMargin || 0}%`}
              </span>
            </div>
            <p className={`text-2xl font-bold ${
              (kpis?.profit || 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {loading ? '...' : `${(kpis?.profit || 0) >= 0 ? '+' : ''}${formatGNFCompact(kpis?.profit || 0)} GNF`}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400 mt-2">
              {t('dashboard.profitMargin')}: {loading ? '--' : `${kpis?.profitMargin || 0}%`}
            </p>
          </div>
        </div>

        {/* Revenue/Expenses Chart */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
            {viewMode === 'cash' ? t('dashboard.cashFlowOverTime') : t('dashboard.revenueExpensesOverTime')}
          </h3>
          {loading ? (
            <div className="h-64 bg-gray-100 dark:bg-stone-700 rounded-lg animate-pulse"></div>
          ) : (
            <RevenueExpensesChart data={dashboardData?.revenueByDay || []} />
          )}
        </div>

        {/* Food Cost & Expense Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FoodCostRatioCard
            ratio={kpis?.foodCostRatio || 0}
            target={kpis?.foodCostTarget || 30}
            foodExpenses={kpis?.foodExpenses || 0}
            revenue={kpis?.totalRevenue || 0}
            loading={loading}
          />
          <ExpenseBreakdownCard
            expensesByGroup={dashboardData?.expensesByGroup || []}
            totalExpenses={kpis?.totalExpenses || 0}
            loading={loading}
          />
        </div>

        {/* Inventory Status - Full Width */}
        <div className="mb-8">
          <InventoryStatusCard
            totalValue={dashboardData?.inventoryValuation?.totalValue || 0}
            itemCount={dashboardData?.inventoryValuation?.byCategory?.reduce((sum, c) => sum + c.itemCount, 0) || 0}
            lowStockCount={dashboardData?.lowStockItems?.length || 0}
            criticalCount={dashboardData?.lowStockItems?.filter(i => i.status === 'critical').length || 0}
            consumptionValue={dashboardData?.stockConsumption?.totalValue || 0}
            topConsumed={dashboardData?.stockConsumption?.topItems || []}
            loading={loading}
          />
        </div>

        {/* Alerts & Unpaid Expenses Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsCard
            lowStockItems={dashboardData?.lowStockItems || []}
            expiringItems={dashboardData?.expiringItems?.items || []}
            pendingApprovals={dashboardData?.pendingApprovals || { sales: 0, expenses: 0 }}
            loading={loading}
          />
          <UnpaidExpensesWidget
            expenses={dashboardData?.unpaidExpenses?.expenses || []}
            totalOutstanding={dashboardData?.unpaidExpenses?.totalOutstanding || 0}
            loading={loading}
          />
        </div>
      </main>
    </div>
  )
}
