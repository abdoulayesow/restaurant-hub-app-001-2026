'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Wallet } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

export default function BankPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentBakery, loading: bakeryLoading } = useBakery()

  const [loading, setLoading] = useState(true)

  const isManager = session?.user?.role === 'Manager'

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
              {t('bank.title') || 'Bank & Cash'}
            </h1>
            <p className="text-terracotta-600/70 dark:text-cream-300/70 mt-1">
              {currentBakery?.name || 'Loading...'}
            </p>
          </div>

          {isManager && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors">
              <Plus className="w-5 h-5" />
              {t('bank.recordTransaction') || 'Record Transaction'}
            </button>
          )}
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-terracotta-500/10 dark:bg-terracotta-400/10">
                <Wallet className="w-6 h-6 text-terracotta-500 dark:text-terracotta-400" />
              </div>
              <h3 className="font-semibold text-terracotta-900 dark:text-cream-100">
                {t('bank.totalBalance') || 'Total Balance'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(0)}
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60">
              {t('bank.acrossAllAccounts') || 'Across all accounts'}
            </p>
          </div>

          {/* Cash on Hand */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-400/10">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-terracotta-900 dark:text-cream-100">
                {t('bank.cashOnHand') || 'Cash on Hand'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(0)}
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60">
              {t('bank.physicalCash') || 'Physical cash'}
            </p>
          </div>

          {/* Bank Account */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-terracotta-900 dark:text-cream-100">
                {t('bank.bankAccount') || 'Bank Account'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-terracotta-900 dark:text-cream-100 mb-1">
              {formatCurrency(0)}
            </p>
            <p className="text-sm text-terracotta-600/60 dark:text-cream-300/60">
              {t('bank.currentBalance') || 'Current balance'}
            </p>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-lg font-semibold text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('bank.recentTransactions') || 'Recent Transactions'}
            </h3>
            <button className="p-2 rounded-xl text-terracotta-700 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-dark-700">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-terracotta-300 dark:text-dark-600" />
            <h3
              className="text-lg font-medium text-terracotta-900 dark:text-cream-100 mb-2"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('bank.noTransactions') || 'No Transactions'}
            </h3>
            <p className="text-terracotta-600/60 dark:text-cream-300/60 mb-6 max-w-md mx-auto">
              {t('bank.noTransactionsDescription') || 'Bank and cash transactions will appear here once you start recording them.'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Deposit */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3
                  className="font-semibold text-terracotta-900 dark:text-cream-100"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  {t('bank.deposit') || 'Deposit'}
                </h3>
                <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70">
                  {t('bank.depositDescription') || 'Add funds to your account'}
                </p>
              </div>
            </div>
            <button
              disabled={!isManager}
              className="w-full px-4 py-2 border border-green-500 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('bank.recordDeposit') || 'Record Deposit'}
            </button>
          </div>

          {/* Withdrawal */}
          <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3
                  className="font-semibold text-terracotta-900 dark:text-cream-100"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  {t('bank.withdrawal') || 'Withdrawal'}
                </h3>
                <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70">
                  {t('bank.withdrawalDescription') || 'Remove funds from your account'}
                </p>
              </div>
            </div>
            <button
              disabled={!isManager}
              className="w-full px-4 py-2 border border-red-500 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('bank.recordWithdrawal') || 'Record Withdrawal'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
