'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Wallet, Smartphone, Clock, Search, ReceiptText } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canAccessBank } from '@/lib/roles'
import { TransactionFormModal } from '@/components/bank/TransactionFormModal'
import { TransactionsTable } from '@/components/bank/TransactionsTable'
import { TransactionDetailModal } from '@/components/bank/TransactionDetailModal'
import { Toast } from '@/components/ui/Toast'

type TransactionType = 'Deposit' | 'Withdrawal'
type PaymentMethod = 'Cash' | 'OrangeMoney' | 'Card'
type TransactionStatus = 'Pending' | 'Confirmed'
type TransactionReason = 'SalesDeposit' | 'DebtCollection' | 'ExpensePayment' | 'OwnerWithdrawal' | 'CapitalInjection' | 'Other'

interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  method: PaymentMethod
  reason: TransactionReason
  status: TransactionStatus
  description?: string | null
  comments?: string | null
  bankRef?: string | null
  confirmedAt?: string | null
  createdByName?: string | null
  sale?: {
    id: string
    date: string
    totalGNF: number
  } | null
  debtPayment?: {
    id: string
    amount: number
    paymentDate: string
    debt?: {
      customer?: {
        name: string
      } | null
    } | null
  } | null
  expensePayment?: {
    id: string
    amount: number
    expense?: {
      id: string
      categoryName: string
      amountGNF: number
      supplierName?: string | null
    } | null
  } | null
  createdAt?: string
  receiptUrl?: string | null
}

export default function BankPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  // Data state
  const [balances, setBalances] = useState({ cash: 0, orangeMoney: 0, card: 0, total: 0 })
  const [pending, setPending] = useState({ totalPendingDeposits: 0, totalPendingWithdrawals: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)

  // Transaction detail modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Modal state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [defaultTransactionType, setDefaultTransactionType] = useState<TransactionType>('Deposit')
  const [saving, setSaving] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Filter state
  const [typeFilter, setTypeFilter] = useState<'' | 'Deposit' | 'Withdrawal'>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'Pending' | 'Confirmed'>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Permission check for bank access (Owner or legacy Manager)
  const canManageBank = canAccessBank(currentRole)

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    if (typeFilter && txn.type !== typeFilter) return false
    if (statusFilter && txn.status !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesDescription = txn.description?.toLowerCase().includes(query)
      const matchesRef = txn.bankRef?.toLowerCase().includes(query)
      const matchesCreator = txn.createdByName?.toLowerCase().includes(query)
      if (!matchesDescription && !matchesRef && !matchesCreator) return false
    }
    return true
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!currentRestaurant) return

    try {
      const response = await fetch(`/api/bank/balances?restaurantId=${currentRestaurant.id}`)
      if (!response.ok) throw new Error('Failed to fetch balances')

      const data = await response.json()
      setBalances(data.balances)
      setPending(data.pending || { totalPendingDeposits: 0, totalPendingWithdrawals: 0 })
    } catch (err) {
      console.error('Error fetching balances:', err)
      setError(t('errors.fetchFailed') || 'Failed to load data')
    }
  }, [currentRestaurant, t])

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!currentRestaurant) return

    try {
      const response = await fetch(`/api/bank/transactions?restaurantId=${currentRestaurant.id}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(t('errors.fetchFailed') || 'Failed to load data')
    }
  }, [currentRestaurant, t])

  // Fetch data when restaurant changes
  useEffect(() => {
    if (currentRestaurant) {
      setLoading(true)
      setError(null)
      Promise.all([fetchBalances(), fetchTransactions()])
        .finally(() => setLoading(false))
    }
  }, [currentRestaurant, fetchBalances, fetchTransactions])

  // Create transaction handler
  const handleCreateTransaction = async (data: {
    date: string
    amount: number
    type: TransactionType
    method: PaymentMethod
    reason: TransactionReason
    description?: string
    saleId?: string
    comments?: string
  }) => {
    if (!currentRestaurant) return

    setSaving(true)
    try {
      const response = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, restaurantId: currentRestaurant.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create transaction')
      }

      setTransactionModalOpen(false)
      const messageKey = data.type === 'Deposit' ? 'bank.depositCreated' : 'bank.withdrawalCreated'
      const fallback = data.type === 'Deposit' ? 'Deposit created successfully' : 'Withdrawal created successfully'
      setToast({ message: t(messageKey) || fallback, type: 'success' })
      await Promise.all([fetchTransactions(), fetchBalances()])
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : t('errors.generic') || 'An error occurred',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Confirm transaction handler
  const handleConfirmTransaction = async (transactionId: string, additionalData?: { bankRef?: string; comments?: string }) => {
    try {
      const response = await fetch(`/api/bank/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Confirmed',
          ...(additionalData?.bankRef && { bankRef: additionalData.bankRef }),
          ...(additionalData?.comments && { comments: additionalData.comments }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to confirm transaction')
      }

      setToast({ message: t('bank.transactionConfirmed') || 'Transaction confirmed', type: 'success' })
      await Promise.all([fetchTransactions(), fetchBalances()])
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : t('errors.generic') || 'An error occurred',
        type: 'error'
      })
      throw err // Re-throw so modal can handle it
    }
  }

  // Handle confirm from detail modal
  const handleConfirmFromModal = async (transactionId: string, data?: { bankRef?: string; comments?: string }) => {
    setConfirming(true)
    try {
      await handleConfirmTransaction(transactionId, data)
      setDetailModalOpen(false)
      setSelectedTransaction(null)
    } finally {
      setConfirming(false)
    }
  }

  // Handle transaction click to open detail modal
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDetailModalOpen(true)
  }


  // Open modal for deposit
  const openDepositModal = () => {
    setDefaultTransactionType('Deposit')
    setTransactionModalOpen(true)
  }

  // Open modal for withdrawal
  const openWithdrawalModal = () => {
    setDefaultTransactionType('Withdrawal')
    setTransactionModalOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

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
              {t('bank.title') || 'Bank & Cash'}
            </h1>
            <p className="text-gray-600 dark:text-stone-400 mt-1">
              {currentRestaurant?.name || 'Loading...'}
            </p>
          </div>

          {canManageBank && (
            <button
              onClick={openDepositModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('bank.recordTransaction') || 'Record Transaction'}
            </button>
          )}
        </div>

        {/* Balance Cards - Row 1 */}
        <div className="grid md:grid-cols-4 gap-6 mb-4">
          {/* Total Balance - Cyan theme */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30">
                <Wallet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="font-medium text-gray-500 dark:text-stone-400">
                {t('bank.totalBalance') || 'Total Balance'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(balances.total)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('bank.acrossAllAccounts') || 'Across all accounts'}
            </p>
          </div>

          {/* Cash on Hand */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-medium text-gray-500 dark:text-stone-400">
                {t('bank.cashOnHand') || 'Cash'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(balances.cash)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('bank.physicalCash') || 'Physical cash'}
            </p>
          </div>

          {/* Orange Money */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/30">
                <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-medium text-gray-500 dark:text-stone-400">
                Orange Money
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(balances.orangeMoney)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('bank.mobileWallet') || 'Mobile wallet'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-gray-500 dark:text-stone-400">
                {t('bank.card') || 'Card'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-1">
              {formatCurrency(balances.card)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('bank.bankCard') || 'Bank card'}
            </p>
          </div>
        </div>

        {/* Pending Cards - Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pending Deposits */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30">
                <ArrowUpRight className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-500 dark:text-stone-400">
                  {t('bank.pendingDeposits') || 'Pending Deposits'}
                </h3>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
              +{formatCurrency(pending.totalPendingDeposits)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('bank.awaitingConfirmation') || 'Awaiting confirmation'}
            </p>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                <ArrowDownRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-500 dark:text-stone-400">
                  {t('bank.pendingWithdrawals') || 'Pending Withdrawals'}
                </h3>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-1">
              -{formatCurrency(pending.totalPendingWithdrawals)}
            </p>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('bank.awaitingConfirmation') || 'Awaiting confirmation'}
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('bank.searchPlaceholder') || 'Search transactions...'}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            <option value="">{t('bank.allTypes') || 'All Types'}</option>
            <option value="Deposit">{t('bank.deposits') || 'Deposits'}</option>
            <option value="Withdrawal">{t('bank.withdrawals') || 'Withdrawals'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            <option value="">{t('bank.allStatuses') || 'All Statuses'}</option>
            <option value="Pending">{t('bank.pending') || 'Pending'}</option>
            <option value="Confirmed">{t('bank.confirmed') || 'Confirmed'}</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchTransactions()}
            className="p-2.5 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length > 0 ? (
          <TransactionsTable
            transactions={filteredTransactions}
            onTransactionClick={handleTransactionClick}
            onConfirm={handleTransactionClick}
            canEdit={canManageBank}
            loading={loading}
          />
        ) : (
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-12 text-center mb-8">
            <ReceiptText className="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-stone-600" />
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
              {t('bank.noTransactions') || 'No Transactions'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
              {searchQuery || typeFilter || statusFilter
                ? (t('bank.noMatchingTransactions') || 'No transactions match your filters.')
                : (t('bank.noTransactionsYet') || 'Record your first transaction to start tracking bank activity.')}
            </p>
            {canManageBank && !searchQuery && !typeFilter && !statusFilter && (
              <button
                onClick={openDepositModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('bank.recordFirstTransaction') || 'Record First Transaction'}
              </button>
            )}
          </div>
        )}

        {/* Spacer before Quick Actions */}
        <div className="mb-8"></div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Deposit */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-stone-100">
                  {t('bank.deposit') || 'Deposit'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-stone-400">
                  {t('bank.depositDescription') || 'Add funds to your account'}
                </p>
              </div>
            </div>
            <button
              disabled={!canManageBank}
              onClick={openDepositModal}
              className="w-full px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('bank.recordDeposit') || 'Record Deposit'}
            </button>
          </div>

          {/* Withdrawal */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                <ArrowDownRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-stone-100">
                  {t('bank.withdrawal') || 'Withdrawal'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-stone-400">
                  {t('bank.withdrawalDescription') || 'Remove funds from your account'}
                </p>
              </div>
            </div>
            <button
              disabled={!canManageBank}
              onClick={openWithdrawalModal}
              className="w-full px-4 py-2.5 border-2 border-rose-500 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('bank.recordWithdrawal') || 'Record Withdrawal'}
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <TransactionFormModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        isLoading={saving}
        defaultType={defaultTransactionType}
      />

      <TransactionDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedTransaction(null)
        }}
        transaction={selectedTransaction}
        onConfirm={handleConfirmFromModal}
        canConfirm={canManageBank}
        isConfirming={confirming}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
