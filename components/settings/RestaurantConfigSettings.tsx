'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, Building2, MapPin, Calendar, DollarSign, Phone, Mail, User } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

interface RestaurantConfig {
  name: string
  location: string
  openingDate: string
  trackingStartDate: string
  initialCapital: number
  initialCashBalance: number
  initialOrangeBalance: number
  initialCardBalance: number
  contactPhone: string
  contactEmail: string
  managerName: string
  currency: string
}

export function RestaurantConfigSettings() {
  const { t } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [config, setConfig] = useState<RestaurantConfig>({
    name: '',
    location: '',
    openingDate: '',
    trackingStartDate: '',
    initialCapital: 0,
    initialCashBalance: 0,
    initialOrangeBalance: 0,
    initialCardBalance: 0,
    contactPhone: '',
    contactEmail: '',
    managerName: '',
    currency: 'GNF'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch current restaurant config
  useEffect(() => {
    async function fetchConfig() {
      if (!currentRestaurant) return

      try {
        setLoading(true)
        const response = await fetch(`/api/restaurants/${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          const restaurant = data.restaurant
          setConfig({
            name: restaurant.name || '',
            location: restaurant.location || '',
            openingDate: restaurant.openingDate ? restaurant.openingDate.split('T')[0] : '',
            trackingStartDate: restaurant.trackingStartDate ? restaurant.trackingStartDate.split('T')[0] : '',
            initialCapital: restaurant.initialCapital || 0,
            initialCashBalance: restaurant.initialCashBalance || 0,
            initialOrangeBalance: restaurant.initialOrangeBalance || 0,
            initialCardBalance: restaurant.initialCardBalance || 0,
            contactPhone: restaurant.contactPhone || '',
            contactEmail: restaurant.contactEmail || '',
            managerName: restaurant.managerName || '',
            currency: restaurant.currency || 'GNF'
          })
        } else {
          setError(t('errors.failedToLoad') || 'Failed to load restaurant configuration')
        }
      } catch (err) {
        setError(t('errors.failedToLoad') || 'Failed to load restaurant configuration')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [currentRestaurant, t])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!config.name.trim()) {
      newErrors.name = t('errors.restaurantNameRequired') || 'Restaurant name is required'
    }

    if (config.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail)) {
      newErrors.contactEmail = t('errors.invalidEmail') || 'Invalid email format'
    }

    if (config.initialCapital < 0) {
      newErrors.initialCapital = t('errors.mustBePositive') || 'Must be positive'
    }

    if (config.initialCashBalance < 0) {
      newErrors.initialCashBalance = t('errors.mustBePositive') || 'Must be positive'
    }

    if (config.initialOrangeBalance < 0) {
      newErrors.initialOrangeBalance = t('errors.mustBePositive') || 'Must be positive'
    }

    if (config.initialCardBalance < 0) {
      newErrors.initialCardBalance = t('errors.mustBePositive') || 'Must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!currentRestaurant || !validate()) return

    try {
      setSaving(true)
      setError(null)
      setSaved(false)

      const response = await fetch(`/api/restaurants/${currentRestaurant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || t('errors.failedToSave') || 'Failed to save configuration')
      }
    } catch (err) {
      setError(t('errors.failedToSave') || 'Failed to save configuration')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof RestaurantConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
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
    <div className="max-w-4xl">
      <div className="bg-gray-100 dark:bg-stone-800 rounded-2xl shadow p-6">
        <h2
          className="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-2"
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        >
          {t('settings.bakeryConfig') || 'Bakery Configuration'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-stone-300 mb-6">
          {t('settings.bakeryConfigDesc') || 'Configure basic information, financial settings, and contact details for this bakery.'}
        </p>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-800 dark:text-stone-200 mb-4">
              <Building2 className="w-5 h-5" />
              {t('settings.basicInfo') || 'Basic Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  {t('settings.bakeryName') || 'Bakery Name'} *
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="Boulangerie Centrale"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {t('settings.location') || 'Location'}
                </label>
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                  placeholder="Conakry - Centre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('settings.openingDate') || 'Opening Date'}
                </label>
                <input
                  type="date"
                  value={config.openingDate}
                  onChange={(e) => handleChange('openingDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('settings.trackingStartDate') || 'Tracking Start Date'}
                </label>
                <input
                  type="date"
                  value={config.trackingStartDate}
                  onChange={(e) => handleChange('trackingStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Financial Configuration */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-800 dark:text-stone-200 mb-4">
              <DollarSign className="w-5 h-5" />
              {t('settings.financialConfig') || 'Financial Configuration'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  {t('settings.initialCapital') || 'Initial Capital'} (GNF)
                </label>
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => handleChange('initialCapital', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialCapital
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="50000000"
                  min="0"
                />
                {errors.initialCapital && (
                  <p className="mt-1 text-sm text-red-500">{errors.initialCapital}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  {t('settings.initialCashBalance') || 'Initial Cash Balance'} (GNF)
                </label>
                <input
                  type="number"
                  value={config.initialCashBalance}
                  onChange={(e) => handleChange('initialCashBalance', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialCashBalance
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="10000000"
                  min="0"
                />
                {errors.initialCashBalance && (
                  <p className="mt-1 text-sm text-red-500">{errors.initialCashBalance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  {t('settings.initialOrangeBalance') || 'Initial Orange Money Balance'} (GNF)
                </label>
                <input
                  type="number"
                  value={config.initialOrangeBalance}
                  onChange={(e) => handleChange('initialOrangeBalance', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialOrangeBalance
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="5000000"
                  min="0"
                />
                {errors.initialOrangeBalance && (
                  <p className="mt-1 text-sm text-red-500">{errors.initialOrangeBalance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  {t('settings.initialCardBalance') || 'Initial Card Balance'} (GNF)
                </label>
                <input
                  type="number"
                  value={config.initialCardBalance}
                  onChange={(e) => handleChange('initialCardBalance', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialCardBalance
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.initialCardBalance && (
                  <p className="mt-1 text-sm text-red-500">{errors.initialCardBalance}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-800 dark:text-stone-200 mb-4">
              <Phone className="w-5 h-5" />
              {t('settings.contactInfo') || 'Contact Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  {t('settings.contactPhone') || 'Contact Phone'}
                </label>
                <input
                  type="tel"
                  value={config.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                  placeholder="+224 XXX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  {t('settings.contactEmail') || 'Contact Email'}
                </label>
                <input
                  type="email"
                  value={config.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.contactEmail
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="contact@bakery.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  {t('settings.managerName') || 'Manager Name'}
                </label>
                <input
                  type="text"
                  value={config.managerName}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                  placeholder="Fatoumata Camara"
                />
              </div>
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
              {t('settings.settingsSaved') || 'Configuration saved successfully'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
