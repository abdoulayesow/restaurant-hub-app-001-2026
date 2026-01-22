'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, Store, Package, ChefHat, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import {
  getAllRestaurantTypes,
  type RestaurantType,
} from '@/config/restaurantTypes'

interface RestaurantTypeSettingsState {
  restaurantType: RestaurantType
  inventoryEnabled: boolean
  productionEnabled: boolean
}

export function RestaurantTypeSettings() {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [settings, setSettings] = useState<RestaurantTypeSettingsState>({
    restaurantType: 'Bakery',
    inventoryEnabled: true,
    productionEnabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restaurantTypes = getAllRestaurantTypes()

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      if (!currentRestaurant) return

      try {
        setLoading(true)
        const response = await fetch(`/api/restaurants/${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          const restaurant = data.restaurant
          setSettings({
            restaurantType: restaurant.restaurantType || 'Bakery',
            inventoryEnabled: restaurant.inventoryEnabled ?? true,
            productionEnabled: restaurant.productionEnabled ?? true,
          })
        } else {
          setError(t('errors.failedToLoad') || 'Failed to load settings')
        }
      } catch (err) {
        setError(t('errors.failedToLoad') || 'Failed to load settings')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [currentRestaurant, t])

  const handleSave = async () => {
    if (!currentRestaurant) return

    try {
      setSaving(true)
      setError(null)
      setSaved(false)

      const response = await fetch(`/api/restaurants/${currentRestaurant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // Reload page to refresh restaurant context with new settings
        window.location.reload()
      } else {
        const data = await response.json()
        setError(data.error || t('errors.failedToSave') || 'Failed to save settings')
      }
    } catch (err) {
      setError(t('errors.failedToSave') || 'Failed to save settings')
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
    <div className="max-w-4xl">
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-6 grain-overlay">
        <h2
          className="text-xl font-semibold text-terracotta-900 dark:text-cream-100 mb-2"
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        >
          {t('settings.restaurantType') || 'Restaurant Type & Features'}
        </h2>
        <p className="text-sm text-terracotta-600 dark:text-cream-300 mb-6">
          {t('settings.restaurantTypeDesc') || 'Configure your restaurant type and enabled features.'}
        </p>

        <div className="space-y-6">
          {/* Restaurant Type Selection */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-terracotta-800 dark:text-cream-200 mb-4">
              <Store className="w-5 h-5" />
              {t('settings.restaurantTypeLabel') || 'Restaurant Type'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {restaurantTypes.map((typeConfig) => {
                const Icon = typeConfig.icon
                const isSelected = settings.restaurantType === typeConfig.type
                return (
                  <button
                    key={typeConfig.type}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, restaurantType: typeConfig.type }))}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected
                        ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20'
                        : 'border-terracotta-200 dark:border-dark-600 hover:border-terracotta-300 dark:hover:border-dark-500'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isSelected
                          ? 'bg-terracotta-500 text-white'
                          : 'bg-cream-200 dark:bg-dark-700 text-terracotta-600 dark:text-cream-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-terracotta-900 dark:text-cream-100' : 'text-terracotta-700 dark:text-cream-200'}`}>
                        {locale === 'fr' ? typeConfig.labelFr : typeConfig.labelEn}
                      </div>
                      <div className="text-xs text-terracotta-500 dark:text-cream-400">
                        {locale === 'fr' ? typeConfig.descriptionFr : typeConfig.descriptionEn}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-terracotta-500 ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-terracotta-800 dark:text-cream-200 mb-4">
              <Package className="w-5 h-5" />
              {t('settings.featureToggles') || 'Feature Settings'}
            </h3>
            <div className="space-y-4">
              {/* Inventory Toggle */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 dark:bg-dark-700">
                <div className="flex-shrink-0">
                  <Package className="w-6 h-6 text-terracotta-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="inventoryEnabled"
                        className="font-medium text-terracotta-900 dark:text-cream-100"
                      >
                        {t('settings.inventoryEnabled') || 'Inventory Management'}
                      </label>
                      <p className="text-sm text-terracotta-600 dark:text-cream-300 mt-0.5">
                        {t('settings.inventoryEnabledDesc') || 'Track inventory items, stock levels, and movements'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="inventoryEnabled"
                        checked={settings.inventoryEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, inventoryEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-cream-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-terracotta-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Production Toggle */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 dark:bg-dark-700">
                <div className="flex-shrink-0">
                  <ChefHat className="w-6 h-6 text-terracotta-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="productionEnabled"
                        className="font-medium text-terracotta-900 dark:text-cream-100"
                      >
                        {t('settings.productionEnabled') || 'Production Tracking'}
                      </label>
                      <p className="text-sm text-terracotta-600 dark:text-cream-300 mt-0.5">
                        {t('settings.productionEnabledDesc') || 'Log daily production and track ingredient usage'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="productionEnabled"
                        checked={settings.productionEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, productionEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-cream-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-terracotta-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Warning message when features are disabled */}
              {(!settings.inventoryEnabled || !settings.productionEnabled) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('settings.featureDisabledWarning') || 'Disabled features will be hidden from the navigation menu. You can re-enable them at any time.'}
                  </p>
                </div>
              )}
            </div>
          </div>
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
