'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Loader2, X, Save } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ColorPicker } from '@/components/ui/ColorPicker'

interface ExpenseGroup {
  id: string
  key: string
  label: string
  labelFr: string
  icon: string
  color: string
  sortOrder: number
  isActive: boolean
}

interface Category {
  id: string
  name: string
  nameFr: string | null
  color: string
  expenseGroupId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  expenseGroup: ExpenseGroup
}

interface CategoryFormData {
  name: string
  nameFr: string
  color: string
  expenseGroupId: string
}

export function CategoriesTab() {
  const { t } = useLocale()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    nameFr: '',
    color: '#C45C26',
    expenseGroupId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [showInactive])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const url = `/api/categories${showInactive ? '?includeInactive=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setExpenseGroups(data.expenseGroups || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }

    if (!formData.expenseGroupId) {
      newErrors.expenseGroupId = 'Expense group is required'
    }

    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Valid color is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        nameFr: category.nameFr || '',
        color: category.color,
        expenseGroupId: category.expenseGroupId
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        nameFr: '',
        color: '#C45C26',
        expenseGroupId: expenseGroups[0]?.id || ''
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      nameFr: '',
      color: '#C45C26',
      expenseGroupId: ''
    })
    setErrors({})
  }

  const handleSave = async () => {
    if (!validate()) return

    try {
      setSaving(true)
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchCategories()
        handleCloseModal()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save category')
      }
    } catch (error) {
      alert('Failed to save category')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update category')
      }
    } catch (error) {
      alert('Failed to update category')
      console.error(error)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.nameFr && category.nameFr.toLowerCase().includes(searchTerm.toLowerCase())) ||
    category.expenseGroup.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group categories by expense group
  const groupedCategories = expenseGroups.map(group => ({
    group,
    categories: filteredCategories.filter(cat => cat.expenseGroupId === group.id)
  })).filter(item => item.categories.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') || 'Search categories...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
          />
        </div>

        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-terracotta-500 focus:ring-terracotta-500"
            />
            Show Inactive
          </label>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('admin.addCategory') || 'Add Category'}
          </button>
        </div>
      </div>

      {/* Categories Grouped by Expense Group */}
      <div className="space-y-6">
        {groupedCategories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No categories found
          </div>
        ) : (
          groupedCategories.map(({ group, categories }) => (
            <div key={group.id} className="space-y-2">
              {/* Group Header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {group.label}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({categories.length})
                </span>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name (EN)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name (FR)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                        <td className="px-4 py-3">
                          <div
                            className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: category.color }}
                            title={category.color}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-cream-100">
                          {category.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {category.nameFr || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(category)}
                              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(category)}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                              title={category.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-cream-100">
                {editingCategory ? (t('admin.editCategory') || 'Edit Category') : (t('admin.addCategory') || 'Add Category')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.categoryName') || 'Category Name (English)'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100 ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  }`}
                  placeholder="e.g., Ingredients"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.categoryNameFr') || 'Category Name (French)'}
                </label>
                <input
                  type="text"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
                  placeholder="e.g., Ingrédients"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.expenseGroup') || 'Expense Group'} *
                </label>
                <select
                  value={formData.expenseGroupId}
                  onChange={(e) => setFormData({ ...formData, expenseGroupId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100 ${
                    errors.expenseGroupId ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  }`}
                >
                  <option value="">Select expense group</option>
                  {expenseGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
                {errors.expenseGroupId && <p className="mt-1 text-sm text-red-500">{errors.expenseGroupId}</p>}
              </div>

              <div>
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                  label={t('admin.categoryColor') || 'Category Color'}
                />
                {errors.color && <p className="mt-1 text-sm text-red-500">{errors.color}</p>}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-700">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('common.save') || 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
