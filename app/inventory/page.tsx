'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package, RefreshCw } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useBakery } from '@/components/providers/BakeryProvider'
import { InventoryTable, InventoryItem } from '@/components/inventory/InventoryTable'
import { CategoryFilter } from '@/components/inventory/CategoryFilter'
import { AddEditItemModal } from '@/components/inventory/AddEditItemModal'
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal'
import { MovementHistoryModal } from '@/components/inventory/MovementHistoryModal'

export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLocale()
  const { currentBakery, loading: bakeryLoading } = useBakery()

  // Data state
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Modal state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventoryItem | null>(null)

  const isManager = session?.user?.role === 'Manager'

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch inventory items
  const fetchItems = useCallback(async () => {
    if (!currentBakery) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        bakeryId: currentBakery.id,
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (categoryFilter) {
        params.append('category', categoryFilter)
      }
      if (showLowStockOnly) {
        params.append('lowStock', 'true')
      }

      const response = await fetch(`/api/inventory?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data = await response.json()
      setItems(data.items || [])
    } catch (err) {
      setError(t('errors.generic'))
      console.error('Error fetching inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [currentBakery, searchQuery, categoryFilter, showLowStockOnly, t])

  useEffect(() => {
    if (currentBakery) {
      fetchItems()
    }
  }, [currentBakery, fetchItems])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentBakery) {
        fetchItems()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle add item
  const handleAddItem = () => {
    setSelectedItem(null)
    setAddEditModalOpen(true)
  }

  // Handle edit item
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setAddEditModalOpen(true)
  }

  // Handle delete item
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(t('inventory.confirmDelete'))) return

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      await fetchItems()
    } catch (err) {
      console.error('Error deleting item:', err)
      alert(t('errors.generic'))
    }
  }

  // Handle adjust stock
  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustModalOpen(true)
  }

  // Handle view history
  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item)
    setHistoryModalOpen(true)
  }

  // Handle save item (add or edit)
  const handleSaveItem = async (data: Partial<InventoryItem>) => {
    if (!currentBakery) return

    setSaving(true)

    try {
      const url = selectedItem
        ? `/api/inventory/${selectedItem.id}`
        : '/api/inventory'

      const method = selectedItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          bakeryId: currentBakery.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save item')
      }

      setAddEditModalOpen(false)
      setSelectedItem(null)
      await fetchItems()
    } catch (err) {
      console.error('Error saving item:', err)
      alert(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  // Handle stock adjustment
  const handleSaveAdjustment = async (data: {
    type: 'Purchase' | 'Usage' | 'Waste' | 'Adjustment'
    quantity: number
    reason?: string
    unitCost?: number
  }) => {
    if (!selectedItem) return

    setSaving(true)

    try {
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to adjust stock')
      }

      setAdjustModalOpen(false)
      setSelectedItem(null)
      await fetchItems()
    } catch (err) {
      console.error('Error adjusting stock:', err)
      alert(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (status === 'loading' || bakeryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  // Count low stock items
  const lowStockCount = items.filter(
    (item) => item.stockStatus === 'low' || item.stockStatus === 'critical'
  ).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('inventory.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentBakery?.name || 'Loading...'}
              {currentBakery?.location && ` - ${currentBakery.location}`}
            </p>
          </div>

          {isManager && (
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('inventory.addItem')}
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('inventory.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>

          {/* Category Filter */}
          <CategoryFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-full sm:w-48"
          />

          {/* Low Stock Toggle */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showLowStockOnly
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            {t('inventory.lowStock')}
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Inventory Table */}
        {loading && items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('inventory.noItems')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('inventory.noItemsDescription')}
            </p>
            {isManager && (
              <button
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('inventory.addItem')}
              </button>
            )}
          </div>
        ) : (
          <InventoryTable
            items={items}
            isManager={isManager}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onAdjust={handleAdjustStock}
            onViewHistory={handleViewHistory}
          />
        )}
      </main>

      {/* Modals */}
      <AddEditItemModal
        isOpen={addEditModalOpen}
        onClose={() => {
          setAddEditModalOpen(false)
          setSelectedItem(null)
        }}
        onSave={handleSaveItem}
        item={selectedItem}
        isLoading={saving}
      />

      <StockAdjustmentModal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false)
          setSelectedItem(null)
        }}
        onAdjust={handleSaveAdjustment}
        item={selectedItem}
        isLoading={saving}
      />

      <MovementHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
      />
    </div>
  )
}
