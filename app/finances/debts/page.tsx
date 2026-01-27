'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  AlertCircle,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Search,
  RefreshCw,
  Plus,
  FileText
} from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { QuickActionsMenu } from '@/components/layout/QuickActionsMenu'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { getDateRangeFromFilter, type DateRangeValue } from '@/components/ui/DateRangeFilter'

// Dynamic imports for heavy components to reduce initial bundle size
const DebtsTable = dynamic(
  () => import('@/components/debts/DebtsTable').then(mod => ({ default: mod.default })),
  { ssr: false }
)
const DebtDetailsModal = dynamic(
  () => import('@/components/debts/DebtDetailsModal').then(mod => ({ default: mod.default })),
  { ssr: false }
)
const RecordPaymentModal = dynamic(
  () => import('@/components/debts/RecordPaymentModal').then(mod => ({ default: mod.default })),
  { ssr: false }
)
const CreateDebtModal = dynamic(
  () => import('@/components/debts/CreateDebtModal').then(mod => ({ default: mod.default })),
  { ssr: false }
)

interface Debt {
  id: string
  customerId: string
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    customerType: 'Individual' | 'Corporate' | 'Wholesale'
  }
  saleId: string | null
  sale?: {
    id: string
    date: string
    totalGNF: number
  }
  principalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string | null
  status: 'Outstanding' | 'PartiallyPaid' | 'FullyPaid' | 'Overdue' | 'WrittenOff'
  description: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    paymentDate: string
    receiptNumber: string | null
    receivedByName: string | null
    createdAt: string
  }>
}

interface DebtsSummary {
  totalOutstanding: number
  totalOverdue: number
  customersWithDebt: number
  fullyPaidCount: number
  overdueCount: number
  writtenOffTotal: number
}

export default function DebtsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

  const [loading, setLoading] = useState(true)
  const [debts, setDebts] = useState<Debt[]>([])
  const [summary, setSummary] = useState<DebtsSummary | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('active') // 'all', 'active', 'Outstanding', 'PartiallyPaid', etc.
  const [customerFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [dateRange] = useState<DateRangeValue>('all')
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const isManager = session?.user?.role === 'Manager'

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch debts callback
  const fetchDebts = useCallback(async () => {
    if (!currentRestaurant) return

    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        restaurantId: currentRestaurant.id,
      })

      if (statusFilter && statusFilter !== 'all' && statusFilter !== 'active') {
        params.append('status', statusFilter)
      }

      if (customerFilter) {
        params.append('customerId', customerFilter)
      }

      if (showOverdueOnly) {
        params.append('overdue', 'true')
      }

      const response = await fetch(`/api/debts?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch debts')
      }

      const data = await response.json()
      let fetchedDebts = data.debts || []

      // Apply active filter (Outstanding, PartiallyPaid, Overdue)
      if (statusFilter === 'active') {
        fetchedDebts = fetchedDebts.filter((d: Debt) =>
          ['Outstanding', 'PartiallyPaid', 'Overdue'].includes(d.status)
        )
      }

      // Apply date range filter (by dueDate)
      if (dateRange !== 'all') {
        const { startDate, endDate } = getDateRangeFromFilter(dateRange)
        fetchedDebts = fetchedDebts.filter((d: Debt) => {
          if (!d.dueDate) return false
          const dueDate = new Date(d.dueDate)
          return (!startDate || dueDate >= startDate) && dueDate <= endDate
        })
      }

      setDebts(fetchedDebts)

      // Calculate summary
      calculateSummary(fetchedDebts)
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant, statusFilter, customerFilter, showOverdueOnly, dateRange])

  // Fetch debts when restaurant or filters change
  useEffect(() => {
    if (currentRestaurant && !restaurantLoading) {
      fetchDebts()
    }
  }, [currentRestaurant, restaurantLoading, fetchDebts])

  const calculateSummary = (debts: Debt[]) => {
    const activeDebts = debts.filter(d =>
      ['Outstanding', 'PartiallyPaid', 'Overdue'].includes(d.status)
    )

    const totalOutstanding = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0)
    const totalOverdue = debts
      .filter(d => d.status === 'Overdue')
      .reduce((sum, d) => sum + d.remainingAmount, 0)

    const customersWithDebt = new Set(activeDebts.map(d => d.customerId)).size
    const fullyPaidCount = debts.filter(d => d.status === 'FullyPaid').length
    const overdueCount = debts.filter(d => d.status === 'Overdue').length
    const writtenOffTotal = debts
      .filter(d => d.status === 'WrittenOff')
      .reduce((sum, d) => sum + d.remainingAmount, 0)

    setSummary({
      totalOutstanding,
      totalOverdue,
      customersWithDebt,
      fullyPaidCount,
      overdueCount,
      writtenOffTotal,
    })
  }

  const handleRefresh = () => {
    fetchDebts()
  }

  const handleViewDetails = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsDetailsModalOpen(true)
  }

  const handleRecordPayment = (debt: Debt) => {
    setPaymentDebt(debt)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false)
    setPaymentDebt(null)
    fetchDebts() // Refresh list
  }

  const handleDebtUpdate = () => {
    setIsDetailsModalOpen(false)
    setSelectedDebt(null)
    fetchDebts() // Refresh list
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    fetchDebts() // Refresh list
  }

  // Filter debts by search query
  const filteredDebts = debts.filter(debt => {
    const searchLower = searchQuery.toLowerCase()
    return (
      debt.customer.name.toLowerCase().includes(searchLower) ||
      (debt.customer.phone && debt.customer.phone.includes(searchQuery)) ||
      (debt.description && debt.description.toLowerCase().includes(searchLower)) ||
      (debt.customer.email && debt.customer.email.toLowerCase().includes(searchLower))
    )
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-stone-900">
        <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session || !currentRestaurant) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {t('debts.title')}
            </h1>
            <p className="text-gray-600 dark:text-stone-400 mt-1">
              {t('debts.subtitle')}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Outstanding */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('debts.totalOutstanding')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">
                {formatCurrency(summary.totalOutstanding)}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400">
                <Users className="w-3.5 h-3.5" />
                <span>{summary.customersWithDebt} {t('debts.customers')}</span>
              </div>
            </div>

            {/* Overdue Debts */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('debts.Overdue')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">
                {formatCurrency(summary.totalOverdue)}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{summary.overdueCount} {t('debts.debts')}</span>
              </div>
            </div>

            {/* Fully Paid */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('debts.fullyPaid')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {summary.fullyPaidCount}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400">
                <FileText className="w-3.5 h-3.5" />
                <span>{t('debts.debtsCleared')}</span>
              </div>
            </div>

            {/* Written Off */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                  <TrendingDown className="w-5 h-5 text-gray-600 dark:text-stone-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">
                  {t('debts.writtenOff')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">
                {formatCurrency(summary.writtenOffTotal)}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400">
                <FileText className="w-3.5 h-3.5" />
                <span>{t('debts.badDebt')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Actions Section */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
          {/* Create Debt Button - Manager Only */}
          {isManager && (
            <div className="mb-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t('debts.createDebt')}</span>
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('debts.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 rounded-lg text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 rounded-lg text-gray-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
            >
              <option value="all">{t('debts.allStatuses')}</option>
              <option value="active">{t('debts.active')}</option>
              <option value="Outstanding">{t('debts.Outstanding')}</option>
              <option value="PartiallyPaid">{t('debts.PartiallyPaid')}</option>
              <option value="Overdue">{t('debts.Overdue')}</option>
              <option value="FullyPaid">{t('debts.FullyPaid')}</option>
              <option value="WrittenOff">{t('debts.WrittenOff')}</option>
            </select>

            {/* Overdue Toggle */}
            <label className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-stone-600 transition-all">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                className="w-4 h-4 rounded text-gray-600 focus:ring-gray-500 border-gray-300 dark:border-stone-600"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-stone-100">
                {t('debts.overdueOnly')}
              </span>
            </label>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-lg border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 overflow-hidden">
          <DebtsTable
            debts={filteredDebts}
            onViewDetails={handleViewDetails}
            onRecordPayment={handleRecordPayment}
            isManager={isManager}
            loading={loading}
          />
        </div>
      </main>

      {/* Modals */}
      {selectedDebt && isDetailsModalOpen && (
        <DebtDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedDebt(null)
          }}
          debt={selectedDebt}
          onUpdate={handleDebtUpdate}
          isManager={isManager}
        />
      )}

      {paymentDebt && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setPaymentDebt(null)
          }}
          debt={paymentDebt}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <CreateDebtModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Quick Actions Menu */}
      <QuickActionsMenu />
    </div>
  )
}
