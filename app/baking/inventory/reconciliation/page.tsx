'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardCheck, History, Plus } from 'lucide-react'
import Link from 'next/link'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canApprove } from '@/lib/roles'
import { ReconciliationForm } from '@/components/inventory/ReconciliationForm'
import { VarianceReport } from '@/components/inventory/VarianceReport'
import { InventoryItem } from '@/components/inventory/InventoryCard'

interface ReconciliationItem {
  id: string
  inventoryItemId: string
  systemStock: number
  physicalCount: number
  variance: number
  adjustmentApplied: boolean
  inventoryItem: {
    id: string
    name: string
    nameFr: string | null
    unit: string
    category: string
  }
}

interface Reconciliation {
  id: string
  restaurantId: string
  date: string
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedBy: string
  submittedByName: string | null
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
  notes: string | null
  items: ReconciliationItem[]
  createdAt: string
}

type ViewMode = 'list' | 'form' | 'review'

export default function ReconciliationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  // Data state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Permission check for manager actions (Owner or legacy Manager)
  const isManager = canApprove(currentRole)

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentRestaurant) return

    setLoading(true)
    setError(null)

    try {
      // Fetch inventory items and reconciliations in parallel
      const [itemsRes, reconcRes] = await Promise.all([
        fetch(`/api/inventory?restaurantId=${currentRestaurant.id}`),
        fetch(`/api/reconciliation?restaurantId=${currentRestaurant.id}`),
      ])

      if (!itemsRes.ok || !reconcRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [itemsData, reconcData] = await Promise.all([
        itemsRes.json(),
        reconcRes.json(),
      ])

      setInventoryItems(itemsData.items || [])
      setReconciliations(reconcData.reconciliations || [])
    } catch (err) {
      setError(t('errors.generic'))
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant, t])

  useEffect(() => {
    if (currentRestaurant) {
      fetchData()
    }
  }, [currentRestaurant, fetchData])

  // Handle form submission
  const handleSubmitReconciliation = async (
    items: { inventoryItemId: string; physicalCount: number }[],
    notes?: string
  ) => {
    if (!currentRestaurant) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          notes,
          items,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit reconciliation')
      }

      await fetchData()
      setViewMode('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  // Handle approve/reject
  const handleApproveReject = async (action: 'approve' | 'reject') => {
    if (!selectedReconciliation) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/reconciliation/${selectedReconciliation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} reconciliation`)
      }

      await fetchData()
      setViewMode('list')
      setSelectedReconciliation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  // View reconciliation details
  const handleViewReconciliation = (rec: Reconciliation) => {
    setSelectedReconciliation(rec)
    setViewMode('review')
  }

  // Loading state
  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-stone-800 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 dark:bg-stone-800 rounded-xl"></div>
          </div>
        </main>
      </div>
    )
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Status badge styles
  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      Approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return styles[status as keyof typeof styles] || styles.Pending
  }

  const pendingCount = reconciliations.filter(r => r.status === 'Pending').length

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-stone-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/baking/inventory"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('inventory.backToInventory') || 'Back to Inventory'}
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {t('inventory.reconciliation.title') || 'Stock Reconciliation'}
            </h1>
            <p className="text-gray-600 dark:text-stone-400 mt-1">
              {t('inventory.reconciliation.description') || 'Verify physical stock against system records'}
            </p>
          </div>

          {viewMode === 'list' && (
            <button
              onClick={() => setViewMode('form')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('inventory.reconciliation.start') || 'Start Reconciliation'}
            </button>
          )}

          {viewMode !== 'list' && (
            <button
              onClick={() => {
                setViewMode('list')
                setSelectedReconciliation(null)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
            >
              <History className="w-5 h-5" />
              {t('inventory.reconciliation.viewHistory') || 'View History'}
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form View */}
        {viewMode === 'form' && (
          <ReconciliationForm
            items={inventoryItems}
            onSubmit={handleSubmitReconciliation}
            onCancel={() => setViewMode('list')}
            isSubmitting={submitting}
          />
        )}

        {/* Review View */}
        {viewMode === 'review' && selectedReconciliation && (
          <VarianceReport
            reconciliation={selectedReconciliation}
            isManager={isManager}
            onApprove={() => handleApproveReject('approve')}
            onReject={() => handleApproveReject('reject')}
            onBack={() => {
              setViewMode('list')
              setSelectedReconciliation(null)
            }}
            isProcessing={submitting}
          />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Pending badge for managers */}
            {isManager && pendingCount > 0 && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-800 dark:text-amber-300">
                    {`${pendingCount} ${t('inventory.reconciliation.pendingReview') || 'reconciliation(s) pending review'}`}
                  </span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mb-4"></div>
                  <p className="text-gray-500 dark:text-stone-400">{t('common.loading')}</p>
                </div>
              </div>
            ) : reconciliations.length === 0 ? (
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-12 text-center">
                <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-stone-600" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-stone-100 mb-2">
                  {t('inventory.reconciliation.noRecords') || 'No reconciliations yet'}
                </h3>
                <p className="text-gray-500 dark:text-stone-400 mb-6">
                  {t('inventory.reconciliation.noRecordsDescription') ||
                    'Start a reconciliation to verify your physical stock levels'}
                </p>
                <button
                  onClick={() => setViewMode('form')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  {t('inventory.reconciliation.start') || 'Start Reconciliation'}
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-stone-700/50 border-b border-gray-200 dark:border-stone-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                        {t('common.date') || 'Date'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                        {t('inventory.reconciliation.submittedBy') || 'Submitted By'}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                        {t('inventory.reconciliation.itemsCount') || 'Items'}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                        {t('inventory.reconciliation.variances') || 'Variances'}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                        {t('common.status') || 'Status'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                        {t('common.actions') || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
                    {reconciliations.map((rec) => {
                      const varianceCount = rec.items.filter(i => i.variance !== 0).length
                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-stone-100">
                            {formatDate(rec.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-stone-400">
                            {rec.submittedByName || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-stone-400">
                            {rec.items.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            {varianceCount > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {varianceCount}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(rec.status)}`}
                            >
                              {t(`common.status${rec.status}`) || rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleViewReconciliation(rec)}
                              className="text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-100 text-sm font-medium"
                            >
                              {rec.status === 'Pending' && isManager
                                ? t('inventory.reconciliation.review') || 'Review'
                                : t('common.view') || 'View'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
