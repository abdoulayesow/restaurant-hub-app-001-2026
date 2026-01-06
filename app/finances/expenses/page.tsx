'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Receipt, RefreshCw, Filter, Calendar } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

export default function ExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentBakery, loading: bakeryLoading } = useBakery()

  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  useEffect(() => {
    if (currentBakery) {
      setLoading(false)
    }
  }, [currentBakery])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  if (status === 'loading' || bakeryLoading) {
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
              {currentBakery?.name || 'Loading...'}
            </p>
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors">
            <Plus className="w-5 h-5" />
            {t('expenses.addExpense') || 'Add Expense'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Today's Expenses */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-400/10">
                <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-terracotta-900 dark:text-cream-100">
                {t('expenses.todaysExpenses') || "Today's Expenses"}
              </h3>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(0)}
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60">
              {t('expenses.noExpensesYet') || 'No expenses recorded yet'}
            </p>
          </div>

          {/* This Month */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
                <Calendar className="w-6 h-6 text-terracotta-500 dark:text-terracotta-400" />
              </div>
              <h3 className="font-semibold text-terracotta-900 dark:text-cream-100">
                {t('expenses.thisMonth') || 'This Month'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(0)}
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60">
              0 {t('expenses.expensesRecorded') || 'expenses recorded'}
            </p>
          </div>

          {/* Pending Approvals */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-400/10">
                <Filter className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-terracotta-900 dark:text-cream-100">
                {t('expenses.pendingApprovals') || 'Pending Approvals'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
              0
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60">
              {t('expenses.awaitingReview') || 'awaiting review'}
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-terracotta-400" />
            <input
              type="text"
              placeholder={t('expenses.searchPlaceholder') || 'Search expenses...'}
              className="w-full pl-10 pr-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-terracotta-200 dark:border-dark-600 rounded-xl bg-cream-50 dark:bg-dark-800 text-terracotta-900 dark:text-cream-100"
          >
            <option value="">{t('expenses.allCategories') || 'All Categories'}</option>
            <option value="Ingredients">{t('expenses.ingredients') || 'Ingredients'}</option>
            <option value="Utilities">{t('expenses.utilities') || 'Utilities'}</option>
            <option value="Salaries">{t('expenses.salaries') || 'Salaries'}</option>
            <option value="Maintenance">{t('expenses.maintenance') || 'Maintenance'}</option>
            <option value="Other">{t('expenses.other') || 'Other'}</option>
          </select>

          <button className="p-2 rounded-xl border border-terracotta-200 dark:border-dark-600 text-terracotta-700 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-dark-700">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Empty State */}
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
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors">
            <Plus className="w-5 h-5" />
            {t('expenses.addFirstExpense') || 'Add First Expense'}
          </button>
        </div>
      </main>
    </div>
  )
}
