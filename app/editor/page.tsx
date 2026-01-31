'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  Receipt,
  Package,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  ChefHat,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canRecordSales, canRecordExpenses, canRecordProduction } from '@/lib/roles'
import { AddEditSaleModal } from '@/components/sales/AddEditSaleModal'
import { AddEditExpenseModal } from '@/components/expenses/AddEditExpenseModal'
import { AddProductionModal } from '@/components/baking/AddProductionModal'
import { formatDateForDisplay } from '@/lib/date-utils'

// Types for recent submissions
interface RecentSubmission {
  id: string
  type: 'sale' | 'expense' | 'production'
  date: string
  amount?: number
  description?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
}

interface Category {
  id: string
  name: string
  nameFr?: string | null
  color?: string | null
  expenseGroup?: {
    key: string
    label: string
    labelFr?: string | null
  } | null
}

interface Supplier {
  id: string
  name: string
  phone?: string | null
}

interface InventoryItem {
  id: string
  name: string
  nameFr?: string | null
  unit: string
  unitCostGNF: number
}

export default function EditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  // Modal states
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [productionModalOpen, setProductionModalOpen] = useState(false)

  // Data states
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [existingSaleDates, setExistingSaleDates] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // Sale modal state
  const [savingSale, setSavingSale] = useState(false)
  const [saleError, setSaleError] = useState<string | null>(null)

  // Expense modal state
  const [savingExpense, setSavingExpense] = useState(false)

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }, [locale])

  // Fetch recent submissions
  const fetchRecentSubmissions = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoadingSubmissions(true)
    try {
      // Fetch sales, expenses, and production in parallel
      const [salesRes, expensesRes, productionRes] = await Promise.all([
        fetch(`/api/sales?restaurantId=${currentRestaurant.id}&limit=5`),
        fetch(`/api/expenses?restaurantId=${currentRestaurant.id}&limit=5`),
        fetch(`/api/production?restaurantId=${currentRestaurant.id}&limit=5`),
      ])

      const submissions: RecentSubmission[] = []

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        const sales = salesData.sales || []
        // Store existing sale dates for duplicate prevention
        setExistingSaleDates(sales.map((s: { date: string }) => s.date.split('T')[0]))

        sales.slice(0, 5).forEach((sale: { id: string; date: string; totalGNF: number; status: string; createdAt: string }) => {
          submissions.push({
            id: sale.id,
            type: 'sale',
            date: sale.date,
            amount: sale.totalGNF,
            status: sale.status as 'Pending' | 'Approved' | 'Rejected',
            createdAt: sale.createdAt,
          })
        })
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        const expenses = expensesData.expenses || []
        expenses.slice(0, 5).forEach((expense: { id: string; date: string; amountGNF: number; categoryName: string; status: string; createdAt: string }) => {
          submissions.push({
            id: expense.id,
            type: 'expense',
            date: expense.date,
            amount: expense.amountGNF,
            description: expense.categoryName,
            status: expense.status as 'Pending' | 'Approved' | 'Rejected',
            createdAt: expense.createdAt,
          })
        })
      }

      if (productionRes.ok) {
        const productionData = await productionRes.json()
        const logs = productionData.logs || []
        logs.slice(0, 5).forEach((log: { id: string; date: string; status: string; createdAt: string; items?: Array<{ quantity: number }> }) => {
          const totalItems = log.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0
          submissions.push({
            id: log.id,
            type: 'production',
            date: log.date,
            description: `${totalItems} ${t('production.itemsProduced') || 'items'}`,
            status: log.status as 'Pending' | 'Approved' | 'Rejected',
            createdAt: log.createdAt,
          })
        })
      }

      // Sort by createdAt descending and take top 10
      submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecentSubmissions(submissions.slice(0, 10))
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }, [currentRestaurant?.id, t])

  // Fetch categories and suppliers for expense modal
  const fetchExpenseData = useCallback(async () => {
    if (!currentRestaurant?.id) return

    try {
      const [categoriesRes, suppliersRes, inventoryRes] = await Promise.all([
        fetch(`/api/expense-categories?restaurantId=${currentRestaurant.id}`),
        fetch(`/api/suppliers?restaurantId=${currentRestaurant.id}`),
        fetch(`/api/inventory?restaurantId=${currentRestaurant.id}`),
      ])

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
      if (suppliersRes.ok) {
        const data = await suppliersRes.json()
        setSuppliers(data.suppliers || [])
      }
      if (inventoryRes.ok) {
        const data = await inventoryRes.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching expense data:', error)
    }
  }, [currentRestaurant?.id])

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch data on mount
  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchRecentSubmissions()
      fetchExpenseData()
    }
  }, [currentRestaurant?.id, fetchRecentSubmissions, fetchExpenseData])

  // Handle sale save
  const handleSaleSave = async (saleData: Record<string, unknown>) => {
    if (!currentRestaurant?.id) return

    setSavingSale(true)
    setSaleError(null)

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...saleData,
          restaurantId: currentRestaurant.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save sale')
      }

      setSaleModalOpen(false)
      fetchRecentSubmissions()
    } catch (error) {
      setSaleError(error instanceof Error ? error.message : 'Failed to save sale')
    } finally {
      setSavingSale(false)
    }
  }

  // Handle expense save
  const handleExpenseSave = async (expenseData: Record<string, unknown>) => {
    if (!currentRestaurant?.id) return

    setSavingExpense(true)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseData,
          restaurantId: currentRestaurant.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save expense')
      }

      setExpenseModalOpen(false)
      fetchRecentSubmissions()
    } catch (error) {
      console.error('Error saving expense:', error)
    } finally {
      setSavingExpense(false)
    }
  }

  // Handle production success
  const handleProductionSuccess = () => {
    fetchRecentSubmissions()
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-amber-500" />
    }
  }

  // Get type icon and color
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'sale':
        return { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
      case 'expense':
        return { icon: Receipt, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
      case 'production':
        return { icon: ChefHat, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' }
      default:
        return { icon: Package, color: 'text-stone-600', bg: 'bg-stone-100' }
    }
  }

  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
            {t('editor.title')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {t('editor.welcomeMessage')}
          </p>
          {currentRestaurant && (
            <p className="text-sm text-gold-600 dark:text-gold-400 mt-2">
              {currentRestaurant.name}
              {currentRestaurant.location && ` - ${currentRestaurant.location}`}
            </p>
          )}
        </div>

        {/* Quick Actions - Now opens modals */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">
            {t('editor.quickActions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Submit Sale */}
            {canRecordSales(currentRole) && (
              <button
                onClick={() => setSaleModalOpen(true)}
                className="group relative overflow-hidden bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <Plus className="w-5 h-5 text-stone-400 group-hover:text-emerald-500 group-hover:rotate-90 transition-all duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                    {t('editor.submitSale')}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {t('sales.recordDailySales') || 'Record daily sales'}
                  </p>
                </div>
              </button>
            )}

            {/* Submit Expense */}
            {canRecordExpenses(currentRole) && (
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="group relative overflow-hidden bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 hover:border-red-500 dark:hover:border-red-500 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <Plus className="w-5 h-5 text-stone-400 group-hover:text-red-500 group-hover:rotate-90 transition-all duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                    {t('editor.submitExpense')}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {t('expenses.recordExpense') || 'Record an expense'}
                  </p>
                </div>
              </button>
            )}

            {/* Log Production */}
            {canRecordProduction(currentRole) && (
              <button
                onClick={() => setProductionModalOpen(true)}
                className="group relative overflow-hidden bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <ChefHat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Plus className="w-5 h-5 text-stone-400 group-hover:text-blue-500 group-hover:rotate-90 transition-all duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                    {t('editor.logProduction')}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {t('production.logDailyProduction') || 'Log daily production'}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Recent Submissions & How It Works */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions - Now shows real data */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                {t('editor.recentSubmissions')}
              </h3>
              <button
                onClick={fetchRecentSubmissions}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                title={t('common.refresh') || 'Refresh'}
              >
                <RefreshCw className={`w-4 h-4 text-stone-500 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{t('editor.noSubmissions') || 'No submissions yet'}</p>
                <p className="text-sm mt-1">{t('editor.startByAdding') || 'Start by adding a sale, expense, or production log'}</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-700/50">
                {recentSubmissions.map((submission) => {
                  const typeInfo = getTypeInfo(submission.type)
                  const TypeIcon = typeInfo.icon

                  return (
                    <div
                      key={`${submission.type}-${submission.id}`}
                      className="px-6 py-4 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${typeInfo.bg}`}>
                          <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-900 dark:text-white capitalize">
                              {t(`common.${submission.type}`) || submission.type}
                            </span>
                            {getStatusIcon(submission.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateForDisplay(submission.date, locale)}</span>
                            {submission.description && (
                              <>
                                <span className="text-stone-300 dark:text-stone-600">•</span>
                                <span className="truncate">{submission.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {submission.amount !== undefined && (
                          <div className="text-right">
                            <span className={`font-semibold ${submission.type === 'sale' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-white'}`}>
                              {formatCurrency(submission.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-gold-500" />
              {t('editor.howItWorks')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {t('editor.step1')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {t('editor.step2')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {t('editor.step3')}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                {t('editor.statusLegend') || 'Status Legend'}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-stone-600 dark:text-stone-400">{t('common.pending')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-stone-600 dark:text-stone-400">{t('common.approved')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-stone-600 dark:text-stone-400">{t('common.rejected')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddEditSaleModal
        isOpen={saleModalOpen}
        onClose={() => {
          setSaleModalOpen(false)
          setSaleError(null)
        }}
        onSave={handleSaleSave}
        loading={savingSale}
        error={saleError}
        existingDates={existingSaleDates}
      />

      <AddEditExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleExpenseSave}
        categories={categories}
        suppliers={suppliers}
        inventoryItems={inventoryItems}
        loading={savingExpense}
      />

      <AddProductionModal
        isOpen={productionModalOpen}
        onClose={() => setProductionModalOpen(false)}
        onSuccess={handleProductionSuccess}
      />
    </div>
  )
}
