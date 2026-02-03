'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  Receipt,
  Plus,
  Info,
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { EditorHeader } from '@/components/layout/EditorHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canRecordSales, canRecordExpenses, canRecordProduction } from '@/lib/roles'
import { AddEditSaleModal } from '@/components/sales/AddEditSaleModal'
import { AddEditExpenseModal } from '@/components/expenses/AddEditExpenseModal'
import { AddProductionModal } from '@/components/baking/AddProductionModal'
import { SubmissionsTable } from '@/components/editor/SubmissionsTable'

// Types for recent submissions
interface RecentSubmission {
  id: string
  type: 'sale' | 'expense' | 'production'
  date: string
  amount?: number
  description?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  submittedByName?: string
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
  const { t } = useLocale()
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

  // Fetch recent submissions (filtered by role)
  const fetchRecentSubmissions = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoadingSubmissions(true)
    try {
      const submissions: RecentSubmission[] = []

      // Determine which data to fetch based on role permissions
      const shouldFetchSales = canRecordSales(currentRole)
      const shouldFetchExpenses = canRecordExpenses(currentRole)
      const shouldFetchProduction = canRecordProduction(currentRole)

      // Build parallel fetch array based on permissions
      const fetchPromises: Promise<Response>[] = []
      const fetchTypes: ('sales' | 'expenses' | 'production')[] = []

      if (shouldFetchSales) {
        fetchPromises.push(fetch(`/api/sales?restaurantId=${currentRestaurant.id}&limit=100`))
        fetchTypes.push('sales')
      }
      if (shouldFetchExpenses) {
        fetchPromises.push(fetch(`/api/expenses?restaurantId=${currentRestaurant.id}&limit=100`))
        fetchTypes.push('expenses')
      }
      if (shouldFetchProduction) {
        fetchPromises.push(fetch(`/api/production?restaurantId=${currentRestaurant.id}&limit=100`))
        fetchTypes.push('production')
      }

      // Fetch only allowed data types
      const responses = await Promise.all(fetchPromises)

      // Process responses based on what was fetched
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i]
        const type = fetchTypes[i]

        if (!response.ok) continue

        if (type === 'sales') {
          const salesData = await response.json()
          const sales = salesData.sales || []
          // Store existing sale dates for duplicate prevention
          setExistingSaleDates(sales.map((s: { date: string }) => s.date.split('T')[0]))

          sales.forEach((sale: { id: string; date: string; totalGNF: number; status: string; createdAt: string; submittedByName?: string }) => {
            submissions.push({
              id: sale.id,
              type: 'sale',
              date: sale.date,
              amount: sale.totalGNF,
              status: sale.status as 'Pending' | 'Approved' | 'Rejected',
              createdAt: sale.createdAt,
              submittedByName: sale.submittedByName,
            })
          })
        } else if (type === 'expenses') {
          const expensesData = await response.json()
          const expenses = expensesData.expenses || []
          expenses.forEach((expense: { id: string; date: string; amountGNF: number; categoryName: string; status: string; createdAt: string; submittedByName?: string }) => {
            submissions.push({
              id: expense.id,
              type: 'expense',
              date: expense.date,
              amount: expense.amountGNF,
              description: expense.categoryName,
              status: expense.status as 'Pending' | 'Approved' | 'Rejected',
              createdAt: expense.createdAt,
              submittedByName: expense.submittedByName,
            })
          })
        } else if (type === 'production') {
          const productionData = await response.json()
          const logs = productionData.logs || []
          logs.forEach((log: { id: string; date: string; status: string; createdAt: string; submittedByName?: string; items?: Array<{ quantity: number }> }) => {
            const totalItems = log.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0
            submissions.push({
              id: log.id,
              type: 'production',
              date: log.date,
              description: `${totalItems} ${t('production.itemsProduced') || 'items'}`,
              status: log.status as 'Pending' | 'Approved' | 'Rejected',
              createdAt: log.createdAt,
              submittedByName: log.submittedByName,
            })
          })
        }
      }

      // Sort by createdAt descending
      submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecentSubmissions(submissions)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }, [currentRestaurant?.id, currentRole, t])

  // Fetch categories and suppliers for expense modal
  const fetchExpenseData = useCallback(async () => {
    if (!currentRestaurant?.id) return

    try {
      const [categoriesRes, suppliersRes, inventoryRes] = await Promise.all([
        fetch(`/api/categories?restaurantId=${currentRestaurant.id}`),
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


  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <EditorHeader />
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
      <EditorHeader />

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

        {/* All Submissions Table */}
        <div className="mb-8">
          <SubmissionsTable
            submissions={recentSubmissions}
            loading={loadingSubmissions}
            onRefresh={fetchRecentSubmissions}
          />
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
