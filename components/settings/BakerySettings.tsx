'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'

type StockDeductionMode = 'immediate' | 'deferred'

export function BakerySettings() {
  const { t } = useLocale()
  const { currentBakery } = useBakery()
  const [mode, setMode] = useState<StockDeductionMode>('immediate')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      if (!currentBakery) return

      try {
        setLoading(true)
        const response = await fetch(`/api/bakery/settings?bakeryId=${currentBakery.id}`)
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
  }, [currentBakery])

  const handleSave = async () => {
    if (!currentBakery) return

    try {
      setSaving(true)
      setError(null)
      setSaved(false)

      const response = await fetch('/api/bakery/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bakeryId: currentBakery.id,
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
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
        <h2
          className="text-xl font-semibold text-terracotta-900 dark:text-cream-100 mb-4"
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        >
          {t('settings.stockDeduction') || 'Stock Deduction Settings'}
        </h2>

        <p className="text-sm text-terracotta-600 dark:text-cream-300 mb-6">
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
                  ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20'
                  : 'border-terracotta-200 dark:border-dark-600 hover:border-terracotta-300'
              }
            `}
          >
            <input
              type="radio"
              name="stockDeductionMode"
              value="immediate"
              checked={mode === 'immediate'}
              onChange={(e) => setMode(e.target.value as StockDeductionMode)}
              className="mt-1 w-4 h-4 text-terracotta-500 focus:ring-terracotta-500"
            />
            <div className="flex-1">
              <div className="font-medium text-terracotta-900 dark:text-cream-100 mb-1">
                {t('settings.immediateMode') || 'Immediate Deduction'}
              </div>
              <div className="text-sm text-terracotta-600 dark:text-cream-300">
                {t('settings.immediateModeDesc') ||
                  'Stock is deducted immediately when production is logged. This reserves ingredients and prevents over-allocation.'}
              </div>
              <div className="mt-2 text-xs text-terracotta-500 dark:text-terracotta-400">
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
                  ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20'
                  : 'border-terracotta-200 dark:border-dark-600 hover:border-terracotta-300'
              }
            `}
          >
            <input
              type="radio"
              name="stockDeductionMode"
              value="deferred"
              checked={mode === 'deferred'}
              onChange={(e) => setMode(e.target.value as StockDeductionMode)}
              className="mt-1 w-4 h-4 text-terracotta-500 focus:ring-terracotta-500"
            />
            <div className="flex-1">
              <div className="font-medium text-terracotta-900 dark:text-cream-100 mb-1">
                {t('settings.deferredMode') || 'Deferred Deduction'}
              </div>
              <div className="text-sm text-terracotta-600 dark:text-cream-300">
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
              bg-terracotta-500 text-white rounded-xl
              hover:bg-terracotta-600 transition-colors
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
