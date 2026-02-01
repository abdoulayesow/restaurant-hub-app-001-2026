'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, ShoppingBag, RefreshCw } from 'lucide-react'
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { canApprove } from '@/lib/roles'
import { ProductsTable, ProductModal, type Product, type ProductFormData } from '@/components/baking'
import {
  PRODUCT_CATEGORIES,
  type ProductCategoryValue,
} from '@/lib/constants/product-categories'

type CategoryFilter = ProductCategoryValue | 'all'

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLocale()
  const { currentRestaurant, currentRole, loading: restaurantLoading } = useRestaurant()

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const isManager = canApprove(currentRole)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!currentRestaurant) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        restaurantId: currentRestaurant.id,
        activeOnly: showInactive ? 'false' : 'true',
      })

      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter)
      }

      const response = await fetch(`/api/products?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      setError(t('errors.failedToLoad'))
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant, categoryFilter, showInactive, t])

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch on mount and filter change
  useEffect(() => {
    if (currentRestaurant) {
      fetchProducts()
    }
  }, [currentRestaurant, fetchProducts])

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      (product.nameFr?.toLowerCase().includes(query) ?? false)
    )
  })

  // Handlers
  const handleAddProduct = () => {
    setSelectedProduct(null)
    setProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setProductModalOpen(true)
  }

  const handleToggleActive = async (product: Product) => {
    if (!currentRestaurant) return

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !product.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      setToast({
        message: product.isActive
          ? t('production.products.productDeactivated')
          : t('production.products.productActivated'),
        type: 'success',
      })
      await fetchProducts()
    } catch (err) {
      console.error('Error toggling product status:', err)
      setToast({ message: t('errors.failedToSave'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProduct = async (data: ProductFormData) => {
    if (!currentRestaurant) return

    setSaving(true)
    try {
      const url = selectedProduct
        ? `/api/products/${selectedProduct.id}`
        : '/api/products'

      const method = selectedProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          restaurantId: currentRestaurant.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save product')
      }

      setProductModalOpen(false)
      setSelectedProduct(null)
      setToast({ message: t('notifications.saved'), type: 'success' })
      await fetchProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      setToast({ message: t('errors.failedToSave'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Loading state
  if (status === 'loading' || restaurantLoading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-1/4" />
            <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-96 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {t('production.products.title')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('production.products.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isManager && (
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                {t('production.products.addProduct')}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('inventory.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                }`}
              >
                {t('production.products.allCategories')}
              </button>
              {PRODUCT_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isActive = categoryFilter === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? `${cat.bgColor} ${cat.textColor}`
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(`production.${cat.value.toLowerCase()}`)}
                  </button>
                )
              })}
            </div>

            {/* Show Inactive Toggle */}
            <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
              />
              {t('production.products.showInactive')}
            </label>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Products Table or Empty State */}
        {!loading && filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-12 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
              <ShoppingBag className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
              {t('production.products.noProducts')}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {t('production.products.noProductsDescription')}
            </p>
            {isManager && (
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                {t('production.products.addProduct')}
              </button>
            )}
          </div>
        ) : (
          <ProductsTable
            products={filteredProducts}
            isManager={isManager}
            onEdit={handleEditProduct}
            onToggleActive={handleToggleActive}
          />
        )}

        {/* Product Count */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            {filteredProducts.length} {filteredProducts.length === 1 ? t('inventory.item') : t('inventory.items')}
          </div>
        )}
      </main>

      {/* Product Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false)
          setSelectedProduct(null)
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
        isLoading={saving}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
