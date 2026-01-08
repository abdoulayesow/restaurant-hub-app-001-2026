'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Utensils, Calendar, RefreshCw, ChevronDown, CheckCircle2, Search } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'
import { BakingDashboard, AddProductionModal } from '@/components/baking'

type ProductionStatus = 'Planning' | 'Ready' | 'InProgress' | 'Complete'
type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected'

interface ProductionLog {
  id: string
  date: string
  productName: string
  productNameFr?: string | null
  quantity: number
  preparationStatus: ProductionStatus
  status: SubmissionStatus
  estimatedCostGNF?: number | null
  createdByName?: string | null
  createdAt: string
}

export default function BakingProductionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentBakery, loading: bakeryLoading } = useBakery()

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)

  // Production logs
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'week' | 'month'>('today')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | 'all'>('all')
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionStatus | 'all'>('all')

  const isManager = session?.user?.role === 'Manager'

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch production logs
  const fetchProductionLogs = useCallback(async () => {
    if (!currentBakery) return

    setLoadingLogs(true)
    try {
      const today = new Date()
      let dateFrom: string
      const dateTo = today.toISOString().split('T')[0]

      if (selectedDateRange === 'today') {
        dateFrom = dateTo
      } else if (selectedDateRange === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFrom = weekAgo.toISOString().split('T')[0]
      } else {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFrom = monthAgo.toISOString().split('T')[0]
      }

      const response = await fetch(
        `/api/production?bakeryId=${currentBakery.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      if (response.ok) {
        const data = await response.json()
        setProductionLogs(data.productionLogs || [])
      }
    } catch (error) {
      console.error('Error fetching production logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }, [currentBakery, selectedDateRange])

  // Filter production logs client-side
  const filteredLogs = productionLogs.filter((log) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const nameMatch = log.productName.toLowerCase().includes(query)
      const nameFrMatch = log.productNameFr?.toLowerCase().includes(query)
      if (!nameMatch && !nameFrMatch) return false
    }

    // Status filter
    if (statusFilter !== 'all' && log.preparationStatus !== statusFilter) {
      return false
    }

    // Submission filter
    if (submissionFilter !== 'all' && log.status !== submissionFilter) {
      return false
    }

    return true
  })

  useEffect(() => {
    if (currentBakery) {
      fetchProductionLogs()
    }
  }, [currentBakery, fetchProductionLogs])

  // Handle production added
  const handleProductionAdded = () => {
    fetchProductionLogs()
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get status color
  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'Planning':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Ready':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'InProgress':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'Complete':
        return 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: ProductionStatus) => {
    const labels: Record<ProductionStatus, string> = {
      Planning: t('production.statusPlanning') || 'Planning',
      Ready: t('production.statusReady') || 'Ready',
      InProgress: t('production.statusInProgress') || 'In Progress',
      Complete: t('production.statusComplete') || 'Complete',
    }
    return labels[status]
  }

  // Loading state
  if (status === 'loading' || bakeryLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-cream-200 dark:bg-dark-800 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-cream-200 dark:bg-dark-800 rounded-2xl"></div>
              <div className="h-32 bg-cream-200 dark:bg-dark-800 rounded-2xl"></div>
              <div className="h-32 bg-cream-200 dark:bg-dark-800 rounded-2xl"></div>
            </div>
            <div className="h-64 bg-cream-200 dark:bg-dark-800 rounded-2xl"></div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('production.title') || 'Production'}
            </h1>
            <p className="text-terracotta-600/70 dark:text-cream-300/70 mt-1">
              {currentBakery?.name || 'Loading...'}
            </p>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('production.logProduction') || 'Log Production'}
          </button>
        </div>

        {/* Baking Dashboard (Summary Cards + Status Cards) */}
        <BakingDashboard onAddProduction={() => setAddModalOpen(true)} />

        {/* Production History */}
        <div className="mt-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-semibold text-terracotta-900 dark:text-cream-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {t('production.history') || 'Production History'}
              </h2>

              <div className="flex items-center gap-3">
                {/* Date Range Filter */}
                <div className="relative">
                  <select
                    value={selectedDateRange}
                    onChange={(e) =>
                      setSelectedDateRange(e.target.value as 'today' | 'week' | 'month')
                    }
                    className="
                      appearance-none pl-3 pr-8 py-1.5
                      text-sm rounded-lg
                      border border-terracotta-200 dark:border-dark-600
                      bg-cream-50 dark:bg-dark-800
                      text-terracotta-900 dark:text-cream-100
                      focus:ring-2 focus:ring-terracotta-500
                    "
                  >
                    <option value="today">{t('common.today') || 'Today'}</option>
                    <option value="week">{t('common.thisWeek') || 'This Week'}</option>
                    <option value="month">{t('common.thisMonth') || 'This Month'}</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-terracotta-400 pointer-events-none" />
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchProductionLogs}
                  disabled={loadingLogs}
                  className="p-1.5 rounded-lg border border-terracotta-200 dark:border-dark-600 text-terracotta-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terracotta-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="
                    w-full pl-10 pr-4 py-2
                    text-sm rounded-lg
                    border border-terracotta-200 dark:border-dark-600
                    bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    placeholder:text-terracotta-400 dark:placeholder:text-cream-500
                    focus:ring-2 focus:ring-terracotta-500
                  "
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProductionStatus | 'all')}
                  className="
                    appearance-none pl-3 pr-8 py-2
                    text-sm rounded-lg
                    border border-terracotta-200 dark:border-dark-600
                    bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500
                    w-full sm:w-auto
                  "
                >
                  <option value="all">{t('common.all')} Status</option>
                  <option value="Planning">{t('production.statusPlanning')}</option>
                  <option value="Ready">{t('production.statusReady')}</option>
                  <option value="InProgress">{t('production.statusInProgress')}</option>
                  <option value="Complete">{t('production.statusComplete')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-terracotta-400 pointer-events-none" />
              </div>

              {/* Submission Filter */}
              <div className="relative">
                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value as SubmissionStatus | 'all')}
                  className="
                    appearance-none pl-3 pr-8 py-2
                    text-sm rounded-lg
                    border border-terracotta-200 dark:border-dark-600
                    bg-cream-50 dark:bg-dark-800
                    text-terracotta-900 dark:text-cream-100
                    focus:ring-2 focus:ring-terracotta-500
                    w-full sm:w-auto
                  "
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="Pending">{t('common.pending')}</option>
                  <option value="Approved">{t('common.approved')}</option>
                  <option value="Rejected">{t('common.rejected')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-terracotta-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Production List */}
          {loadingLogs && filteredLogs.length === 0 ? (
            <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
              <p className="text-terracotta-600/60 dark:text-cream-300/60">
                {t('common.loading') || 'Loading...'}
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-12 text-center grain-overlay">
              <Utensils className="w-12 h-12 mx-auto mb-4 text-terracotta-300 dark:text-dark-600" />
              <h3
                className="text-lg font-medium text-terracotta-900 dark:text-cream-100 mb-2"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {t('production.noProduction') || 'No Production Logged'}
              </h3>
              <p className="text-terracotta-600/60 dark:text-cream-300/60 mb-6 max-w-md mx-auto">
                {selectedDateRange === 'today'
                  ? t('production.noProductionToday') || 'No production logged today yet.'
                  : t('production.noProductionPeriod') ||
                    'No production logged in this period.'}
              </p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('production.logFirstProduction') || 'Log First Production'}
              </button>
            </div>
          ) : (
            <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow overflow-hidden grain-overlay">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-terracotta-500/10 dark:border-terracotta-400/10">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-terracotta-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.date') || 'Date'}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-terracotta-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.product') || 'Product'}
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-terracotta-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.qty') || 'Qty'}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-terracotta-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.status') || 'Status'}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-terracotta-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.cost') || 'Cost'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terracotta-500/10 dark:divide-terracotta-400/10">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => router.push(`/baking/production/${log.id}`)}
                        className="hover:bg-cream-50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-terracotta-400" />
                            <span className="text-sm text-terracotta-900 dark:text-cream-100">
                              {formatDate(log.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                            {locale === 'fr' && log.productNameFr
                              ? log.productNameFr
                              : log.productName}
                          </p>
                          {log.createdByName && (
                            <p className="text-xs text-terracotta-500 dark:text-cream-400">
                              {log.createdByName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-terracotta-900 dark:text-cream-100">
                            {log.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`
                              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${getStatusColor(log.preparationStatus)}
                            `}
                          >
                            {log.preparationStatus === 'Complete' && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {getStatusLabel(log.preparationStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-terracotta-900 dark:text-cream-100">
                            {log.estimatedCostGNF
                              ? `${formatCurrency(log.estimatedCostGNF)} GNF`
                              : '--'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Production Modal */}
      <AddProductionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleProductionAdded}
      />
    </div>
  )
}
