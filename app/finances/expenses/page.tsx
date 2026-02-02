'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Search, Receipt, RefreshCw, Filter, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canAccessBank } from '@/lib/roles'
import { ExpensesTable } from '@/components/expenses/ExpensesTable'
import { AddEditExpenseModal } from '@/components/expenses/AddEditExpenseModal'
import { RecordPaymentModal } from '@/components/expenses/RecordPaymentModal'
import { Toast } from '@/components/ui/Toast'
import { DateRangeFilter, getDateRangeFromFilter, type DateRangeValue } from '@/components/ui/DateRangeFilter'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ExpenseTrendChart } from '@/components/expenses/ExpenseTrendChart'
import { ExpenseCategoryChart } from '@/components/expenses/ExpenseCategoryChart'

interface Expense {
  id: string
  date: string
  categoryId?: string | null
  categoryName: string
  amountGNF: number
  paymentMethod?: string | null // Legacy: now optional, determined at payment time
  billingRef?: string | null // Invoice or receipt reference number
  description?: string | null
  paymentStatus?: 'Unpaid' | 'PartiallyPaid' | 'Paid'
  totalPaidAmount?: number
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
  unpaidCount: number
  partiallyPaidCount: number
  paidCount: number
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
  const searchParams = useSearchParams()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  // Initialize filters from URL params
  const initialPaymentStatus = searchParams.get('paymentStatus') || ''

  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpensesSummary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(initialPaymentStatus)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeValue>('30days')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null)
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [expensesByDay, setExpensesByDay] = useState<ExpenseTrendDataPoint[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategoryData[]>([])

  // Delete confirmation modal state
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  // Permission check - only owners can edit/delete/pay expenses
  const isOwner = canAccessBank(currentRole)

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
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter }),
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
  }, [currentRestaurant?.id, paymentStatusFilter, categoryFilter, dateRange])

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

  // Handle delete
  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense)
    setIsDeleteConfirmModalOpen(true)
  }

  const executeDelete = async () => {
    if (!expenseToDelete) return

    try {
      const res = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setIsDeleteConfirmModalOpen(false)
        setExpenseToDelete(null)
        setToast({ message: t('expenses.deleteSuccess') || 'Expense deleted successfully', type: 'success' })
        fetchExpenses()
      } else {
        const error = await res.json()
        setToast({ message: error.error || 'Failed to delete expense', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      setToast({ message: 'Failed to delete expense', type: 'error' })
    }
  }

  // Handle record payment
  const handleOpenPaymentModal = (expense: Expense) => {
    setPaymentExpense(expense)
    setIsPaymentModalOpen(true)
  }

  const handleRecordPayment = async (data: {
    amount: number
    paymentMethod: 'Cash' | 'OrangeMoney' | 'Card'
    notes?: string
    receiptUrl?: string
  }) => {
    if (!paymentExpense) return

    setIsRecordingPayment(true)
    try {
      const res = await fetch(`/api/expenses/${paymentExpense.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsPaymentModalOpen(false)
        setPaymentExpense(null)
        setToast({
          message: t('expenses.payment.paymentRecorded') || 'Payment recorded successfully',
          type: 'success',
        })
        fetchExpenses()
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Failed to record payment')
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to record payment',
        type: 'error',
      })
      throw error
    } finally {
      setIsRecordingPayment(false)
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
      <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-stone-800 rounded-xl"></div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {t('expenses.title') || 'Expenses'}
            </h1>
            <p className="text-gray-600 dark:text-stone-400 mt-1">
              {currentRestaurant?.name || 'Loading...'}
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
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
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                <Receipt className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('expenses.todaysExpenses') || "Today's Expenses"}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(summary?.todayTotal || 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-stone-400">
              {summary?.todayTotal ? '' : (t('expenses.noExpensesYet') || 'No expenses recorded yet')}
            </p>
          </div>

          {/* This Month */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                <Calendar className="w-5 h-5 text-gray-700 dark:text-stone-300" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('expenses.thisMonth') || 'This Month'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(summary?.monthTotal || 0)}
            </p>
            {summary && dateRange !== 'all' && summary.expenseChangePercent !== 0 ? (
              <p className={`text-xs flex items-center gap-1 ${
                summary.expenseChangePercent > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {summary.expenseChangePercent > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(summary.expenseChangePercent)}% {t('sales.vsLastPeriod') || 'vs last period'}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-stone-400">
                {summary?.totalExpenses || 0} {t('expenses.expensesRecorded') || 'expenses'}
              </p>
            )}
          </div>

          {/* Period Total */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-stone-700">
                <TrendingUp className="w-5 h-5 text-gray-700 dark:text-stone-300" />
              </div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-stone-400">
                {t('expenses.periodTotal') || 'Period Total'}
              </h3>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(summary?.totalAmount || 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-stone-400">
              {summary?.totalExpenses || 0} {t('expenses.expensesRecorded') || 'expenses'}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Trend Chart */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
              {t('expenses.expenseTrend') || 'Expense Trend'}
            </h3>
            <ExpenseTrendChart data={expensesByDay} />
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">
              {t('expenses.categoryDistribution') || 'By Category'}
            </h3>
            <ExpenseCategoryChart data={expensesByCategory} />
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
              placeholder={t('expenses.searchPlaceholder') || 'Search expenses...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
            />
          </div>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
          >
            <option value="">{t('expenses.allPaymentStatuses') || 'All Payment Status'}</option>
            <option value="Unpaid">{t('expenses.payment.unpaid') || 'Unpaid'}</option>
            <option value="PartiallyPaid">{t('expenses.payment.partiallyPaid') || 'Partially Paid'}</option>
            <option value="Paid">{t('expenses.payment.paid') || 'Paid'}</option>
            <option value="Unpaid,PartiallyPaid">{t('expenses.unpaidOrPartial') || 'Unpaid + Partial'}</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
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
            className="p-2.5 rounded-lg border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 disabled:opacity-50 transition-colors"
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
            onDelete={handleDelete}
            onRecordPayment={handleOpenPaymentModal}
            isOwner={isOwner}
            loading={loading}
          />
        ) : (
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-stone-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-stone-100 mb-2">
              {t('expenses.noExpenses') || 'No Expenses Recorded'}
            </h3>
            <p className="text-gray-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
              {t('expenses.noExpensesDescription') || 'Record your first expense to start tracking costs and managing your bakery finances.'}
            </p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
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

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setPaymentExpense(null)
        }}
        onSubmit={handleRecordPayment}
        expense={paymentExpense}
        isLoading={isRecordingPayment}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Approval Confirmation Modal */}
      {expenseToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteConfirmModalOpen}
          onClose={() => {
            setIsDeleteConfirmModalOpen(false)
            setExpenseToDelete(null)
          }}
          onConfirm={executeDelete}
          title={t('expenses.deleteExpense') || 'Delete Expense'}
          description={t('expenses.confirmDelete') || 'Are you sure you want to delete this expense?'}
          itemType={t('common.expense') || 'Expense'}
          itemName={locale === 'fr' && categories.find(c => c.id === expenseToDelete?.categoryId)?.nameFr
            ? categories.find(c => c.id === expenseToDelete?.categoryId)?.nameFr || expenseToDelete?.categoryName || ''
            : expenseToDelete?.categoryName || ''}
          itemDetails={expenseToDelete ? [
            { label: t('common.amount') || 'Amount', value: formatCurrency(expenseToDelete.amountGNF) },
            { label: t('common.date') || 'Date', value: new Date(expenseToDelete.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') },
          ] : []}
          warningMessage={t('expenses.deleteWarning') || 'This action cannot be undone.'}
          severity="critical"
        />
      )}
    </div>
  )
}
