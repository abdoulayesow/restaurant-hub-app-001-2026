'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Plus, Search, TrendingUp, RefreshCw, Calendar, Filter, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { QuickActionsMenu } from '@/components/layout/QuickActionsMenu'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canApprove } from '@/lib/roles'
import { SalesTable } from '@/components/sales/SalesTable'
import { DateRangeFilter, getDateRangeFromFilter, type DateRangeValue } from '@/components/ui/DateRangeFilter'

// Dynamic imports for heavy components to reduce initial bundle size
const AddEditSaleModal = dynamic(
  () => import('@/components/sales/AddEditSaleModal').then(mod => ({ default: mod.AddEditSaleModal })),
  { ssr: false }
)
const ConfirmDepositModal = dynamic(
  () => import('@/components/sales/ConfirmDepositModal').then(mod => ({ default: mod.ConfirmDepositModal })),
  { ssr: false }
)
const SalesTrendChart = dynamic(
  () => import('@/components/sales/SalesTrendChart').then(mod => ({ default: mod.SalesTrendChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-gray-200 dark:bg-stone-700 rounded-xl"></div> }
)
const PaymentMethodChart = dynamic(
  () => import('@/components/sales/PaymentMethodChart').then(mod => ({ default: mod.PaymentMethodChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-gray-200 dark:bg-stone-700 rounded-xl"></div> }
)

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
  activeDebtsCount?: number
  outstandingDebtAmount?: number
  bankTransactions?: Array<{
    id: string
    status: 'Pending' | 'Confirmed'
    confirmedAt?: string | null
    method: 'Cash' | 'OrangeMoney' | 'Card'
  }>
  debts?: Array<{
    customerId: string
    amountGNF: number
    dueDate: string
    description: string
  }>
  saleItems?: Array<{
    id?: string
    productId: string | null
    product?: {
      id: string
      name: string
      nameFr: string | null
      category: 'Patisserie' | 'Boulangerie'
      unit: string
    } | null
    productName?: string | null
    productNameFr?: string | null
    quantity: number
    unitPrice?: number | null
  }>
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
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [salesByDay, setSalesByDay] = useState<SalesTrendDataPoint[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue>('30days')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [saleForDeposit, setSaleForDeposit] = useState<Sale | null>(null)
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false)

  // Permission check for approval actions (Owner or legacy Manager)
  const canApproveItems = canApprove(currentRole)

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
    setSaveError(null)
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
        setSaveError(null)
        fetchSales()
      } else {
        const errorData = await res.json()
        // Handle specific error codes with translations
        if (errorData.code === 'SALE_DUPLICATE_DATE') {
          setSaveError(t('errors.saleDuplicateDate') || errorData.error)
        } else {
          setSaveError(errorData.error || t('errors.failedToSave') || 'Failed to save sale')
        }
      }
    } catch (error) {
      console.error('Error saving sale:', error)
      setSaveError(t('errors.failedToSave') || 'Failed to save sale')
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

  const handleDelete = async (sale: Sale) => {
    const message = sale.status === 'Approved'
      ? t('sales.confirmDeleteApproved') || 'This is an approved sale. Are you sure you want to delete it? This will mark it as deleted but preserve all related records (debts, transactions).'
      : t('sales.confirmDelete') || 'Are you sure you want to delete this sale?'

    if (!confirm(message)) return

    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchSales()
      } else {
        const errorData = await res.json()
        alert(errorData.error || t('errors.failedToDelete') || 'Failed to delete sale')
      }
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert(t('errors.failedToDelete') || 'Failed to delete sale')
    }
  }

  // Handle view/edit
  const handleView = (sale: Sale) => {
    setSelectedSale(sale)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  // Handle confirm deposit - opens modal to capture bank ref and comments
  const handleConfirmDeposit = (sale: Sale) => {
    if (!currentRestaurant?.id) return

    // Only allow if sale has cash amount
    if (sale.cashGNF <= 0) {
      alert(t('sales.noCashToDeposit') || 'This sale has no cash to deposit.')
      return
    }

    setSaleForDeposit(sale)
    setIsDepositModalOpen(true)
  }

  // Submit deposit from modal
  const handleSubmitDeposit = async (data: {
    bankRef: string
    comments?: string
    receiptUrl?: string
  }) => {
    if (!currentRestaurant?.id || !saleForDeposit) return

    setIsConfirmingDeposit(true)
    try {
      const res = await fetch('/api/cash-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          saleId: saleForDeposit.id,
          date: saleForDeposit.date,
          amount: saleForDeposit.cashGNF,
          bankRef: data.bankRef,
          comments: data.comments,
          receiptUrl: data.receiptUrl,
        }),
      })

      if (res.ok) {
        setIsDepositModalOpen(false)
        setSaleForDeposit(null)
        fetchSales()
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || t('errors.failedToSave') || 'Failed to confirm deposit')
      }
    } catch (error) {
      console.error('Error confirming deposit:', error)
      throw error
    } finally {
      setIsConfirmingDeposit(false)
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {t('sales.title') || 'Sales'}
            </h1>
            <p className="text-gray-600 dark:text-stone-400 mt-1">
              {currentRestaurant?.name || 'Loading...'}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedSale(null)
              setSaveError(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
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
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('sales.todaysSales') || "Today's Sales"}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(todaysTotal)}
            </p>
            <p className="text-xs text-gray-500 dark:text-stone-400">
              {todaysSales.length > 0
                ? `${todaysSales.length} ${t('sales.recordsToday') || 'records today'}`
                : (t('sales.noSalesYet') || 'No sales recorded yet')
              }
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                <Calendar className="w-5 h-5 text-gray-700 dark:text-stone-300" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('sales.totalRevenue') || 'Total Revenue'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(summary?.totalRevenue || 0)}
            </p>
            {summary && dateRange !== 'all' && summary.revenueChangePercent !== 0 ? (
              <p className={`text-xs flex items-center gap-1 ${
                summary.revenueChangePercent > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {summary.revenueChangePercent > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(summary.revenueChangePercent)}% {t('sales.vsLastPeriod') || 'vs last period'}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-stone-400">
                {summary?.totalSales || 0} {t('sales.salesRecorded') || 'sales recorded'}
              </p>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <Filter className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('sales.pendingApprovals') || 'Pending Approvals'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
              {summary?.pendingCount || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-stone-400">
              {t('sales.awaitingReview') || 'awaiting review'}
            </p>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                <Wallet className="w-5 h-5 text-gray-700 dark:text-stone-300" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('sales.paymentBreakdown') || 'Payment Methods'}
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-stone-300">{t('sales.cash') || 'Cash'}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {summary && summary.totalRevenue > 0
                    ? `${Math.round((summary.totalCash / summary.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-stone-300">{t('sales.orangeMoney') || 'Orange'}</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {summary && summary.totalRevenue > 0
                    ? `${Math.round((summary.totalOrangeMoney / summary.totalRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-stone-300">{t('sales.card') || 'Card'}</span>
                <span className="font-medium text-gray-600 dark:text-stone-400">
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
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
              {t('sales.salesTrend') || 'Sales Trend'}
            </h3>
            <SalesTrendChart data={salesByDay} />
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('sales.searchPlaceholder') || 'Search sales...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
          >
            <option value="">{t('sales.allSales') || 'All Sales'}</option>
            <option value="Pending">{t('common.pending') || 'Pending'}</option>
            <option value="Approved">{t('common.approved') || 'Approved'}</option>
            <option value="Rejected">{t('common.rejected') || 'Rejected'}</option>
          </select>

          <button
            onClick={fetchSales}
            className="p-2.5 rounded-lg border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
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
            onApprove={canApproveItems ? handleApprove : undefined}
            onReject={canApproveItems ? handleReject : undefined}
            onConfirmDeposit={canApproveItems ? handleConfirmDeposit : undefined}
            onDelete={canApproveItems ? handleDelete : undefined}
            isManager={canApproveItems}
            loading={loading}
          />
        ) : (
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-stone-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-stone-100 mb-2">
              {t('sales.noSales') || 'No Sales Recorded'}
            </h3>
            <p className="text-gray-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
              {t('sales.noSalesDescription') || 'Record your first daily sale to start tracking revenue and payment methods.'}
            </p>
            <button
              onClick={() => {
                setSelectedSale(null)
                setSaveError(null)
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
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
          setSaveError(null)
        }}
        onSave={handleSaveSale}
        sale={selectedSale}
        mode={modalMode}
        loading={isSaving}
        error={saveError}
        existingDates={sales.map(s => s.date)}
      />

      {/* Confirm Deposit Modal */}
      <ConfirmDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false)
          setSaleForDeposit(null)
        }}
        onSubmit={handleSubmitDeposit}
        sale={saleForDeposit}
        isLoading={isConfirmingDeposit}
      />

      {/* Quick Actions Menu - Floating */}
      <QuickActionsMenu />
    </div>
  )
}
