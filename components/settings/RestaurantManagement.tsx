'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  MapPin,
  X,
  Check,
  Building2,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  getRestaurantTypeIcon,
  getAllRestaurantTypes,
  type RestaurantType,
} from '@/config/restaurantTypes'

interface Restaurant {
  id: string
  name: string
  location: string | null
  isActive: boolean
  restaurantType: RestaurantType
}

interface NewRestaurantForm {
  name: string
  location: string
  restaurantType: RestaurantType
}

export function RestaurantManagement() {
  const { locale } = useLocale()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // Form states
  const [newRestaurant, setNewRestaurant] = useState<NewRestaurantForm>({
    name: '',
    location: '',
    restaurantType: 'Bakery',
  })
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const restaurantTypes = getAllRestaurantTypes()

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/restaurants/my-restaurants')
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data.restaurants || [])
      } else {
        setError(locale === 'fr' ? 'Échec du chargement' : 'Failed to load restaurants')
      }
    } catch {
      setError(locale === 'fr' ? 'Erreur de connexion' : 'Connection error')
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // Toggle active status
  const handleToggleActive = async (restaurant: Restaurant) => {
    const newStatus = !restaurant.isActive
    setTogglingId(restaurant.id)

    // Optimistic update
    setRestaurants(prev =>
      prev.map(r => (r.id === restaurant.id ? { ...r, isActive: newStatus } : r))
    )

    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
        setRestaurants(prev =>
          prev.map(r => (r.id === restaurant.id ? { ...r, isActive: !newStatus } : r))
        )
      } else {
        // Refresh global restaurant context
        // Page will auto-refresh on navigation - context updates on next load
      }
    } catch {
      // Revert on error
      setRestaurants(prev =>
        prev.map(r => (r.id === restaurant.id ? { ...r, isActive: !newStatus } : r))
      )
    } finally {
      setTogglingId(null)
    }
  }

  // Add restaurant
  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRestaurant.name.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRestaurant.name.trim(),
          location: newRestaurant.location.trim() || null,
          restaurantType: newRestaurant.restaurantType,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setNewRestaurant({ name: '', location: '', restaurantType: 'Bakery' })
        await fetchRestaurants()
        // Page will auto-refresh on navigation - context updates on next load
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add restaurant')
      }
    } catch {
      setError(locale === 'fr' ? 'Erreur de connexion' : 'Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete restaurant (soft delete)
  const handleDeleteRestaurant = async () => {
    if (!restaurantToDelete || deleteConfirmName !== restaurantToDelete.name) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setRestaurantToDelete(null)
        setDeleteConfirmName('')
        await fetchRestaurants()
        // Page will auto-refresh on navigation - context updates on next load
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete restaurant')
      }
    } catch {
      setError(locale === 'fr' ? 'Erreur de connexion' : 'Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteModal = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant)
    setDeleteConfirmName('')
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className="
        bg-gray-100 dark:bg-stone-800
        rounded-2xl shadow p-8
        min-h-[400px]
        flex items-center justify-center
      ">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <>
      <div className="bg-gray-100 dark:bg-stone-800 rounded-2xl shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-stone-600">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-semibold text-gray-900 dark:text-stone-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {locale === 'fr' ? 'Gérer les restaurants' : 'Manage Restaurants'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-stone-300 mt-1">
                {locale === 'fr'
                  ? `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} configuré${restaurants.length !== 1 ? 's' : ''}`
                  : `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} configured`
                }
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="
                inline-flex items-center gap-2 px-4 py-2.5
                bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl
                hover:bg-gray-800 dark:hover:bg-gray-100
                transition-all duration-200
                shadow-md shadow-gray-500/20
                hover:shadow-lg hover:shadow-gray-500/30
                hover:-translate-y-0.5
              "
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">
                {locale === 'fr' ? 'Ajouter' : 'Add Restaurant'}
              </span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Restaurant List */}
        <div className="p-6">
          {restaurants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 dark:text-stone-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-stone-300">
                {locale === 'fr'
                  ? 'Aucun restaurant configuré'
                  : 'No restaurants configured yet'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-gray-700 hover:text-gray-900 dark:text-stone-300 dark:hover:text-stone-100 font-medium"
              >
                {locale === 'fr' ? 'Ajouter votre premier restaurant' : 'Add your first restaurant'}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant, index) => {
                const TypeIcon = getRestaurantTypeIcon(restaurant.restaurantType)
                const typeConfig = restaurantTypes.find(t => t.type === restaurant.restaurantType)

                return (
                  <div
                    key={restaurant.id}
                    className="
                      group relative
                      bg-white dark:bg-stone-700
                      rounded-xl p-5
                      border-2 border-transparent
                      hover:border-gray-200 dark:hover:border-stone-500
                      transition-all duration-300
                      hover:shadow-lg hover:-translate-y-1
                    "
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Status indicator bar */}
                    <div
                      className={`
                        absolute top-0 left-4 right-4 h-1 rounded-b-full
                        transition-colors duration-300
                        ${restaurant.isActive
                          ? 'bg-green-500'
                          : 'bg-amber-400'
                        }
                      `}
                    />

                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4 mt-2">
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${restaurant.isActive
                            ? 'bg-gray-200 dark:bg-stone-600 text-gray-700 dark:text-stone-200'
                            : 'bg-gray-100 dark:bg-stone-600 text-gray-400 dark:text-gray-500'
                          }
                          transition-colors duration-300
                        `}
                      >
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          font-semibold truncate
                          ${restaurant.isActive
                            ? 'text-gray-900 dark:text-stone-100'
                            : 'text-gray-500 dark:text-gray-400'
                          }
                          transition-colors duration-300
                        `}>
                          {restaurant.name}
                        </h3>
                        {restaurant.location && (
                          <p className="text-sm text-gray-500 dark:text-stone-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {restaurant.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="
                        inline-flex items-center gap-1.5 px-2.5 py-1
                        text-xs font-medium rounded-full
                        bg-gray-200 dark:bg-stone-600
                        text-gray-700 dark:text-stone-300
                      ">
                        <TypeIcon className="w-3 h-3" />
                        {locale === 'fr' ? typeConfig?.labelFr : typeConfig?.labelEn}
                      </span>
                      <span
                        className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1
                          text-xs font-medium rounded-full
                          ${restaurant.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }
                        `}
                      >
                        {restaurant.isActive
                          ? (locale === 'fr' ? 'Actif' : 'Active')
                          : (locale === 'fr' ? 'Inactif' : 'Inactive')
                        }
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-stone-600">
                      {/* Toggle switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restaurant.isActive}
                          onChange={() => handleToggleActive(restaurant)}
                          disabled={togglingId === restaurant.id}
                          className="sr-only peer"
                        />
                        <div className={`
                          w-11 h-6 rounded-full
                          bg-gray-200 dark:bg-stone-600
                          peer-checked:bg-green-500
                          peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800
                          after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                          after:bg-white after:rounded-full after:h-5 after:w-5
                          after:transition-all after:duration-300
                          peer-checked:after:translate-x-full
                          ${togglingId === restaurant.id ? 'opacity-50' : ''}
                          transition-colors duration-300
                        `} />
                        {togglingId === restaurant.id && (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500 ml-2" />
                        )}
                      </label>

                      {/* Delete button */}
                      <button
                        onClick={() => openDeleteModal(restaurant)}
                        className="
                          p-2 rounded-lg
                          text-gray-400 hover:text-red-500
                          hover:bg-red-50 dark:hover:bg-red-900/20
                          transition-all duration-200
                          opacity-0 group-hover:opacity-100
                        "
                        title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="
            relative w-full max-w-md
            bg-white dark:bg-stone-800
            rounded-2xl shadow-2xl
            animate-fade-in-up
          ">
            <div className="p-6 border-b border-gray-200 dark:border-stone-600">
              <h3
                className="text-xl font-semibold text-gray-900 dark:text-stone-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {locale === 'fr' ? 'Ajouter un restaurant' : 'Add Restaurant'}
              </h3>
            </div>

            <form onSubmit={handleAddRestaurant} className="p-6 space-y-5">
              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {locale === 'fr' ? 'Nom du restaurant' : 'Restaurant Name'} *
                </label>
                <input
                  type="text"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                  className="
                    w-full px-4 py-3 rounded-xl
                    border border-gray-300 dark:border-stone-600
                    bg-white dark:bg-stone-700
                    text-gray-900 dark:text-stone-100
                    focus:ring-2 focus:ring-gray-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder={locale === 'fr' ? 'Ex: Boulangerie Centrale' : 'e.g., Central Bakery'}
                  required
                />
              </div>

              {/* Location field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {locale === 'fr' ? 'Emplacement' : 'Location'}
                </label>
                <input
                  type="text"
                  value={newRestaurant.location}
                  onChange={(e) => setNewRestaurant(prev => ({ ...prev, location: e.target.value }))}
                  className="
                    w-full px-4 py-3 rounded-xl
                    border border-gray-300 dark:border-stone-600
                    bg-white dark:bg-stone-700
                    text-gray-900 dark:text-stone-100
                    focus:ring-2 focus:ring-gray-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder={locale === 'fr' ? 'Ex: Conakry - Centre' : 'e.g., Downtown'}
                />
              </div>

              {/* Restaurant type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {locale === 'fr' ? 'Type de restaurant' : 'Restaurant Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {restaurantTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = newRestaurant.restaurantType === type.type

                    return (
                      <button
                        key={type.type}
                        type="button"
                        onClick={() => setNewRestaurant(prev => ({ ...prev, restaurantType: type.type }))}
                        className={`
                          flex items-center gap-2 p-3 rounded-xl
                          border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-gray-900 bg-gray-100 dark:bg-stone-700'
                            : 'border-gray-300 dark:border-stone-600 hover:border-gray-400'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-gray-700' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 dark:text-stone-100' : 'text-gray-600 dark:text-stone-300'}`}>
                          {locale === 'fr' ? type.labelFr : type.labelEn}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-gray-700 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    border border-gray-300 dark:border-stone-600
                    text-gray-700 dark:text-stone-200
                    hover:bg-gray-100 dark:hover:bg-stone-700
                    font-medium transition-colors duration-200
                  "
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newRestaurant.name.trim()}
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    bg-gray-900 dark:bg-white text-white dark:text-gray-900
                    hover:bg-gray-800 dark:hover:bg-gray-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-medium transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      {locale === 'fr' ? 'Ajouter' : 'Add'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && restaurantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false)
              setRestaurantToDelete(null)
              setDeleteConfirmName('')
            }}
          />
          <div className="
            relative w-full max-w-md
            bg-white dark:bg-stone-800
            rounded-2xl shadow-2xl
            animate-fade-in-up
            border-2 border-red-200 dark:border-red-900/50
          ">
            {/* Danger header */}
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-t-2xl border-b border-red-200 dark:border-red-900/30">
              <div className="flex items-center gap-3">
                <div className="
                  w-12 h-12 rounded-full
                  bg-red-100 dark:bg-red-900/40
                  flex items-center justify-center
                ">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold text-red-900 dark:text-red-100"
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  >
                    {locale === 'fr' ? 'Supprimer le restaurant' : 'Delete Restaurant'}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {locale === 'fr' ? 'Cette action est irréversible' : 'This action cannot be undone'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Restaurant info */}
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-stone-700 border border-gray-200 dark:border-stone-600">
                <p className="text-sm text-gray-600 dark:text-stone-300 mb-1">
                  {locale === 'fr' ? 'Restaurant à supprimer:' : 'Restaurant to delete:'}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-stone-100">
                  {restaurantToDelete.name}
                </p>
                {restaurantToDelete.location && (
                  <p className="text-sm text-gray-500 dark:text-stone-400">
                    {restaurantToDelete.location}
                  </p>
                )}
              </div>

              {/* Warning message */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {locale === 'fr'
                    ? 'Les données du restaurant seront archivées et pourront être restaurées si nécessaire. Toutes les ventes, dépenses et stocks associés seront conservés.'
                    : 'Restaurant data will be archived and can be restored if needed. All associated sales, expenses, and inventory will be preserved.'
                  }
                </p>
              </div>

              {/* Confirmation input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {locale === 'fr'
                    ? `Tapez "${restaurantToDelete.name}" pour confirmer`
                    : `Type "${restaurantToDelete.name}" to confirm`
                  }
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl
                    border border-red-200 dark:border-red-900/50
                    bg-white dark:bg-stone-700
                    text-gray-900 dark:text-stone-100
                    focus:ring-2 focus:ring-red-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder={restaurantToDelete.name}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setRestaurantToDelete(null)
                    setDeleteConfirmName('')
                  }}
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    border border-gray-300 dark:border-stone-600
                    text-gray-700 dark:text-stone-200
                    hover:bg-gray-100 dark:hover:bg-stone-700
                    font-medium transition-colors duration-200
                  "
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteRestaurant}
                  disabled={submitting || deleteConfirmName !== restaurantToDelete.name}
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    bg-red-600 text-white
                    hover:bg-red-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-medium transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      {locale === 'fr' ? 'Supprimer' : 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
