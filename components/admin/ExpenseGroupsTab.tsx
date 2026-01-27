'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Loader2, X, Save, ChevronUp, ChevronDown } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { IconSelector } from '@/components/ui/IconSelector'

interface ExpenseGroup {
  id: string
  key: string
  label: string
  labelFr: string
  icon: string
  color: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ExpenseGroupFormData {
  key: string
  label: string
  labelFr: string
  icon: string
  color: string
}

export function ExpenseGroupsTab() {
  const { t } = useLocale()
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ExpenseGroup | null>(null)
  const [formData, setFormData] = useState<ExpenseGroupFormData>({
    key: '',
    label: '',
    labelFr: '',
    icon: 'Package',
    color: '#C45C26'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  const fetchExpenseGroups = useCallback(async () => {
    try {
      setLoading(true)
      const url = `/api/expense-groups${showInactive ? '?includeInactive=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setExpenseGroups(data.expenseGroups || [])
      }
    } catch (error) {
      console.error('Error fetching expense groups:', error)
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    fetchExpenseGroups()
  }, [fetchExpenseGroups])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required'
    } else if (!/^[a-zA-Z_]+$/.test(formData.key)) {
      newErrors.key = 'Key must contain only letters and underscores'
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required'
    }

    if (!formData.labelFr.trim()) {
      newErrors.labelFr = 'French label is required'
    }

    if (!formData.icon) {
      newErrors.icon = 'Icon is required'
    }

    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Valid color is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpenModal = (group?: ExpenseGroup) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        key: group.key,
        label: group.label,
        labelFr: group.labelFr,
        icon: group.icon,
        color: group.color
      })
    } else {
      setEditingGroup(null)
      setFormData({
        key: '',
        label: '',
        labelFr: '',
        icon: 'Package',
        color: '#C45C26'
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
    setFormData({
      key: '',
      label: '',
      labelFr: '',
      icon: 'Package',
      color: '#C45C26'
    })
    setErrors({})
  }

  const handleSave = async () => {
    if (!validate()) return

    try {
      setSaving(true)
      const url = editingGroup
        ? `/api/expense-groups/${editingGroup.id}`
        : '/api/expense-groups'
      const method = editingGroup ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchExpenseGroups()
        handleCloseModal()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save expense group')
      }
    } catch (error) {
      alert('Failed to save expense group')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (group: ExpenseGroup) => {
    try {
      const response = await fetch(`/api/expense-groups/${group.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchExpenseGroups()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update expense group')
      }
    } catch (error) {
      alert('Failed to update expense group')
      console.error(error)
    }
  }

  const handleReorder = async (groupId: string, direction: 'up' | 'down') => {
    const currentIndex = expenseGroups.findIndex(g => g.id === groupId)
    if (currentIndex === -1) return

    const newGroups = [...expenseGroups]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= newGroups.length) return

    // Swap positions
    ;[newGroups[currentIndex], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[currentIndex]]

    // Update sortOrder
    const updates = newGroups.map((group, index) => ({
      id: group.id,
      sortOrder: index
    }))

    try {
      setReordering(true)
      const response = await fetch('/api/expense-groups/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (response.ok) {
        setExpenseGroups(newGroups.map((g, i) => ({ ...g, sortOrder: i })))
      } else {
        alert('Failed to reorder expense groups')
      }
    } catch (error) {
      alert('Failed to reorder expense groups')
      console.error(error)
    } finally {
      setReordering(false)
    }
  }

  const filteredGroups = expenseGroups.filter(group =>
    group.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.labelFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
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
            placeholder={t('common.search') || 'Search expense groups...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100"
          />
        </div>

        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-stone-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-stone-600 transition-colors">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-gray-500 focus:ring-gray-500"
            />
            Show Inactive
          </label>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('admin.addExpenseGroup') || 'Add Expense Group'}
          </button>
        </div>
      </div>

      {/* Expense Groups Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-stone-700 border-b border-gray-200 dark:border-stone-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Icon & Color
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Key
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Label (EN)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Label (FR)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-stone-600">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No expense groups found
                </td>
              </tr>
            ) : (
              filteredGroups.map((group, index) => (
                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-stone-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorder(group.id, 'up')}
                        disabled={index === 0 || reordering}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(group.id, 'down')}
                        disabled={index === filteredGroups.length - 1 || reordering}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                        style={{ backgroundColor: group.color }}
                      >
                        <span className="text-white text-xs">
                          {group.icon.slice(0, 2)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {group.key}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-stone-100">
                    {group.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {group.labelFr}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      group.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(group)}
                        className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(group)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title={group.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-stone-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
                {editingGroup ? (t('admin.editExpenseGroup') || 'Edit Expense Group') : (t('admin.addExpenseGroup') || 'Add Expense Group')}
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
                  Key (Identifier) *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  disabled={!!editingGroup}
                  className={`w-full px-3 py-2 font-mono border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 ${
                    errors.key ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                  } ${editingGroup ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="e.g., ingredient_purchases"
                />
                {errors.key && <p className="mt-1 text-sm text-red-500">{errors.key}</p>}
                {editingGroup && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Key cannot be changed after creation
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label (English) *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 ${
                    errors.label ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="e.g., Ingredient Purchases"
                />
                {errors.label && <p className="mt-1 text-sm text-red-500">{errors.label}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label (French) *
                </label>
                <input
                  type="text"
                  value={formData.labelFr}
                  onChange={(e) => setFormData({ ...formData, labelFr: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 ${
                    errors.labelFr ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="e.g., Achats d'ingrédients"
                />
                {errors.labelFr && <p className="mt-1 text-sm text-red-500">{errors.labelFr}</p>}
              </div>

              <div>
                <IconSelector
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                  label="Icon *"
                />
                {errors.icon && <p className="mt-1 text-sm text-red-500">{errors.icon}</p>}
              </div>

              <div>
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                  label="Color *"
                />
                {errors.color && <p className="mt-1 text-sm text-red-500">{errors.color}</p>}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-stone-700">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
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
