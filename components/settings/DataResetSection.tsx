'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  CreditCard,
  Landmark,
  ChefHat,
  Package,
  RefreshCw,
  X,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

type ResetType = 'sales' | 'expenses' | 'debts' | 'bank' | 'production' | 'inventory'

interface ResetCounts {
  [key: string]: {
    records: number
    relatedRecords: number
    description: string
  }
}

interface ResetCardProps {
  type: ResetType
  icon: React.ReactNode
  title: string
  description: string
  count: number
  relatedCount: number
  onReset: () => void
  loading: boolean
}

function ResetCard({
  type: _type,
  icon,
  title,
  description,
  count,
  relatedCount,
  onReset,
  loading,
}: ResetCardProps) {
  const { t } = useLocale()

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                {count.toLocaleString()} {t('settings.dataReset.records') || 'records'}
              </span>
              {relatedCount > 0 && (
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  + {relatedCount.toLocaleString()} {t('settings.dataReset.related') || 'related'}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          disabled={count === 0 || loading}
          className="
            px-4 py-2 text-sm font-medium rounded-lg transition-colors
            bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
            hover:bg-red-100 dark:hover:bg-red-900/30
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('settings.dataReset.reset') || 'Reset'
          )}
        </button>
      </div>
    </div>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  types: ResetType[]
  counts: ResetCounts
  restaurantName: string
  isResetting: boolean
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  types,
  counts,
  restaurantName,
  isResetting,
}: ConfirmationModalProps) {
  const { t } = useLocale()
  const [confirmationInput, setConfirmationInput] = useState('')

  const expectedPhrase = restaurantName.toUpperCase()
  const isConfirmationValid = confirmationInput.toUpperCase() === expectedPhrase

  // Calculate total records to be deleted
  const totalRecords = types.reduce((sum, type) => {
    const typeData = counts[type]
    return sum + (typeData?.records || 0) + (typeData?.relatedRecords || 0)
  }, 0)

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t('settings.dataReset.confirmTitle') || 'Confirm Data Reset'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              {t('settings.dataReset.warningMessage') ||
                'This action will permanently delete the selected data. This cannot be undone.'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
              {t('settings.dataReset.willDelete') || 'This will delete:'}
            </p>
            <ul className="text-sm text-stone-600 dark:text-stone-300 space-y-1">
              {types.map((type) => {
                const typeData = counts[type]
                return (
                  <li key={type} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {typeData?.records || 0} {type} {t('settings.dataReset.records') || 'records'}
                    {typeData?.relatedRecords ? ` + ${typeData.relatedRecords} ${t('settings.dataReset.related') || 'related'}` : ''}
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
              {t('settings.dataReset.totalRecords') || 'Total'}: {totalRecords.toLocaleString()} {t('settings.dataReset.records') || 'records'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              {t('settings.dataReset.typeToConfirm') || 'Type'} <span className="font-mono font-bold">{expectedPhrase}</span> {t('settings.dataReset.toConfirm') || 'to confirm'}:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={expectedPhrase}
              className="
                w-full px-4 py-2.5 rounded-lg border
                border-stone-300 dark:border-stone-600
                bg-white dark:bg-stone-700
                text-stone-900 dark:text-stone-100
                placeholder-stone-400 dark:placeholder-stone-500
                focus:ring-2 focus:ring-red-500 focus:border-red-500
              "
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
          <button
            onClick={onClose}
            disabled={isResetting}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              text-stone-700 dark:text-stone-300
              hover:bg-stone-100 dark:hover:bg-stone-700
              transition-colors
            "
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmationValid || isResetting}
            className="
              inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
              bg-red-600 text-white
              hover:bg-red-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('settings.dataReset.resetting') || 'Resetting...'}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('settings.dataReset.confirmReset') || 'Reset Data'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DataResetSection() {
  const { t } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [counts, setCounts] = useState<ResetCounts>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<ResetType[]>([])
  const [isResetting, setIsResetting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch counts on mount
  useEffect(() => {
    async function fetchCounts() {
      if (!currentRestaurant) return

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/admin/reset?restaurantId=${currentRestaurant.id}`)

        if (response.ok) {
          const data = await response.json()
          setCounts(data)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load data counts')
        }
      } catch (err) {
        setError('Failed to load data counts')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [currentRestaurant])

  const handleResetClick = (type: ResetType) => {
    setSelectedTypes([type])
    setModalOpen(true)
  }

  const handleResetAllClick = () => {
    const typesWithData = (Object.keys(counts) as ResetType[]).filter(
      (type) => counts[type]?.records > 0
    )
    if (typesWithData.length > 0) {
      setSelectedTypes(typesWithData)
      setModalOpen(true)
    }
  }

  const handleConfirmReset = async () => {
    if (!currentRestaurant) return

    try {
      setIsResetting(true)
      setError(null)

      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          types: selectedTypes,
          confirmationPhrase: currentRestaurant.name,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMessage(result.message || 'Data reset successfully')
        setModalOpen(false)

        // Refresh counts
        const countsResponse = await fetch(`/api/admin/reset?restaurantId=${currentRestaurant.id}`)
        if (countsResponse.ok) {
          const newCounts = await countsResponse.json()
          setCounts(newCounts)
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to reset data')
        setModalOpen(false)
      }
    } catch (err) {
      setError('Failed to reset data')
      console.error(err)
      setModalOpen(false)
    } finally {
      setIsResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    )
  }

  const resetCards: { type: ResetType; icon: React.ReactNode; titleKey: string; descKey: string }[] = [
    {
      type: 'sales',
      icon: <ShoppingCart className="w-5 h-5" />,
      titleKey: 'dataReset.salesTitle',
      descKey: 'dataReset.salesDesc',
    },
    {
      type: 'expenses',
      icon: <Receipt className="w-5 h-5" />,
      titleKey: 'dataReset.expensesTitle',
      descKey: 'dataReset.expensesDesc',
    },
    {
      type: 'debts',
      icon: <CreditCard className="w-5 h-5" />,
      titleKey: 'dataReset.debtsTitle',
      descKey: 'dataReset.debtsDesc',
    },
    {
      type: 'bank',
      icon: <Landmark className="w-5 h-5" />,
      titleKey: 'dataReset.bankTitle',
      descKey: 'dataReset.bankDesc',
    },
    {
      type: 'production',
      icon: <ChefHat className="w-5 h-5" />,
      titleKey: 'dataReset.productionTitle',
      descKey: 'dataReset.productionDesc',
    },
    {
      type: 'inventory',
      icon: <Package className="w-5 h-5" />,
      titleKey: 'dataReset.inventoryTitle',
      descKey: 'dataReset.inventoryDesc',
    },
  ]

  const hasAnyData = Object.values(counts).some((c) => c?.records > 0)

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="mb-4">
        <p className="text-stone-600 dark:text-stone-400">
          {t('settings.dataReset.sectionDesc') ||
            'Reset financial and operational data for this restaurant. Use this feature to start fresh or clear test data.'}
        </p>
      </div>

      {/* Warning Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t('settings.dataReset.warningTitle') || 'Caution: Permanent Action'}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {t('settings.dataReset.warningText') ||
                'Data reset is permanent and cannot be undone. Make sure to backup any important data before proceeding.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* Reset Cards */}
      <div className="grid gap-4">
        {resetCards.map(({ type, icon, titleKey, descKey }) => {
          const typeData = counts[type]
          return (
            <ResetCard
              key={type}
              type={type}
              icon={icon}
              title={t(titleKey) || type.charAt(0).toUpperCase() + type.slice(1)}
              description={t(descKey) || typeData?.description || ''}
              count={typeData?.records || 0}
              relatedCount={typeData?.relatedRecords || 0}
              onReset={() => handleResetClick(type)}
              loading={isResetting && selectedTypes.includes(type)}
            />
          )
        })}
      </div>

      {/* Reset All Button */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
        <button
          onClick={handleResetAllClick}
          disabled={!hasAnyData || isResetting}
          className="
            inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl
            bg-red-600 text-white
            hover:bg-red-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <RefreshCw className="w-4 h-4" />
          {t('settings.dataReset.resetAll') || 'Reset All Data'}
        </button>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          {t('settings.dataReset.resetAllHint') || 'This will reset all data types that have records.'}
        </p>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmReset}
        types={selectedTypes}
        counts={counts}
        restaurantName={currentRestaurant?.name || ''}
        isResetting={isResetting}
      />
    </div>
  )
}
