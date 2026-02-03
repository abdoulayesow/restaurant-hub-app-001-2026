'use client'

import { Banknote, ChevronRight, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'

interface UnpaidExpense {
  id: string
  categoryName: string
  amountGNF: number
  totalPaidAmount: number
  date: string
  supplier?: { name: string } | null
}

interface UnpaidExpensesWidgetProps {
  expenses: UnpaidExpense[]
  totalOutstanding: number
  loading?: boolean
}

export function UnpaidExpensesWidget({
  expenses,
  totalOutstanding,
  loading = false,
}: UnpaidExpensesWidgetProps) {
  const { t, locale } = useLocale()
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' GNF'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const count = expenses.length

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-stone-700 rounded animate-pulse" />
          <div className="h-6 w-8 bg-gray-200 dark:bg-stone-700 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-stone-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-amber-500" />
          {t('dashboard.unpaidExpenses') || 'Unpaid Expenses'}
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          count > 0
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        }`}>
          {count}
        </span>
      </div>

      {/* Total Outstanding */}
      {totalOutstanding > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-400">
              {t('dashboard.totalOutstanding') || 'Total Outstanding'}
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>
      )}

      {count > 0 ? (
        <div className="space-y-2">
          {expenses.slice(0, 5).map((expense) => {
            const remaining = expense.amountGNF - expense.totalPaidAmount
            const isPending = expense.totalPaidAmount === 0

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors cursor-pointer group"
                onClick={() => router.push(`/finances/expenses?paymentStatus=${isPending ? 'Unpaid' : 'PartiallyPaid'}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    isPending ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-stone-100 truncate">
                      {expense.categoryName}
                      {expense.supplier?.name && (
                        <span className="text-gray-500 dark:text-stone-400 font-normal ml-1">
                          • {expense.supplier.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-stone-400 flex items-center gap-2">
                      <span>{formatDate(expense.date)}</span>
                      {!isPending && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {Math.round((expense.totalPaidAmount / expense.amountGNF) * 100)}% {t('expenses.payment.paid') || 'paid'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-stone-100 whitespace-nowrap">
                    {formatCurrency(remaining)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-stone-300 transition-colors" />
                </div>
              </div>
            )
          })}
          {count > 5 && (
            <button
              onClick={() => router.push('/finances/expenses?paymentStatus=Unpaid,PartiallyPaid')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-300 py-2 transition-colors"
            >
              {t('dashboard.viewAll') || 'View all'} ({count})
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 dark:text-stone-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('dashboard.allExpensesPaid') || 'All expenses paid!'}</p>
        </div>
      )}
    </div>
  )
}
