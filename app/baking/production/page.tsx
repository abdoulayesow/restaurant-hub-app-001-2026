'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Utensils, Calendar, RefreshCw, ChevronDown, CheckCircle2, Search } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
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
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

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

  // Role-based UI control is handled in child components

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch production logs
  const fetchProductionLogs = useCallback(async () => {
    if (!currentRestaurant) return

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
        `/api/production?restaurantId=${currentRestaurant.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`
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
  }, [currentRestaurant, selectedDateRange])

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
    if (currentRestaurant) {
      fetchProductionLogs()
    }
  }, [currentRestaurant, fetchProductionLogs])

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

  // Get status color - Bliss design system
  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'Planning':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Ready':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'InProgress':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'Complete':
        return 'bg-plum-100 text-plum-700 dark:bg-plum-900/30 dark:text-plum-400'
      default:
        return 'bg-plum-50 text-plum-600 dark:bg-plum-900/30 dark:text-plum-400'
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
  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-plum-200 dark:bg-plum-800 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-plum-200 dark:bg-plum-800 rounded-2xl"></div>
              <div className="h-32 bg-plum-200 dark:bg-plum-800 rounded-2xl"></div>
              <div className="h-32 bg-plum-200 dark:bg-plum-800 rounded-2xl"></div>
            </div>
            <div className="h-64 bg-plum-200 dark:bg-plum-800 rounded-2xl"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="bliss-display text-3xl font-bold text-plum-800 dark:text-cream-100">
              {t('production.title') || 'Production'}
            </h1>
            <p className="bliss-body text-plum-600/70 dark:text-cream-300/70 mt-1">
              {currentRestaurant?.name || 'Loading...'}
            </p>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 bg-plum-700 text-cream-50 rounded-xl hover:bg-plum-800 shadow-lg shadow-plum-900/20 font-medium transition-all"
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
              <h2 className="bliss-elegant text-lg font-semibold text-plum-800 dark:text-cream-100">
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
                      bliss-body appearance-none pl-3 pr-8 py-1.5
                      text-sm rounded-xl
                      border border-plum-200 dark:border-plum-700
                      bg-cream-50 dark:bg-plum-950
                      text-plum-900 dark:text-cream-100
                      focus:ring-2 focus:ring-plum-500 focus:border-plum-500
                      transition-colors
                    "
                  >
                    <option value="today">{t('common.today') || 'Today'}</option>
                    <option value="week">{t('common.thisWeek') || 'This Week'}</option>
                    <option value="month">{t('common.thisMonth') || 'This Month'}</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-plum-400 pointer-events-none" />
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchProductionLogs}
                  disabled={loadingLogs}
                  className="p-2 rounded-xl border border-plum-200 dark:border-plum-700 text-plum-600 dark:text-cream-300 hover:bg-plum-100 dark:hover:bg-plum-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-plum-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="
                    bliss-body w-full pl-10 pr-4 py-2.5
                    text-sm rounded-xl
                    border border-plum-200 dark:border-plum-700
                    bg-cream-50 dark:bg-plum-950
                    text-plum-900 dark:text-cream-100
                    placeholder:text-plum-400 dark:placeholder:text-plum-500
                    focus:ring-2 focus:ring-plum-500 focus:border-plum-500
                    transition-colors
                  "
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProductionStatus | 'all')}
                  className="
                    bliss-body appearance-none pl-3 pr-8 py-2.5
                    text-sm rounded-xl
                    border border-plum-200 dark:border-plum-700
                    bg-cream-50 dark:bg-plum-950
                    text-plum-900 dark:text-cream-100
                    focus:ring-2 focus:ring-plum-500 focus:border-plum-500
                    w-full sm:w-auto transition-colors
                  "
                >
                  <option value="all">{t('common.all')} Status</option>
                  <option value="Planning">{t('production.statusPlanning')}</option>
                  <option value="Ready">{t('production.statusReady')}</option>
                  <option value="InProgress">{t('production.statusInProgress')}</option>
                  <option value="Complete">{t('production.statusComplete')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-plum-400 pointer-events-none" />
              </div>

              {/* Submission Filter */}
              <div className="relative">
                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value as SubmissionStatus | 'all')}
                  className="
                    bliss-body appearance-none pl-3 pr-8 py-2.5
                    text-sm rounded-xl
                    border border-plum-200 dark:border-plum-700
                    bg-cream-50 dark:bg-plum-950
                    text-plum-900 dark:text-cream-100
                    focus:ring-2 focus:ring-plum-500 focus:border-plum-500
                    w-full sm:w-auto transition-colors
                  "
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="Pending">{t('common.pending')}</option>
                  <option value="Approved">{t('common.approved')}</option>
                  <option value="Rejected">{t('common.rejected')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-plum-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Production List */}
          {loadingLogs && filteredLogs.length === 0 ? (
            <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-8 text-center border border-plum-200/30 dark:border-plum-700/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plum-500 mx-auto mb-4"></div>
              <p className="bliss-body text-plum-600/60 dark:text-cream-300/60">
                {t('common.loading') || 'Loading...'}
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg p-12 text-center grain-overlay diagonal-stripes-bliss border border-plum-200/30 dark:border-plum-700/30 ornate-corners">
              <Utensils className="w-12 h-12 mx-auto mb-4 text-plum-300 dark:text-plum-600" />
              <h3 className="bliss-elegant text-lg font-medium text-plum-800 dark:text-cream-100 mb-2">
                {t('production.noProduction') || 'No Production Logged'}
              </h3>
              <p className="bliss-body text-plum-600/60 dark:text-cream-300/60 mb-6 max-w-md mx-auto">
                {selectedDateRange === 'today'
                  ? t('production.noProductionToday') || 'No production logged today yet.'
                  : t('production.noProductionPeriod') ||
                    'No production logged in this period.'}
              </p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 bg-plum-700 text-cream-50 rounded-xl hover:bg-plum-800 shadow-lg shadow-plum-900/20 font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                {t('production.logFirstProduction') || 'Log First Production'}
              </button>
            </div>
          ) : (
            <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg overflow-hidden grain-overlay border border-plum-200/30 dark:border-plum-700/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-plum-500/10 dark:border-plum-400/10 bg-plum-50/50 dark:bg-plum-900/50">
                      <th className="bliss-body text-left px-4 py-3 text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.date') || 'Date'}
                      </th>
                      <th className="bliss-body text-left px-4 py-3 text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.product') || 'Product'}
                      </th>
                      <th className="bliss-body text-center px-4 py-3 text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.qty') || 'Qty'}
                      </th>
                      <th className="bliss-body text-left px-4 py-3 text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.status') || 'Status'}
                      </th>
                      <th className="bliss-body text-right px-4 py-3 text-xs font-semibold text-plum-600 dark:text-cream-300 uppercase tracking-wider">
                        {t('production.cost') || 'Cost'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum-500/10 dark:divide-plum-400/10">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => router.push(`/baking/production/${log.id}`)}
                        className="hover:bg-plum-50/60 dark:hover:bg-plum-700/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-plum-400" />
                            <span className="bliss-body text-sm text-plum-900 dark:text-cream-100">
                              {formatDate(log.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100">
                            {locale === 'fr' && log.productNameFr
                              ? log.productNameFr
                              : log.productName}
                          </p>
                          {log.createdByName && (
                            <p className="bliss-body text-xs text-plum-500 dark:text-cream-400">
                              {log.createdByName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bliss-body text-sm font-medium text-plum-800 dark:text-cream-100">
                            {log.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`
                              bliss-body inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
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
                          <span className="bliss-body text-sm text-plum-800 dark:text-cream-100">
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
