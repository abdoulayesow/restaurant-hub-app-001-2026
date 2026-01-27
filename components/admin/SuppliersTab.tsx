'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Loader2, X, Save } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  paymentTerms: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SupplierFormData {
  name: string
  phone: string
  email: string
  address: string
  paymentTerms: string
}

export function SuppliersTab() {
  const { t } = useLocale()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      const url = `/api/suppliers${showInactive ? '?includeInactive=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        paymentTerms: supplier.paymentTerms || ''
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: ''
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      paymentTerms: ''
    })
    setErrors({})
  }

  const handleSave = async () => {
    if (!validate()) return

    try {
      setSaving(true)
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.id}`
        : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchSuppliers()
        handleCloseModal()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save supplier')
      }
    } catch (error) {
      alert('Failed to save supplier')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSuppliers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update supplier')
      }
    } catch (error) {
      alert('Failed to update supplier')
      console.error(error)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.phone && supplier.phone.includes(searchTerm)) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
            placeholder={t('common.search') || 'Search suppliers...'}
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
            {t('admin.addSupplier') || 'Add Supplier'}
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-stone-700 border-b border-gray-200 dark:border-stone-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Payment Terms
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
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No suppliers found
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-stone-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-stone-100">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {supplier.phone || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {supplier.email || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {supplier.paymentTerms || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(supplier)}
                        className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(supplier)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title={supplier.isActive ? 'Deactivate' : 'Activate'}
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
                {editingSupplier ? (t('admin.editSupplier') || 'Edit Supplier') : (t('admin.addSupplier') || 'Add Supplier')}
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
                  {t('admin.supplierName') || 'Supplier Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="Supplier name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100"
                  placeholder="+224 XXX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder="supplier@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100"
                  placeholder="Street address, city, country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.paymentTerms') || 'Payment Terms'}
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-stone-100"
                  placeholder="e.g., Net 30, Cash on delivery"
                />
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
