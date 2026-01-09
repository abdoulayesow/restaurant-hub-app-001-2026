'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, TrendingUp, RefreshCw, Calendar, Filter, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { SalesTable } from '@/components/sales/SalesTable'
import { AddEditSaleModal } from '@/components/sales/AddEditSaleModal'
import { SalesTrendChart } from '@/components/sales/SalesTrendChart'
import { PaymentMethodChart } from '@/components/sales/PaymentMethodChart'
import { DateRangeFilter, getDateRangeFromFilter, type DateRangeValue } from '@/components/ui/DateRangeFilter'

interface Sale {
  id: string
  date: string
  totalGNF: number
  cashGNF: number
  orangeMoneyGNF: number
  cardGNF: number
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedByName?: string | null
  approvedByName?: string | null
  itemsCount?: number | null
  customersCount?: number | null
  openingTime?: string | null
  closingTime?: string | null
  comments?: string | null
}

interface SalesSummary {
  totalSales: number
  totalRevenue: number
  pendingCount: number
  approvedCount: number
  totalCash: number
  totalOrangeMoney: number
  totalCard: number
  previousPeriodRevenue: number
  revenueChangePercent: number
}

interface SalesTrendDataPoint {
  date: string
  amount: number
}

export default function FinancesSalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [salesByDay, setSalesByDay] = useState<SalesTrendDataPoint[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue>('30days')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isManager = session?.user?.role === 'Manager'

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch sales
  const fetchSales = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeFromFilter(dateRange)

      const params = new URLSearchParams({
        restaurantId: currentRestaurant.id,
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { startDate: startDate.toISOString() }),
        endDate: endDate.toISOString(),
      })

      const res = await fetch(`/api/sales?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data.sales || [])
        setSummary(data.summary || null)
        setSalesByDay(data.salesByDay || [])
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant?.id, statusFilter, dateRange])

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchSales()
    }
  }, [currentRestaurant?.id, fetchSales])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Handle add/edit sale
  const handleSaveSale = async (saleData: Partial<Sale>) => {
    if (!currentRestaurant?.id) return

    setIsSaving(true)
    try {
      const isEdit = !!saleData.id
      const url = isEdit ? `/api/sales/${saleData.id}` : '/api/sales'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...saleData,
          restaurantId: currentRestaurant.id,
        }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setSelectedSale(null)
        fetchSales()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save sale')
      }
    } catch (error) {
      console.error('Error saving sale:', error)
      alert('Failed to save sale')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle approve/reject
  const handleApprove = async (sale: Sale) => {
    if (!confirm(t('sales.confirmApprove') || 'Are you sure you want to approve this sale?')) return

    try {
      const res = await fetch(`/api/sales/${sale.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (res.ok) {
        fetchSales()
      }
    } catch (error) {
      console.error('Error approving sale:', error)
    }
  }

  const handleReject = async (sale: Sale) => {
    const reason = prompt(t('sales.rejectReason') || 'Please provide a reason for rejection:')
    if (reason === null) return // User cancelled

    try {
      const res = await fetch(`/api/sales/${sale.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })

      if (res.ok) {
        fetchSales()
      }
    } catch (error) {
      console.error('Error rejecting sale:', error)
    }
  }

  // Handle view/edit
  const handleView = (sale: Sale) => {
    setSelectedSale(sale)
    setIsModalOpen(true)
  }

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale)
    setIsModalOpen(true)
  }

  // Get today's sales from summary
  const todaysSales = sales.filter(s => {
    const saleDate = new Date(s.date).toDateString()
    const today = new Date().toDateString()
    return saleDate === today
  })

  const todaysTotal = todaysSales.reduce((sum, s) => sum + s.totalGNF, 0)

  // Loading state
  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-cream-200 dark:bg-dark-800 rounded w-1/4"></div>
            <div className="h-64 bg-cream-200 dark:bg-dark-800 rounded"></div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('sales.title') || 'Sales'}
            </h1>
            <p className="text-terracotta-600/70 dark:text-cream-300/70 mt-1">
              {currentRestaurant?.name || 'Loading...'}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedSale(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('sales.addSale') || 'Add Sale'}
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* Today's Sales */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-green-500/10 dark:bg-green-400/10">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('sales.todaysSales') || "Today's Sales"}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(todaysTotal)}
            </p>
            <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
              {todaysSales.length > 0
                ? `${todaysSales.length} ${t('sales.recordsToday') || 'records today'}`
                : (t('sales.noSalesYet') || 'No sales recorded yet')
              }
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
                <Calendar className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('sales.totalRevenue') || 'Total Revenue'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(summary?.totalRevenue || 0)}
            </p>
            {summary && dateRange !== 'all' && summary.revenueChangePercent !== 0 ? (
              <p className={`text-xs flex items-center gap-1 ${
                summary.revenueChangePercent > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {summary.revenueChangePercent > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(summary.revenueChangePercent)}% {t('sales.vsLastPeriod') || 'vs last period'}
              </p>
            ) : (
              <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
                {summary?.totalSales || 0} {t('sales.salesRecorded') || 'sales recorded'}
              </p>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10">
                <Filter className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('sales.pendingApprovals') || 'Pending Approvals'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
              {summary?.pendingCount || 0}
            </p>
            <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
              {t('sales.awaitingReview') || 'awaiting review'}
            </p>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('sales.paymentBreakdown') || 'Payment Methods'}
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-terracotta-700 dark:text-cream-200">{t('sales.cash') || 'Cash'}</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {summary && summary.totalRevenue > 0
                    ? `${Math.round((summary.totalCash / summary.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-terracotta-700 dark:text-cream-200">{t('sales.orangeMoney') || 'Orange'}</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {summary && summary.totalRevenue > 0
                    ? `${Math.round((summary.totalOrangeMoney / summary.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-terracotta-700 dark:text-cream-200">{t('sales.card') || 'Card'}</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {summary && summary.totalRevenue > 0
                    ? `${Math.round((summary.totalCard / summary.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend Chart */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('sales.salesTrend') || 'Sales Trend'}
            </h3>
            <SalesTrendChart data={salesByDay} />
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('sales.paymentMethods') || 'Payment Methods'}
            </h3>
            <PaymentMethodChart
              cash={summary?.totalCash || 0}
              orangeMoney={summary?.totalOrangeMoney || 0}
              card={summary?.totalCard || 0}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-terracotta-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('sales.searchPlaceholder') || 'Search sales...'}
              className="w-full pl-10 pr-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
          >
            <option value="">{t('sales.allSales') || 'All Sales'}</option>
            <option value="Pending">{t('common.pending') || 'Pending'}</option>
            <option value="Approved">{t('common.approved') || 'Approved'}</option>
            <option value="Rejected">{t('common.rejected') || 'Rejected'}</option>
          </select>

          <button
            onClick={fetchSales}
            className="p-2 rounded-xl border border-terracotta-200 dark:border-dark-600 text-terracotta-700 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-700"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Sales Table or Empty State */}
        {sales.length > 0 ? (
          <SalesTable
            sales={sales}
            onView={handleView}
            onEdit={handleEdit}
            onApprove={isManager ? handleApprove : undefined}
            onReject={isManager ? handleReject : undefined}
            isManager={isManager}
            loading={loading}
          />
        ) : (
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-12 text-center grain-overlay">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-terracotta-300 dark:text-dark-600" />
            <h3
              className="text-lg font-medium text-terracotta-900 dark:text-cream-100 mb-2"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('sales.noSales') || 'No Sales Recorded'}
            </h3>
            <p className="text-terracotta-600/60 dark:text-cream-300/60 mb-6 max-w-md mx-auto">
              {t('sales.noSalesDescription') || 'Record your first daily sale to start tracking revenue and payment methods.'}
            </p>
            <button
              onClick={() => {
                setSelectedSale(null)
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('sales.addFirstSale') || 'Add First Sale'}
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Sale Modal */}
      <AddEditSaleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedSale(null)
        }}
        onSave={handleSaveSale}
        sale={selectedSale}
        loading={isSaving}
      />
    </div>
  )
}
