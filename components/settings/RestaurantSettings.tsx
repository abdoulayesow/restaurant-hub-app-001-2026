'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

type StockDeductionMode = 'immediate' | 'deferred'

export function RestaurantSettings() {
  const { t } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [mode, setMode] = useState<StockDeductionMode>('immediate')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      if (!currentRestaurant) return

      try {
        setLoading(true)
        const response = await fetch(`/api/restaurant/settings?restaurantId=${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          setMode(data.stockDeductionMode)
        } else {
          setError('Failed to load settings')
        }
      } catch (err) {
        setError('Failed to load settings')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [currentRestaurant])

  const handleSave = async () => {
    if (!currentRestaurant) return

    try {
      setSaving(true)
      setError(null)
      setSaved(false)

      const response = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          stockDeductionMode: mode,
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Failed to save settings')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-gray-100 dark:bg-stone-800 rounded-2xl shadow p-6">
        <h2
          className="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-4"
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        >
          {t('settings.stockDeduction') || 'Stock Deduction Settings'}
        </h2>

        <p className="text-sm text-gray-600 dark:text-stone-300 mb-6">
          {t('settings.stockDeductionDesc') ||
            'Choose when inventory stock should be deducted for production logs.'}
        </p>

        <div className="space-y-4">
          {/* Immediate Mode */}
          <label
            className={`
              flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${
                mode === 'immediate'
                  ? 'border-gray-900 bg-gray-100 dark:bg-stone-700'
                  : 'border-gray-300 dark:border-stone-600 hover:border-gray-400'
              }
            `}
          >
            <input
              type="radio"
              name="stockDeductionMode"
              value="immediate"
              checked={mode === 'immediate'}
              onChange={(e) => setMode(e.target.value as StockDeductionMode)}
              className="mt-1 w-4 h-4 text-gray-500 focus:ring-gray-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-stone-100 mb-1">
                {t('settings.immediateMode') || 'Immediate Deduction'}
              </div>
              <div className="text-sm text-gray-600 dark:text-stone-300">
                {t('settings.immediateModeDesc') ||
                  'Stock is deducted immediately when production is logged. This reserves ingredients and prevents over-allocation.'}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-stone-400">
                {t('settings.recommended') || 'Recommended for most bakeries'}
              </div>
            </div>
          </label>

          {/* Deferred Mode */}
          <label
            className={`
              flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${
                mode === 'deferred'
                  ? 'border-gray-900 bg-gray-100 dark:bg-stone-700'
                  : 'border-gray-300 dark:border-stone-600 hover:border-gray-400'
              }
            `}
          >
            <input
              type="radio"
              name="stockDeductionMode"
              value="deferred"
              checked={mode === 'deferred'}
              onChange={(e) => setMode(e.target.value as StockDeductionMode)}
              className="mt-1 w-4 h-4 text-gray-500 focus:ring-gray-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-stone-100 mb-1">
                {t('settings.deferredMode') || 'Deferred Deduction'}
              </div>
              <div className="text-sm text-gray-600 dark:text-stone-300">
                {t('settings.deferredModeDesc') ||
                  'Stock is only deducted when production status is marked as Complete. This allows planning without committing inventory.'}
              </div>
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {t('settings.advanced') || 'Advanced: Requires careful stock monitoring'}
              </div>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="
              inline-flex items-center gap-2 px-4 py-2
              bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl
              hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.saving') || 'Saving...'}
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5" />
                {t('common.saved') || 'Saved!'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('common.save') || 'Save Changes'}
              </>
            )}
          </button>

          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              {t('settings.settingsSaved') || 'Settings saved successfully'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
