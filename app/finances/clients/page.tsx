'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users,
  TrendingUp,
  CreditCard,
  DollarSign,
  Building2,
  ShoppingCart,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { QuickActionsMenu } from '@/components/layout/QuickActionsMenu'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { CustomersTab } from '@/components/admin/CustomersTab'

interface ApiCustomer {
  isActive: boolean
  creditLimit: number | null
  outstandingDebt: number | null
  customerType: 'Individual' | 'Corporate' | 'Wholesale'
}

interface ClientStats {
  totalCustomers: number
  activeCustomers: number
  creditCustomers: number
  totalOutstandingDebt: number
  customersWithDebt: number
  averageDebt: number
  corporateCount: number
  individualCount: number
  wholesaleCount: number
}

export default function FinancesClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch customer stats
  const fetchStats = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/customers?restaurantId=${currentRestaurant.id}`)
      if (res.ok) {
        const data = await res.json()
        const customers: ApiCustomer[] = data.customers || []

        // Calculate stats
        const activeCustomers = customers.filter((c) => c.isActive)
        const creditCustomers = customers.filter((c) => c.creditLimit && c.creditLimit > 0)
        const customersWithDebt = customers.filter(
          (c) => c.outstandingDebt && c.outstandingDebt > 0
        )
        const totalDebt = customersWithDebt.reduce(
          (sum: number, c) => sum + (c.outstandingDebt || 0),
          0
        )

        setStats({
          totalCustomers: customers.length,
          activeCustomers: activeCustomers.length,
          creditCustomers: creditCustomers.length,
          totalOutstandingDebt: totalDebt,
          customersWithDebt: customersWithDebt.length,
          averageDebt: customersWithDebt.length > 0 ? totalDebt / customersWithDebt.length : 0,
          corporateCount: customers.filter((c) => c.customerType === 'Corporate').length,
          individualCount: customers.filter((c) => c.customerType === 'Individual').length,
          wholesaleCount: customers.filter((c) => c.customerType === 'Wholesale').length,
        })
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant?.id])

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchStats()
    }
  }, [currentRestaurant?.id, fetchStats])

  // Format currency
  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' GNF'
    )
  }

  // Loading state
  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-stone-800 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
            {t('clients.title')}
          </h1>
          <p className="text-gray-600 dark:text-stone-400 mt-1">
            {currentRestaurant?.name || 'Loading...'}
          </p>
        </div>

        {/* Stats Grid */}
        {!loading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 animate-in fade-in duration-500">
            {/* Total Customers Card */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                  {t('clients.totalClients')}
                </h3>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
                {stats.totalCustomers}
              </p>
              <p className="text-xs text-gray-500 dark:text-stone-400">
                {stats.activeCustomers} {t('clients.active')}
              </p>
            </div>

            {/* Credit Customers Card */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                  {t('clients.withCredit')}
                </h3>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
                {stats.creditCustomers}
              </p>
              <p className="text-xs text-gray-500 dark:text-stone-400">
                {stats.totalCustomers > 0
                  ? Math.round((stats.creditCustomers / stats.totalCustomers) * 100)
                  : 0}
                % {t('clients.ofTotal')}
              </p>
            </div>

            {/* Outstanding Debt Card */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                  {t('clients.totalDebt')}
                </h3>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                {formatCurrency(stats.totalOutstandingDebt)}
              </p>
              <p className="text-xs text-gray-500 dark:text-stone-400">
                {stats.customersWithDebt}{' '}
                {stats.customersWithDebt === 1 ? t('clients.customer') : t('clients.customers')}
              </p>
            </div>

            {/* Customer Types Breakdown Card */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                  <Sparkles className="w-5 h-5 text-gray-700 dark:text-stone-300" />
                </div>
                <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                  {t('clients.types')}
                </h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-stone-300">{t('clients.individual')}</span>
                  <span className="font-medium text-gray-600 dark:text-stone-400">
                    {stats.individualCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-stone-300">{t('clients.corporate')}</span>
                  <span className="font-medium text-gray-600 dark:text-stone-400">
                    {stats.corporateCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-stone-300">{t('clients.wholesale')}</span>
                  <span className="font-medium text-gray-600 dark:text-stone-400">
                    {stats.wholesaleCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Management Table */}
        <CustomersTab onStatsUpdate={fetchStats} />
      </main>

      {/* Quick Actions Menu - Floating */}
      <QuickActionsMenu />
    </div>
  )
}
