'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { ChevronDown, Loader2 } from 'lucide-react'
import { getRoleDisplayName } from '@/lib/roles'
import { useLocale } from '@/components/providers/LocaleProvider'

interface RoleDropdownProps {
  restaurantId: string
  userId: string
  currentRole: UserRole
  disabled?: boolean
  onRoleChange: (newRole: UserRole) => Promise<void>
}

const roleOptions: UserRole[] = [
  'Owner',
  'RestaurantManager',
  'Baker',
  'PastryChef',
  'Cashier',
]

export function RoleDropdown({
  restaurantId: _restaurantId,
  userId: _userId,
  currentRole,
  disabled = false,
  onRoleChange,
}: RoleDropdownProps) {
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [optimisticRole, setOptimisticRole] = useState(currentRole)

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole || disabled) return

    setIsOpen(false)
    setIsLoading(true)
    const previousRole = optimisticRole

    // Optimistic update
    setOptimisticRole(newRole)

    try {
      await onRoleChange(newRole)
    } catch (error) {
      // Revert on error
      setOptimisticRole(previousRole)
      console.error('Failed to change role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-between gap-2
          px-3 py-1.5 rounded-lg text-sm font-medium
          border border-gray-300 dark:border-stone-600
          bg-white dark:bg-stone-700
          text-gray-700 dark:text-stone-200
          hover:bg-gray-50 dark:hover:bg-stone-600
          transition-colors duration-200
          min-w-[160px]
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span>{getRoleDisplayName(optimisticRole, locale)}</span>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !disabled && !isLoading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="
            absolute right-0 mt-2 w-56
            bg-white dark:bg-stone-800
            rounded-xl shadow-lg
            border border-gray-200 dark:border-stone-700
            py-1 z-20
            animate-fade-in-up
          ">
            {roleOptions.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  hover:bg-gray-100 dark:hover:bg-stone-700
                  transition-colors duration-150
                  ${role === optimisticRole
                    ? 'bg-gray-50 dark:bg-stone-700/50 font-semibold text-gray-900 dark:text-stone-100'
                    : 'text-gray-700 dark:text-stone-300'
                  }
                `}
              >
                {getRoleDisplayName(role, locale)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
