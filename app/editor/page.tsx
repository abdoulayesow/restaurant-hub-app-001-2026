'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  TrendingUp,
  Receipt,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

export default function EditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLocale()
  const { currentBakery, loading: bakeryLoading } = useBakery()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading' || bakeryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('editor.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('editor.welcomeMessage')}
          </p>
          {currentBakery && (
            <p className="text-sm text-gold-600 dark:text-gold-400 mt-2">
              {currentBakery.name}
              {currentBakery.location && ` - ${currentBakery.location}`}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('editor.quickActions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Submit Sale */}
            <button
              onClick={() => router.push('/sales')}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-gold-500 dark:hover:border-gold-500 transition-colors text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('editor.submitSale')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('sales.title')}
              </p>
            </button>

            {/* Submit Expense */}
            <button
              onClick={() => router.push('/expenses')}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-gold-500 dark:hover:border-gold-500 transition-colors text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('editor.submitExpense')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('expenses.title')}
              </p>
            </button>

            {/* Log Production */}
            <button
              onClick={() => router.push('/production')}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:border-gold-500 dark:hover:border-gold-500 transition-colors text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gold-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('editor.logProduction')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('production.title')}
              </p>
            </button>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('editor.recentSubmissions')}
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-gold-500" />
              {t('editor.howItWorks')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('editor.step1')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('editor.step2')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('editor.step3')}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">{t('common.pending')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">{t('common.approved')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600 dark:text-gray-400">{t('common.rejected')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
