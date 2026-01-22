'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package, RefreshCw } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { InventoryCardGrid } from '@/components/inventory/InventoryCardGrid'
import { InventoryItem } from '@/components/inventory/InventoryCard'
import { CategoryFilter } from '@/components/inventory/CategoryFilter'
import { AddEditItemModal } from '@/components/inventory/AddEditItemModal'
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal'
import { MovementHistoryModal } from '@/components/inventory/MovementHistoryModal'
import { DeleteConfirmModal } from '@/components/inventory/DeleteConfirmModal'
import { ViewItemModal } from '@/components/inventory/ViewItemModal'

export default function BakingInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLocale()
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant()

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    if (!currentRestaurant) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        restaurantId: currentRestaurant.id,
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
  }, [currentRestaurant, searchQuery, categoryFilter, showLowStockOnly, t])

  useEffect(() => {
    if (currentRestaurant) {
      fetchItems()
    }
  }, [currentRestaurant, fetchItems])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentRestaurant) {
        fetchItems()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, currentRestaurant, fetchItems])

  // Handlers
  const handleAddItem = () => {
    setSelectedItem(null)
    setAddEditModalOpen(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setAddEditModalOpen(true)
  }

  const handleDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/inventory/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      setDeleteModalOpen(false)
      setItemToDelete(null)
      await fetchItems()
    } catch (err) {
      console.error('Error deleting item:', err)
      alert(t('errors.generic'))
    } finally {
      setDeleting(false)
    }
  }

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustModalOpen(true)
  }

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item)
    setHistoryModalOpen(true)
  }

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setViewModalOpen(true)
  }

  const handleSaveItem = async (data: Partial<InventoryItem>) => {
    if (!currentRestaurant) return

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
          restaurantId: currentRestaurant.id,
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
  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-plum-200/50 dark:bg-plum-800 rounded-xl w-1/4"></div>
            <div className="h-12 bg-plum-200/50 dark:bg-plum-800 rounded-xl"></div>
            <div className="h-96 bg-plum-200/50 dark:bg-plum-800 rounded-2xl"></div>
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
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="bliss-display text-3xl font-bold text-plum-800 dark:text-cream-100">
              {t('inventory.title')}
            </h1>
            <p className="bliss-body text-plum-600/70 dark:text-cream-300/70 mt-1">
              {currentRestaurant?.name || 'Loading...'}
              {currentRestaurant?.location && ` - ${currentRestaurant.location}`}
            </p>
          </div>

          {isManager && (
            <button
              onClick={handleAddItem}
              className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 bg-plum-700 text-cream-50 rounded-xl hover:bg-plum-800 shadow-lg shadow-plum-900/20 font-medium transition-all"
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-plum-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('inventory.searchPlaceholder')}
              className="bliss-body w-full pl-10 pr-4 py-2.5 border border-plum-200 dark:border-plum-700 rounded-xl focus:ring-2 focus:ring-plum-500 focus:border-plum-500 bg-cream-50 dark:bg-plum-950 text-plum-900 dark:text-cream-100 placeholder:text-plum-400 dark:placeholder:text-plum-500 transition-colors"
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
            className={`bliss-body inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showLowStockOnly
                ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-600'
                : 'border-plum-200 dark:border-plum-700 text-plum-700 dark:text-cream-300 hover:bg-plum-50 dark:hover:bg-plum-800'
            }`}
          >
            <Package className="w-4 h-4" />
            {t('inventory.lowStock')}
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-2.5 rounded-xl border border-plum-200 dark:border-plum-700 text-plum-700 dark:text-cream-300 hover:bg-plum-50 dark:hover:bg-plum-800 transition-all disabled:opacity-50"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bliss-body mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Inventory Table */}
        {loading && items.length === 0 ? (
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg diagonal-stripes-bliss border border-plum-200/30 dark:border-plum-700/30 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-plum-600 mb-4"></div>
              <p className="bliss-body text-plum-600/60 dark:text-cream-300/60">{t('common.loading')}</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-cream-50 dark:bg-plum-800 rounded-2xl warm-shadow-lg diagonal-stripes-bliss border border-plum-200/30 dark:border-plum-700/30 p-12 text-center ornate-corners">
            <Package className="w-16 h-16 mx-auto mb-4 text-plum-300 dark:text-plum-600" />
            <h3 className="bliss-elegant text-xl font-medium text-plum-800 dark:text-cream-100 mb-2">
              {t('inventory.noItems')}
            </h3>
            <p className="bliss-body text-plum-600/60 dark:text-cream-300/60 mb-6">
              {t('inventory.noItemsDescription')}
            </p>
            {isManager && (
              <button
                onClick={handleAddItem}
                className="btn-lift inline-flex items-center gap-2 px-5 py-2.5 bg-plum-700 text-cream-50 rounded-xl hover:bg-plum-800 shadow-lg shadow-plum-900/20 font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                {t('inventory.addItem')}
              </button>
            )}
          </div>
        ) : (
          <InventoryCardGrid
            items={items}
            isManager={isManager}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onAdjust={handleAdjustStock}
            onViewHistory={handleViewHistory}
            onView={handleViewItem}
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

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setItemToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name || ''}
        loading={deleting}
      />

      <ViewItemModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        isManager={isManager}
        onEdit={handleEditItem}
        onAdjust={handleAdjustStock}
        onViewHistory={handleViewHistory}
      />
    </div>
  )
}
