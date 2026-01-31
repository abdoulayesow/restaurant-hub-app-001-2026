'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2, UserPlus } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { RoleDropdown } from './RoleDropdown'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatDateForDisplay } from '@/lib/date-utils'

interface AssignedUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  assignedAt: Date
}

interface StaffTableProps {
  restaurantId: string
  users: AssignedUser[]
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>
  onRemoveUser: (userId: string) => Promise<void>
  onRefresh: () => void
}

export function StaffTable({
  restaurantId,
  users,
  onRoleChange,
  onRemoveUser,
  onRefresh,
}: StaffTableProps) {
  const { locale, t } = useLocale()
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [userToRemove, setUserToRemove] = useState<AssignedUser | null>(null)
  const [removing, setRemoving] = useState(false)

  const ownerCount = users.filter(u => u.role === 'Owner').length
  const isLastOwner = (user: AssignedUser) => user.role === 'Owner' && ownerCount === 1

  const handleRemoveClick = (user: AssignedUser) => {
    setUserToRemove(user)
    setShowRemoveModal(true)
  }

  const handleConfirmRemove = async () => {
    if (!userToRemove) return

    setRemoving(true)
    try {
      await onRemoveUser(userToRemove.id)
      setShowRemoveModal(false)
      setUserToRemove(null)
      onRefresh()
    } catch (error) {
      console.error('Failed to remove user:', error)
    } finally {
      setRemoving(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-stone-800 rounded-2xl shadow">
        <UserPlus className="w-12 h-12 text-gray-300 dark:text-stone-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-2">
          {locale === 'fr' ? 'Aucun membre du personnel' : 'No staff members'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-stone-400">
          {locale === 'fr'
            ? 'Ajoutez votre premier utilisateur pour commencer'
            : 'Add your first user to get started'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-stone-900 border-b border-gray-200 dark:border-stone-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'Utilisateur' : 'User'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'Email' : 'Email'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'Rôle' : 'Role'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                  {t('settings.restaurants.assignedOn')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors"
                >
                  {/* User */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="
                        w-10 h-10 rounded-full flex items-center justify-center
                        bg-gray-200 dark:bg-stone-600
                        text-gray-700 dark:text-stone-200
                        font-semibold text-sm
                      ">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || user.email}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          getInitials(user.name, user.email)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-stone-100">
                          {user.name || user.email.split('@')[0]}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-stone-400">
                    {user.email}
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleDropdown
                      restaurantId={restaurantId}
                      userId={user.id}
                      currentRole={user.role}
                      disabled={isLastOwner(user)}
                      onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
                    />
                  </td>

                  {/* Assigned On */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-stone-400">
                    {formatDateForDisplay(
                      user.assignedAt,
                      locale === 'fr' ? 'fr-FR' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleRemoveClick(user)}
                      disabled={isLastOwner(user)}
                      className={`
                        p-2 rounded-lg
                        transition-all duration-200
                        ${isLastOwner(user)
                          ? 'text-gray-300 dark:text-stone-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }
                      `}
                      title={
                        isLastOwner(user)
                          ? t('settings.restaurants.cannotRemoveLastOwner')
                          : t('settings.restaurants.removeUser')
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && userToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!removing) {
                setShowRemoveModal(false)
                setUserToRemove(null)
              }
            }}
          />
          <div className="
            relative w-full max-w-md
            bg-white dark:bg-stone-800
            rounded-2xl shadow-2xl
            animate-fade-in-up
            border-2 border-red-200 dark:border-red-900/50
          ">
            {/* Header */}
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
                    {t('settings.restaurants.removeUser')}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {locale === 'fr' ? 'Cette action est irréversible' : 'This action cannot be undone'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 dark:text-stone-300">
                {t('settings.restaurants.confirmRemoveUser')}
              </p>

              <div className="p-4 rounded-xl bg-gray-100 dark:bg-stone-700 border border-gray-200 dark:border-stone-600">
                <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
                  {userToRemove.name || userToRemove.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-stone-400">
                  {userToRemove.email}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRemoveModal(false)
                    setUserToRemove(null)
                  }}
                  disabled={removing}
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    border border-gray-300 dark:border-stone-600
                    text-gray-700 dark:text-stone-200
                    hover:bg-gray-100 dark:hover:bg-stone-700
                    font-medium transition-colors duration-200
                    disabled:opacity-50
                  "
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={removing}
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    bg-red-600 text-white
                    hover:bg-red-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-medium transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {removing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      {locale === 'fr' ? 'Retirer' : 'Remove'}
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
