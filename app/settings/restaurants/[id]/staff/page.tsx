'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, UserPlus, Users, Loader2 } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { StaffTable } from '@/components/settings/StaffTable'
import { AddUserModal } from '@/components/settings/AddUserModal'
import { useLocale } from '@/components/providers/LocaleProvider'

interface AssignedUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  assignedAt: Date
}

interface User {
  id: string
  name: string | null
  email: string
}

interface Restaurant {
  id: string
  name: string
  location: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function StaffManagementPage({ params }: PageProps) {
  const { id: restaurantId } = use(params)
  const router = useRouter()
  const { locale, t } = useLocale()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`)
        if (response.ok) {
          const data = await response.json()
          setRestaurant(data)
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error)
      }
    }

    fetchRestaurant()
  }, [restaurantId])

  // Fetch assigned users and all users
  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersResponse, allUsersResponse] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/users`),
        fetch('/api/users'),
      ])

      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setAssignedUsers(data.users.map((u: AssignedUser) => ({
          ...u,
          assignedAt: new Date(u.assignedAt),
        })))
      }

      if (allUsersResponse.ok) {
        const data = await allUsersResponse.json()
        setAllUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/users/${userId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to change role')
    }

    // Update local state
    setAssignedUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    )
  }

  const handleRemoveUser = async (userId: string) => {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/users/${userId}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to remove user')
    }
  }

  const availableUsers = allUsers.filter(
    user => !assignedUsers.some(assigned => assigned.id === user.id)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => router.push('/settings')}
          className="
            inline-flex items-center gap-2 mb-6
            text-gray-600 dark:text-stone-400
            hover:text-gray-900 dark:hover:text-stone-100
            transition-colors
          "
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">
            {locale === 'fr' ? 'Retour aux paramètres' : 'Back to settings'}
          </span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="
              w-12 h-12 rounded-xl
              bg-gray-900 dark:bg-white
              text-white dark:text-gray-900
              flex items-center justify-center
            ">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-gray-900 dark:text-stone-100"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {t('settings.restaurants.staffManagement')}
              </h1>
              {restaurant && (
                <p className="text-sm text-gray-600 dark:text-stone-400">
                  {restaurant.name}
                  {restaurant.location && ` • ${restaurant.location}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-stone-400">
            {assignedUsers.length} {t('settings.restaurants.staffMembers')}
          </p>
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
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">
              {t('settings.restaurants.addUser')}
            </span>
          </button>
        </div>

        {/* Staff Table */}
        <StaffTable
          restaurantId={restaurantId}
          users={assignedUsers}
          onRoleChange={handleRoleChange}
          onRemoveUser={handleRemoveUser}
          onRefresh={fetchData}
        />
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          restaurantId={restaurantId}
          availableUsers={availableUsers}
          onClose={() => setShowAddModal(false)}
          onUserAdded={fetchData}
        />
      )}
    </div>
  )
}
