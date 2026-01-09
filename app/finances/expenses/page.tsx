'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Receipt, RefreshCw, Filter, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { ExpensesTable } from '@/components/expenses/ExpensesTable'
import { AddEditExpenseModal } from '@/components/expenses/AddEditExpenseModal'
import { DateRangeFilter, getDateRangeFromFilter, type DateRangeValue } from '@/components/ui/DateRangeFilter'
import { ExpenseTrendChart } from '@/components/expenses/ExpenseTrendChart'
import { ExpenseCategoryChart } from '@/components/expenses/ExpenseCategoryChart'

interface Expense {
  id: string
  date: string
  categoryId?: string | null
  categoryName: string
  amountGNF: number
  paymentMethod: string
  description?: string | null
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedByName?: string | null
  supplier?: { id: string; name: string } | null
  isInventoryPurchase: boolean
  expenseItems?: Array<{
    inventoryItemId: string
    quantity: number
    unitCostGNF: number
    inventoryItem?: {
      id: string
      name: string
      nameFr?: string | null
      unit: string
    }
  }>
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

interface ExpensesSummary {
  totalExpenses: number
  totalAmount: number
  pendingCount: number
  approvedCount: number
  todayTotal: number
  monthTotal: number
  previousPeriodTotal: number
  expenseChangePercent: number
}

interface ExpenseTrendDataPoint {
  date: string
  amount: number
}

interface ExpenseCategoryData {
  categoryName: string
  categoryNameFr?: string | null
  amount: number
  color?: string | null
}

export default function ExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpensesSummary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeValue>('30days')
  const [expensesByDay, setExpensesByDay] = useState<ExpenseTrendDataPoint[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategoryData[]>([])

  const isManager = session?.user?.role === 'Manager'

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }, [])

  // Fetch inventory items
  const fetchInventoryItems = useCallback(async () => {
    if (!currentRestaurant?.id) return
    try {
      const res = await fetch(`/api/inventory?restaurantId=${currentRestaurant.id}`)
      if (res.ok) {
        const data = await res.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error)
    }
  }, [currentRestaurant?.id])

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeFromFilter(dateRange)

      const params = new URLSearchParams({
        restaurantId: currentRestaurant.id,
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(startDate && { startDate: startDate.toISOString() }),
        endDate: endDate.toISOString(),
      })

      const res = await fetch(`/api/expenses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses || [])
        setSummary(data.summary || null)
        setExpensesByDay(data.expensesByDay || [])
        setExpensesByCategory(data.expensesByCategory || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant?.id, statusFilter, categoryFilter, dateRange])

  // Initial data fetch
  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchExpenses()
      fetchCategories()
      fetchSuppliers()
      fetchInventoryItems()
    }
  }, [currentRestaurant?.id, fetchExpenses, fetchCategories, fetchSuppliers, fetchInventoryItems])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  // Handle save expense
  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    if (!currentRestaurant?.id) return

    setIsSaving(true)
    try {
      const isEdit = !!expenseData.id
      const url = isEdit ? `/api/expenses/${expenseData.id}` : '/api/expenses'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseData,
          restaurantId: currentRestaurant.id,
        }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setSelectedExpense(null)
        fetchExpenses()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save expense')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle approve
  const handleApprove = async (expense: Expense) => {
    if (!confirm(t('expenses.confirmApprove') || 'Are you sure you want to approve this expense?')) return

    try {
      const res = await fetch(`/api/expenses/${expense.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (res.ok) {
        fetchExpenses()
      }
    } catch (error) {
      console.error('Error approving expense:', error)
    }
  }

  // Handle reject
  const handleReject = async (expense: Expense) => {
    const reason = prompt(t('expenses.rejectReason') || 'Please provide a reason for rejection:')
    if (reason === null) return

    try {
      const res = await fetch(`/api/expenses/${expense.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })

      if (res.ok) {
        fetchExpenses()
      }
    } catch (error) {
      console.error('Error rejecting expense:', error)
    }
  }

  // Handle view/edit
  const handleView = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsModalOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedExpense(null)
    setIsModalOpen(true)
  }

  // Filter expenses by search
  const filteredExpenses = expenses.filter(expense => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      expense.categoryName.toLowerCase().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      expense.supplier?.name.toLowerCase().includes(query)
    )
  })

  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-cream-200 dark:bg-dark-800 rounded w-1/4"></div>
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
              {t('expenses.title') || 'Expenses'}
            </h1>
            <p className="text-terracotta-600/70 dark:text-cream-300/70 mt-1">
              {currentRestaurant?.name || 'Loading...'}
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('expenses.addExpense') || 'Add Expense'}
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* Today's Expenses */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 dark:bg-red-400/10">
                <Receipt className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('expenses.todaysExpenses') || "Today's Expenses"}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(summary?.todayTotal || 0)}
            </p>
            <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
              {summary?.todayTotal ? '' : (t('expenses.noExpensesYet') || 'No expenses recorded yet')}
            </p>
          </div>

          {/* This Month */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
                <Calendar className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('expenses.thisMonth') || 'This Month'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(summary?.monthTotal || 0)}
            </p>
            {summary && dateRange !== 'all' && summary.expenseChangePercent !== 0 ? (
              <p className={`text-xs flex items-center gap-1 ${
                summary.expenseChangePercent > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {summary.expenseChangePercent > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(summary.expenseChangePercent)}% {t('sales.vsLastPeriod') || 'vs last period'}
              </p>
            ) : (
              <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
                {summary?.totalExpenses || 0} {t('expenses.expensesRecorded') || 'expenses'}
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
                {t('expenses.pendingApprovals') || 'Pending Approvals'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
              {summary?.pendingCount || 0}
            </p>
            <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
              {t('expenses.awaitingReview') || 'awaiting review'}
            </p>
          </div>

          {/* Period Total */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm text-terracotta-900 dark:text-cream-100">
                {t('expenses.periodTotal') || 'Period Total'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(summary?.totalAmount || 0)}
            </p>
            <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60">
              {summary?.totalExpenses || 0} {t('expenses.expensesRecorded') || 'expenses'}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Trend Chart */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('expenses.expenseTrend') || 'Expense Trend'}
            </h3>
            <ExpenseTrendChart data={expensesByDay} />
          </div>

          {/* Category Distribution */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('expenses.categoryDistribution') || 'By Category'}
            </h3>
            <ExpenseCategoryChart data={expensesByCategory} />
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
              placeholder={t('expenses.searchPlaceholder') || 'Search expenses...'}
              className="w-full pl-10 pr-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
          >
            <option value="">{t('expenses.allStatuses') || 'All Statuses'}</option>
            <option value="Pending">{t('common.pending') || 'Pending'}</option>
            <option value="Approved">{t('common.approved') || 'Approved'}</option>
            <option value="Rejected">{t('common.rejected') || 'Rejected'}</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
          >
            <option value="">{t('expenses.allCategories') || 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {locale === 'fr' && cat.nameFr ? cat.nameFr : cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchExpenses()}
            disabled={loading}
            className="p-2 rounded-xl border border-terracotta-200 dark:border-dark-600 text-terracotta-700 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table or Empty State */}
        {filteredExpenses.length > 0 ? (
          <ExpensesTable
            expenses={filteredExpenses}
            onView={handleView}
            onEdit={handleEdit}
            onApprove={handleApprove}
            onReject={handleReject}
            isManager={isManager}
            loading={loading}
          />
        ) : (
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-12 text-center grain-overlay">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-terracotta-300 dark:text-dark-600" />
            <h3
              className="text-lg font-medium text-terracotta-900 dark:text-cream-100 mb-2"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('expenses.noExpenses') || 'No Expenses Recorded'}
            </h3>
            <p className="text-terracotta-600/60 dark:text-cream-300/60 mb-6 max-w-md mx-auto">
              {t('expenses.noExpensesDescription') || 'Record your first expense to start tracking costs and managing your bakery finances.'}
            </p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('expenses.addFirstExpense') || 'Add First Expense'}
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <AddEditExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedExpense(null)
        }}
        onSave={handleSaveExpense}
        expense={selectedExpense}
        categories={categories}
        suppliers={suppliers}
        inventoryItems={inventoryItems}
        loading={isSaving}
      />
    </div>
  )
}
