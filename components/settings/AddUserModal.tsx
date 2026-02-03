'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { X, UserPlus, Loader2, Shield, Users, ChefHat, Wallet, Mail } from 'lucide-react'
import { getRoleDisplayName } from '@/lib/roles'
import { useLocale } from '@/components/providers/LocaleProvider'

type InviteMode = 'existing' | 'email'

interface User {
  id: string
  name: string | null
  email: string
}

interface AddUserModalProps {
  restaurantId: string
  availableUsers: User[]
  onClose: () => void
  onUserAdded: () => void
}

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  Owner: Shield,
  RestaurantManager: Users,
  Baker: ChefHat,
  PastryChef: ChefHat,
  Cashier: Wallet,
  Editor: Users,
  Manager: Shield,
}

const roleDescriptions: Record<UserRole, { en: string; fr: string }> = {
  Owner: {
    en: 'Full access to all pages (analytics, approvals, settings)',
    fr: 'Accès complet à toutes les pages (analytics, approbations, paramètres)',
  },
  RestaurantManager: {
    en: 'Can record production, sales, expenses via /editor',
    fr: 'Peut enregistrer la production, les ventes, les dépenses via /editor',
  },
  Baker: {
    en: 'Can record production only via /editor',
    fr: 'Peut enregistrer la production uniquement via /editor',
  },
  PastryChef: {
    en: 'Can record production only via /editor',
    fr: 'Peut enregistrer la production uniquement via /editor',
  },
  Cashier: {
    en: 'Can record sales and expenses only via /editor',
    fr: 'Peut enregistrer les ventes et dépenses uniquement via /editor',
  },
  Editor: { en: 'Legacy role', fr: 'Rôle hérité' },
  Manager: { en: 'Legacy role', fr: 'Rôle hérité' },
}

const roleOptionsToShow: UserRole[] = [
  'Owner',
  'RestaurantManager',
  'Baker',
  'PastryChef',
  'Cashier',
]

export function AddUserModal({
  restaurantId,
  availableUsers,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const { locale, t } = useLocale()
  const [inviteMode, setInviteMode] = useState<InviteMode>('existing')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('RestaurantManager')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation based on mode
    if (inviteMode === 'existing' && !selectedUserId) {
      setError(locale === 'fr' ? 'Veuillez sélectionner un utilisateur' : 'Please select a user')
      return
    }

    if (inviteMode === 'email') {
      if (!email.trim()) {
        setError(t('settings.restaurants.invalidEmail'))
        return
      }
      if (!validateEmail(email)) {
        setError(t('settings.restaurants.invalidEmail'))
        return
      }
    }

    setSubmitting(true)
    try {
      const requestBody = inviteMode === 'existing'
        ? { userId: selectedUserId, role: selectedRole }
        : { email: email.trim(), role: selectedRole }

      const response = await fetch(`/api/restaurants/${restaurantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        onUserAdded()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to assign user')
      }
    } catch {
      setError(locale === 'fr' ? 'Erreur de connexion' : 'Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="
        relative w-full max-w-2xl
        bg-white dark:bg-stone-800
        rounded-2xl shadow-2xl
        animate-fade-in-up
        max-h-[90vh] overflow-y-auto
      ">
        {/* Header */}
        <div className="sticky top-0 p-6 border-b border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-800 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h3
              className="text-xl font-semibold text-gray-900 dark:text-stone-100"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('settings.restaurants.addUser')}
            </h3>
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg
                text-gray-400 hover:text-gray-600
                hover:bg-gray-100 dark:hover:bg-stone-700
                transition-colors
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Mode selection tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-stone-700 rounded-xl">
            <button
              type="button"
              onClick={() => setInviteMode('existing')}
              className={`
                flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                flex items-center justify-center gap-2
                ${inviteMode === 'existing'
                  ? 'bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 shadow-sm'
                  : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
                }
              `}
            >
              <Users className="w-4 h-4" />
              {t('settings.restaurants.selectExistingUser')}
            </button>
            <button
              type="button"
              onClick={() => setInviteMode('email')}
              className={`
                flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                flex items-center justify-center gap-2
                ${inviteMode === 'email'
                  ? 'bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 shadow-sm'
                  : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
                }
              `}
            >
              <Mail className="w-4 h-4" />
              {t('settings.restaurants.inviteByEmail')}
            </button>
          </div>

          {/* User selection or Email input */}
          <div>
            {inviteMode === 'existing' ? (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {t('settings.restaurants.selectUser')} *
                </label>
                {availableUsers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                    {locale === 'fr'
                      ? 'Tous les utilisateurs sont déjà assignés à ce restaurant'
                      : 'All users are already assigned to this restaurant'}
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="
                        w-full px-4 py-3 rounded-xl
                        border border-gray-300 dark:border-stone-600
                        bg-white dark:bg-stone-700
                        text-gray-900 dark:text-stone-100
                        focus:ring-2 focus:ring-gray-500 focus:border-transparent
                        transition-all duration-200
                      "
                      required
                    >
                      <option value="">
                        {t('settings.restaurants.chooseUser')}
                      </option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email} ({user.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
                      {availableUsers.length} {t('settings.restaurants.usersAvailable')}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-2">
                  {t('settings.restaurants.emailAddress')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('settings.restaurants.enterEmail')}
                  className="
                    w-full px-4 py-3 rounded-xl
                    border border-gray-300 dark:border-stone-600
                    bg-white dark:bg-stone-700
                    text-gray-900 dark:text-stone-100
                    placeholder:text-gray-400 dark:placeholder:text-stone-500
                    focus:ring-2 focus:ring-gray-500 focus:border-transparent
                    transition-all duration-200
                  "
                  required
                />
                <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
                  {t('settings.restaurants.invitationNote')}
                </p>
              </>
            )}
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-stone-200 mb-3">
              {t('settings.restaurants.roleAtRestaurant')} *
            </label>
            <div className="grid gap-3">
              {roleOptionsToShow.map((role) => {
                const Icon = roleIcons[role]
                const isSelected = selectedRole === role
                const description = roleDescriptions[role]

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`
                      flex items-start gap-3 p-4 rounded-xl
                      border-2 transition-all duration-200 text-left
                      ${isSelected
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-stone-700'
                        : 'border-gray-300 dark:border-stone-600 hover:border-gray-400 dark:hover:border-stone-500'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isSelected
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-200 dark:bg-stone-600 text-gray-600 dark:text-stone-300'
                      }
                      transition-colors duration-200
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold mb-1 ${
                        isSelected
                          ? 'text-gray-900 dark:text-stone-100'
                          : 'text-gray-700 dark:text-stone-200'
                      }`}>
                        {getRoleDisplayName(role, locale)}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-stone-400">
                        {locale === 'fr' ? description.fr : description.en}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-stone-600">
            <button
              type="button"
              onClick={onClose}
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
              disabled={
                submitting ||
                (inviteMode === 'existing' && (!selectedUserId || availableUsers.length === 0)) ||
                (inviteMode === 'email' && !email.trim())
              }
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
                  <UserPlus className="w-5 h-5" />
                  {inviteMode === 'email'
                    ? t('settings.restaurants.inviteNewUser')
                    : t('settings.restaurants.assignUser')
                  }
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
