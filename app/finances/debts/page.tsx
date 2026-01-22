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
  const { locale } = useLocale()
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
      <div className="flex items-center justify-center min-h-screen bg-cream-50 dark:bg-plum-900">
        <div className="w-8 h-8 border-4 border-plum-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session || !currentRestaurant) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-plum-50/30 dark:from-plum-950 dark:via-plum-900 dark:to-plum-800">
      <NavigationHeader />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with Bliss Typography */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-12 bg-gradient-to-b from-plum-500 to-plum-600 rounded-full"></div>
            <div>
              <h1 className="bliss-display text-4xl font-bold text-plum-800 dark:text-cream-50 tracking-tight">
                {locale === 'fr' ? 'Gestion des Crédits' : 'Credit Management'}
              </h1>
              <p className="bliss-body text-sm text-plum-600/70 dark:text-cream-400/70 mt-1 tracking-wide uppercase" style={{ letterSpacing: '0.1em' }}>
                {locale === 'fr' ? 'Suivi et recouvrement' : 'Tracking & Collection'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards - Bliss Grid */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Outstanding */}
            <div className="group relative bg-cream-50 dark:bg-plum-800 rounded-2xl p-6 warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl">
                    <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <p className="bliss-body text-xs font-semibold text-amber-600/60 dark:text-amber-400/60 uppercase tracking-wider mb-1">
                      {locale === 'fr' ? 'Total Dû' : 'Total Outstanding'}
                    </p>
                    <p className="bliss-body text-2xl font-bold text-amber-700 dark:text-amber-400 tracking-tight">
                      {formatCurrency(summary.totalOutstanding)}
                    </p>
                  </div>
                </div>
                <div className="bliss-body flex items-center gap-2 text-xs text-plum-600 dark:text-cream-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{summary.customersWithDebt} {locale === 'fr' ? 'clients' : 'customers'}</span>
                </div>
              </div>
            </div>

            {/* Overdue Debts */}
            <div className="group relative bg-cream-50 dark:bg-plum-800 rounded-2xl p-6 warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <p className="bliss-body text-xs font-semibold text-red-600/60 dark:text-red-400/60 uppercase tracking-wider mb-1">
                      {locale === 'fr' ? 'En Retard' : 'Overdue'}
                    </p>
                    <p className="bliss-body text-2xl font-bold text-red-700 dark:text-red-400 tracking-tight">
                      {formatCurrency(summary.totalOverdue)}
                    </p>
                  </div>
                </div>
                <div className="bliss-body flex items-center gap-2 text-xs text-plum-600 dark:text-cream-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{summary.overdueCount} {locale === 'fr' ? 'dettes' : 'debts'}</span>
                </div>
              </div>
            </div>

            {/* Fully Paid */}
            <div className="group relative bg-cream-50 dark:bg-plum-800 rounded-2xl p-6 warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <p className="bliss-body text-xs font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-wider mb-1">
                      {locale === 'fr' ? 'Payé' : 'Fully Paid'}
                    </p>
                    <p className="bliss-body text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                      {summary.fullyPaidCount}
                    </p>
                  </div>
                </div>
                <div className="bliss-body flex items-center gap-2 text-xs text-plum-600 dark:text-cream-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{locale === 'fr' ? 'dettes soldées' : 'debts cleared'}</span>
                </div>
              </div>
            </div>

            {/* Written Off */}
            <div className="group relative bg-cream-50 dark:bg-plum-800 rounded-2xl p-6 warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-plum-500/10 to-transparent rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-plum-50 to-plum-100 dark:from-plum-900/40 dark:to-plum-800/40 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-plum-600 dark:text-plum-400" strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <p className="bliss-body text-xs font-semibold text-plum-600/60 dark:text-plum-400/60 uppercase tracking-wider mb-1">
                      {locale === 'fr' ? 'Irrécouvrable' : 'Written Off'}
                    </p>
                    <p className="bliss-body text-2xl font-bold text-plum-700 dark:text-plum-400 tracking-tight">
                      {formatCurrency(summary.writtenOffTotal)}
                    </p>
                  </div>
                </div>
                <div className="bliss-body flex items-center gap-2 text-xs text-plum-600 dark:text-cream-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{locale === 'fr' ? 'créances perdues' : 'bad debt'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Actions Section */}
        <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl p-6 warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30">
          {/* Create Debt Button - Manager Only */}
          {isManager && (
            <div className="mb-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-lift px-5 py-3 bg-plum-700 hover:bg-plum-800 text-cream-50 rounded-xl transition-all duration-300 hover:shadow-lg shadow-lg shadow-plum-900/20 flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="bliss-body">{locale === 'fr' ? 'Créer une Dette' : 'Create Debt'}</span>
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-plum-400 dark:text-plum-500" />
                <input
                  type="text"
                  placeholder={locale === 'fr' ? 'Rechercher par client, téléphone, email...' : 'Search by customer, phone, email...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bliss-body w-full pl-12 pr-4 py-3 bg-plum-50/50 dark:bg-plum-900/50 border border-plum-200/50 dark:border-plum-700/40 rounded-xl text-plum-900 dark:text-cream-100 placeholder:text-plum-400/60 focus:outline-none focus:ring-2 focus:ring-plum-500/50 focus:border-plum-500 transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bliss-body px-4 py-3 bg-plum-50/50 dark:bg-plum-900/50 border border-plum-200/50 dark:border-plum-700/40 rounded-xl text-plum-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-plum-500/50 focus:border-plum-500 transition-all"
            >
              <option value="all">{locale === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
              <option value="active">{locale === 'fr' ? 'Actifs' : 'Active'}</option>
              <option value="Outstanding">{locale === 'fr' ? 'En cours' : 'Outstanding'}</option>
              <option value="PartiallyPaid">{locale === 'fr' ? 'Partiellement payé' : 'Partially Paid'}</option>
              <option value="Overdue">{locale === 'fr' ? 'En retard' : 'Overdue'}</option>
              <option value="FullyPaid">{locale === 'fr' ? 'Payé' : 'Fully Paid'}</option>
              <option value="WrittenOff">{locale === 'fr' ? 'Irrécouvrable' : 'Written Off'}</option>
            </select>

            {/* Overdue Toggle */}
            <label className="bliss-body flex items-center gap-3 px-4 py-3 bg-plum-50/50 dark:bg-plum-900/50 border border-plum-200/50 dark:border-plum-700/40 rounded-xl cursor-pointer hover:bg-plum-100/50 dark:hover:bg-plum-700/50 transition-all">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                className="w-4 h-4 rounded text-plum-600 focus:ring-plum-500 border-plum-300 dark:border-plum-600"
              />
              <span className="text-sm font-medium text-plum-800 dark:text-cream-100">
                {locale === 'fr' ? 'En retard uniquement' : 'Overdue Only'}
              </span>
            </label>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bliss-body px-4 py-3 bg-plum-700 hover:bg-plum-800 disabled:bg-plum-400 text-cream-50 rounded-xl transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{locale === 'fr' ? 'Actualiser' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg border border-plum-200/30 dark:border-plum-700/30 overflow-hidden">
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
