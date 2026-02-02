'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, PieChart, BarChart3, Loader2 } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useLocale } from '@/components/providers/LocaleProvider'

interface BankChartsPanelProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
}

interface AnalyticsData {
  cashFlow: Array<{
    date: string
    cashDeposits: number
    cashWithdrawals: number
    orangeDeposits: number
    orangeWithdrawals: number
    cardDeposits: number
    cardWithdrawals: number
  }>
  reasonBreakdown: Array<{
    reason: string
    amount: number
    percentage: number
  }>
  methodBreakdown: Array<{
    method: string
    deposits: number
    withdrawals: number
    net: number
  }>
  balanceHistory: Array<{
    date: string
    cashBalance: number
    orangeMoneyBalance: number
    cardBalance: number
    totalBalance: number
  }>
  summary: {
    totalTransactions: number
    totalDeposits: number
    totalWithdrawals: number
    netCashFlow: number
  }
}

export function BankChartsPanel({ isOpen, onClose, restaurantId }: BankChartsPanelProps) {
  const { t, locale } = useLocale()
  const [activeTab, setActiveTab] = useState<'cashFlow' | 'breakdown' | 'balance'>('cashFlow')
  const [timeframe, setTimeframe] = useState<'30' | '90'>('30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data when panel opens or timeframe changes
  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, restaurantId, timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bank/analytics?restaurantId=${restaurantId}&timeframe=${timeframe}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(t('errors.fetchFailed') || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  // Chart colors (warm palette for bakery theme)
  const COLORS = {
    cash: '#10b981',       // Emerald for cash
    orange: '#f97316',     // Orange for Orange Money
    card: '#3b82f6',       // Blue for Card
    deposit: '#10b981',    // Green for deposits
    withdrawal: '#ef4444', // Red for withdrawals
    reasons: [
      '#D4AF37', // Gold
      '#f97316', // Orange
      '#10b981', // Emerald
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899', // Pink
    ]
  }

  // Reason label translation
  const getReasonLabel = (reason: string) => {
    return t(`bank.reasons.${reason}`) || reason
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 dark:bg-stone-800 border border-stone-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-stone-100 mb-2">
            {formatFullDate(label || '')}
          </p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* Sliding Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[600px] lg:w-[700px] xl:w-[800px] bg-gray-50 dark:bg-stone-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 dark:bg-stone-700 rounded-lg">
              <BarChart3 className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {t('bank.analytics.title') || 'Bank Analytics'}
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('bank.analytics.subtitle') || 'Financial insights and trends'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="px-6 py-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeframe('30')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === '30'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
              }`}
            >
              {t('bank.analytics.last30Days') || 'Last 30 Days'}
            </button>
            <button
              onClick={() => setTimeframe('90')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === '90'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
              }`}
            >
              {t('bank.analytics.last90Days') || 'Last 90 Days'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cashFlow')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'cashFlow'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {t('bank.analytics.cashFlow') || 'Cash Flow'}
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'breakdown'
                ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <PieChart className="w-4 h-4" />
            {t('bank.analytics.breakdown') || 'Breakdown'}
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'balance'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t('bank.analytics.balanceHistory') || 'Balance History'}
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                {t('common.retry') || 'Retry'}
              </button>
            </div>
          ) : data ? (
            <>
              {/* Summary Stats */}
              {activeTab !== 'breakdown' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                      {t('bank.analytics.totalDeposits') || 'Total Deposits'}
                    </p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(data.summary.totalDeposits)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                      {t('bank.analytics.totalWithdrawals') || 'Total Withdrawals'}
                    </p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      -{formatCurrency(data.summary.totalWithdrawals)}
                    </p>
                  </div>
                </div>
              )}

              {/* Cash Flow Tab */}
              {activeTab === 'cashFlow' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
                      {t('bank.analytics.dailyCashFlow') || 'Daily Cash Flow'}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.cashFlow}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#44403c" opacity={0.1} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#78716c"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#78716c"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                            return value.toString()
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cashDeposits"
                          stroke={COLORS.cash}
                          strokeWidth={2}
                          dot={false}
                          name={t('bank.analytics.cashDeposits') || 'Cash Deposits'}
                        />
                        <Line
                          type="monotone"
                          dataKey="orangeDeposits"
                          stroke={COLORS.orange}
                          strokeWidth={2}
                          dot={false}
                          name={t('bank.analytics.orangeDeposits') || 'Orange Money Deposits'}
                        />
                        <Line
                          type="monotone"
                          dataKey="cardDeposits"
                          stroke={COLORS.card}
                          strokeWidth={2}
                          dot={false}
                          name={t('bank.analytics.cardDeposits') || 'Card Deposits'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Breakdown Tab */}
              {activeTab === 'breakdown' && (
                <div className="space-y-6">
                  {/* By Reason */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
                      {t('bank.analytics.byReason') || 'Transactions by Reason'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={data.reasonBreakdown}
                          dataKey="amount"
                          nameKey="reason"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${getReasonLabel(entry.reason)} (${entry.percentage}%)`}
                          labelLine={false}
                        >
                          {data.reasonBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.reasons[index % COLORS.reasons.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>

                  {/* By Method */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
                      {t('bank.analytics.byMethod') || 'Transactions by Method'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.methodBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#44403c" opacity={0.1} />
                        <XAxis dataKey="method" stroke="#78716c" fontSize={12} tickLine={false} />
                        <YAxis
                          stroke="#78716c"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                            return value.toString()
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="deposits"
                          fill={COLORS.deposit}
                          name={t('bank.analytics.deposits') || 'Deposits'}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="withdrawals"
                          fill={COLORS.withdrawal}
                          name={t('bank.analytics.withdrawals') || 'Withdrawals'}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Balance History Tab */}
              {activeTab === 'balance' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
                      {t('bank.analytics.balanceOverTime') || 'Balance Over Time'}
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={data.balanceHistory}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.cash} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCard" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.card} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={COLORS.card} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#44403c" opacity={0.1} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#78716c"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#78716c"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                            return value.toString()
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="cashBalance"
                          stroke={COLORS.cash}
                          strokeWidth={2}
                          fill="url(#colorCash)"
                          name={t('bank.cashOnHand') || 'Cash'}
                        />
                        <Area
                          type="monotone"
                          dataKey="orangeMoneyBalance"
                          stroke={COLORS.orange}
                          strokeWidth={2}
                          fill="url(#colorOrange)"
                          name="Orange Money"
                        />
                        <Area
                          type="monotone"
                          dataKey="cardBalance"
                          stroke={COLORS.card}
                          strokeWidth={2}
                          fill="url(#colorCard)"
                          name={t('bank.card') || 'Card'}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-stone-500 dark:text-stone-400">
              {t('bank.analytics.noData') || 'No data available'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
