'use client'

import { useState, useEffect } from 'react'
import {
  Save,
  Loader2,
  Check,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  User,
  Store,
  Package,
  ChefHat,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import {
  getAllRestaurantTypes,
  type RestaurantType,
} from '@/config/restaurantTypes'

type SectionId = 'type' | 'basic' | 'financial' | 'contact'

interface SectionHeaderProps {
  id: SectionId
  icon: React.ElementType
  title: string
  description: string
  isExpanded: boolean
  onToggle: () => void
}

function SectionHeader({
  id,
  icon: Icon,
  title,
  description,
  isExpanded,
  onToggle
}: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={`section-${id}-content`}
      className="w-full flex items-center justify-between p-4 -m-4 mb-0 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center group-hover:bg-stone-300 dark:group-hover:bg-stone-600 transition-colors">
          <Icon className="w-5 h-5 text-stone-700 dark:text-stone-300" />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {description}
          </p>
        </div>
      </div>
      <div className="p-2 rounded-lg group-hover:bg-stone-200 dark:group-hover:bg-stone-600 transition-colors">
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-stone-500 dark:text-stone-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-500 dark:text-stone-400" />
        )}
      </div>
    </button>
  )
}

interface BakeryProfile {
  // Type settings
  restaurantType: RestaurantType
  inventoryEnabled: boolean
  productionEnabled: boolean
  // Basic info
  name: string
  location: string
  openingDate: string
  trackingStartDate: string
  // Financial
  initialCapital: number
  initialCashBalance: number
  initialOrangeBalance: number
  initialCardBalance: number
  // Contact
  contactPhone: string
  contactEmail: string
  managerName: string
  currency: string
}

export function BakeryProfileSettings() {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const restaurantTypes = getAllRestaurantTypes()

  const [profile, setProfile] = useState<BakeryProfile>({
    restaurantType: 'Bakery',
    inventoryEnabled: true,
    productionEnabled: true,
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
    currency: 'GNF',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Collapsible sections - all expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['type', 'basic', 'financial', 'contact'])
  )

  const toggleSection = (section: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Fetch current settings
  useEffect(() => {
    async function fetchProfile() {
      if (!currentRestaurant) return

      try {
        setLoading(true)
        const response = await fetch(`/api/restaurants/${currentRestaurant.id}`)
        if (response.ok) {
          const data = await response.json()
          const restaurant = data.restaurant
          setProfile({
            restaurantType: restaurant.restaurantType || 'Bakery',
            inventoryEnabled: restaurant.inventoryEnabled ?? true,
            productionEnabled: restaurant.productionEnabled ?? true,
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
            currency: restaurant.currency || 'GNF',
          })
        } else {
          setError(t('errors.failedToLoad') || 'Failed to load profile')
        }
      } catch (err) {
        setError(t('errors.failedToLoad') || 'Failed to load profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [currentRestaurant, t])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!profile.name.trim()) {
      newErrors.name = t('errors.restaurantNameRequired') || 'Restaurant name is required'
    }

    if (profile.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contactEmail)) {
      newErrors.contactEmail = t('errors.invalidEmail') || 'Invalid email format'
    }

    if (profile.initialCapital < 0) {
      newErrors.initialCapital = t('errors.mustBePositive') || 'Must be positive'
    }

    if (profile.initialCashBalance < 0) {
      newErrors.initialCashBalance = t('errors.mustBePositive') || 'Must be positive'
    }

    if (profile.initialOrangeBalance < 0) {
      newErrors.initialOrangeBalance = t('errors.mustBePositive') || 'Must be positive'
    }

    if (profile.initialCardBalance < 0) {
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
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // Reload to refresh restaurant context if type/features changed
        if (profile.restaurantType !== currentRestaurant.restaurantType ||
            profile.inventoryEnabled !== currentRestaurant.inventoryEnabled ||
            profile.productionEnabled !== currentRestaurant.productionEnabled) {
          window.location.reload()
        }
      } else {
        const data = await response.json()
        setError(data.error || t('errors.failedToSave') || 'Failed to save profile')
      }
    } catch (err) {
      setError(t('errors.failedToSave') || 'Failed to save profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof BakeryProfile, value: string | number | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }))
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
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Context Banner - Shows which restaurant is being configured */}
      <div className="bg-gradient-to-r from-stone-100 to-stone-50 dark:from-stone-800 dark:to-stone-800/50 rounded-2xl p-4 border border-stone-200 dark:border-stone-700 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-stone-900 dark:bg-white flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-white dark:text-stone-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            {t('settings.configuring') || (locale === 'fr' ? 'Configuration de' : 'Configuring')}
          </p>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
            {profile.name || currentRestaurant?.name || t('settings.defaultBakeryName') || (locale === 'fr' ? 'Boulangerie' : 'Bakery')}
          </h2>
          {profile.location && (
            <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.location}
            </p>
          )}
        </div>
      </div>

      {/* Type & Features Section */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 transition-all duration-300">
        <SectionHeader
          id="type"
          icon={Store}
          title={t('settings.restaurantType') || (locale === 'fr' ? 'Type & Fonctionnalités' : 'Type & Features')}
          description={t('settings.restaurantTypeDesc') || (locale === 'fr' ? 'Type de restaurant et modules activés' : 'Restaurant type and enabled modules')}
          isExpanded={expandedSections.has('type')}
          onToggle={() => toggleSection('type')}
        />

        {expandedSections.has('type') && (
          <div id="section-type-content" className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-700 space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* Restaurant Type Selection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-3">
                {t('settings.restaurantTypeLabel') || (locale === 'fr' ? 'Type de restaurant' : 'Restaurant Type')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restaurantTypes.map((typeConfig) => {
                  const Icon = typeConfig.icon
                  const isSelected = profile.restaurantType === typeConfig.type
                  return (
                    <button
                      key={typeConfig.type}
                      type="button"
                      onClick={() => handleChange('restaurantType', typeConfig.type)}
                      className={`
                        flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected
                          ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-700'
                          : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                        }
                      `}
                    >
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isSelected
                            ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isSelected ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-200'}`}>
                          {locale === 'fr' ? typeConfig.labelFr : typeConfig.labelEn}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {locale === 'fr' ? typeConfig.descriptionFr : typeConfig.descriptionEn}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-stone-900 dark:text-white flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                {t('settings.featureToggles') || (locale === 'fr' ? 'Modules activés' : 'Enabled Features')}
              </label>

              {/* Inventory Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-100 dark:border-stone-600">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t('settings.inventoryEnabled') || (locale === 'fr' ? 'Gestion des stocks' : 'Inventory Management')}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('settings.inventoryEnabledDesc') || (locale === 'fr' ? 'Suivi des ingrédients et niveaux de stock' : 'Track ingredients and stock levels')}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.inventoryEnabled}
                    onChange={(e) => handleChange('inventoryEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 dark:bg-stone-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors" />
                </label>
              </div>

              {/* Production Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-100 dark:border-stone-600">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t('settings.productionEnabled') || (locale === 'fr' ? 'Suivi de production' : 'Production Tracking')}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('settings.productionEnabledDesc') || (locale === 'fr' ? 'Journaux de production quotidiens' : 'Daily production logs')}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.productionEnabled}
                    onChange={(e) => handleChange('productionEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 dark:bg-stone-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors" />
                </label>
              </div>

              {/* Warning when features disabled */}
              {(!profile.inventoryEnabled || !profile.productionEnabled) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('settings.featureDisabledWarning') || (locale === 'fr'
                      ? 'Les modules désactivés seront masqués du menu de navigation.'
                      : 'Disabled features will be hidden from the navigation menu.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Basic Information Section */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 transition-all duration-300">
        <SectionHeader
          id="basic"
          icon={Building2}
          title={t('settings.basicInfo') || (locale === 'fr' ? 'Informations générales' : 'Basic Information')}
          description={t('settings.basicInfoDesc') || (locale === 'fr' ? 'Nom, emplacement et dates clés' : 'Name, location and key dates')}
          isExpanded={expandedSections.has('basic')}
          onToggle={() => toggleSection('basic')}
        />

        {expandedSections.has('basic') && (
          <div id="section-basic-content" className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-700 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  {t('settings.bakeryName') || (locale === 'fr' ? 'Nom de la boulangerie' : 'Bakery Name')} *
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="Boulangerie Centrale"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {t('settings.location') || (locale === 'fr' ? 'Emplacement' : 'Location')}
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                  placeholder="Conakry - Centre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('settings.openingDate') || (locale === 'fr' ? "Date d'ouverture" : 'Opening Date')}
                </label>
                <input
                  type="date"
                  value={profile.openingDate}
                  onChange={(e) => handleChange('openingDate', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('settings.trackingStartDate') || (locale === 'fr' ? 'Début du suivi' : 'Tracking Start Date')}
                </label>
                <input
                  type="date"
                  value={profile.trackingStartDate}
                  onChange={(e) => handleChange('trackingStartDate', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Configuration Section */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 transition-all duration-300">
        <SectionHeader
          id="financial"
          icon={DollarSign}
          title={t('settings.financialConfig') || (locale === 'fr' ? 'Configuration financière' : 'Financial Configuration')}
          description={t('settings.financialConfigDesc') || (locale === 'fr' ? 'Capital initial et soldes de départ' : 'Initial capital and starting balances')}
          isExpanded={expandedSections.has('financial')}
          onToggle={() => toggleSection('financial')}
        />

        {expandedSections.has('financial') && (
          <div id="section-financial-content" className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-700 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  {t('settings.initialCapital') || (locale === 'fr' ? 'Capital initial' : 'Initial Capital')} (GNF)
                </label>
                <input
                  type="number"
                  value={profile.initialCapital}
                  onChange={(e) => handleChange('initialCapital', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialCapital
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="50000000"
                  min="0"
                />
                {errors.initialCapital && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.initialCapital}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  {t('settings.initialCashBalance') || (locale === 'fr' ? 'Solde espèces initial' : 'Initial Cash Balance')} (GNF)
                </label>
                <input
                  type="number"
                  value={profile.initialCashBalance}
                  onChange={(e) => handleChange('initialCashBalance', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialCashBalance
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="10000000"
                  min="0"
                />
                {errors.initialCashBalance && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.initialCashBalance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  {t('settings.initialOrangeBalance') || (locale === 'fr' ? 'Solde Orange Money initial' : 'Initial Orange Money Balance')} (GNF)
                </label>
                <input
                  type="number"
                  value={profile.initialOrangeBalance}
                  onChange={(e) => handleChange('initialOrangeBalance', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialOrangeBalance
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="5000000"
                  min="0"
                />
                {errors.initialOrangeBalance && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.initialOrangeBalance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  {t('settings.initialCardBalance') || (locale === 'fr' ? 'Solde carte initial' : 'Initial Card Balance')} (GNF)
                </label>
                <input
                  type="number"
                  value={profile.initialCardBalance}
                  onChange={(e) => handleChange('initialCardBalance', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.initialCardBalance
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.initialCardBalance && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.initialCardBalance}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Information Section */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 transition-all duration-300">
        <SectionHeader
          id="contact"
          icon={Phone}
          title={t('settings.contactInfo') || (locale === 'fr' ? 'Informations de contact' : 'Contact Information')}
          description={t('settings.contactInfoDesc') || (locale === 'fr' ? 'Coordonnées du responsable' : 'Manager contact details')}
          isExpanded={expandedSections.has('contact')}
          onToggle={() => toggleSection('contact')}
        />

        {expandedSections.has('contact') && (
          <div id="section-contact-content" className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-700 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  <User className="w-4 h-4 inline mr-1" />
                  {t('settings.managerName') || (locale === 'fr' ? 'Nom du responsable' : 'Manager Name')}
                </label>
                <input
                  type="text"
                  value={profile.managerName}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                  placeholder="Fatoumata Camara"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  <Phone className="w-4 h-4 inline mr-1" />
                  {t('settings.contactPhone') || (locale === 'fr' ? 'Téléphone' : 'Phone')}
                </label>
                <input
                  type="tel"
                  value={profile.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors"
                  placeholder="+224 XXX XX XX XX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1" />
                  {t('settings.contactEmail') || 'Email'}
                </label>
                <input
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 transition-colors ${
                    errors.contactEmail
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                  placeholder="contact@bakery.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.contactEmail}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Sticky Save Bar */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between">
          <div className="text-sm text-stone-500 dark:text-stone-400">
            {saved ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {t('settings.settingsSaved') || (locale === 'fr' ? 'Profil enregistré' : 'Profile saved')}
              </span>
            ) : (
              <span>
                {t('settings.unsavedChanges') || (locale === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes')}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="
              inline-flex items-center gap-2 px-5 py-2.5
              bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl
              hover:bg-stone-800 dark:hover:bg-stone-100 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              font-medium shadow-sm
            "
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.saving') || (locale === 'fr' ? 'Enregistrement...' : 'Saving...')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('common.save') || (locale === 'fr' ? 'Enregistrer' : 'Save Changes')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
