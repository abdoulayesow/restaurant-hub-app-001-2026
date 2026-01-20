'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Loader2, X, Save, Users, Building2, ShoppingCart } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  company: string | null
  customerType: 'Individual' | 'Corporate' | 'Wholesale'
  creditLimit: number | null
  notes: string | null
  isActive: boolean
  outstandingDebt?: number
  activeDebtsCount?: number
  createdAt: string
  updatedAt: string
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  address: string
  company: string
  customerType: 'Individual' | 'Corporate' | 'Wholesale'
  creditLimit: string
  notes: string
}

const customerTypeIcons = {
  Individual: Users,
  Corporate: Building2,
  Wholesale: ShoppingCart
}

export function CustomersTab() {
  const { t } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    company: '',
    customerType: 'Individual',
    creditLimit: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentRestaurant) {
      fetchCustomers()
    }
  }, [showInactive, currentRestaurant])

  const fetchCustomers = async () => {
    if (!currentRestaurant) return

    try {
      setLoading(true)
      const url = `/api/customers?restaurantId=${currentRestaurant.id}${showInactive ? '&includeInactive=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      newErrors.creditLimit = 'Credit limit must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        company: customer.company || '',
        customerType: customer.customerType,
        creditLimit: customer.creditLimit?.toString() || '',
        notes: customer.notes || ''
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        company: '',
        customerType: 'Individual',
        creditLimit: '',
        notes: ''
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      company: '',
      customerType: 'Individual',
      creditLimit: '',
      notes: ''
    })
    setErrors({})
  }

  const handleSave = async () => {
    if (!validate() || !currentRestaurant) return

    try {
      setSaving(true)
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        restaurantId: currentRestaurant.id,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchCustomers()
        handleCloseModal()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save customer')
      }
    } catch (error) {
      alert('Failed to save customer')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCustomers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update customer')
      }
    } catch (error) {
      alert('Failed to update customer')
      console.error(error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' GNF'
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === 'all' || customer.customerType === filterType

    return matchesSearch && matchesType
  })

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
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search') || 'Search customers...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
          >
            <option value="all">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Corporate">Corporate</option>
            <option value="Wholesale">Wholesale</option>
          </select>
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
            {t('admin.addCustomer') || 'Add Customer'}
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Outstanding Debt
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Credit Limit
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
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No customers found
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const TypeIcon = customerTypeIcons[customer.customerType]
                return (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-cream-100">
                        {customer.name}
                      </div>
                      {customer.company && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.company}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <TypeIcon className="w-4 h-4" />
                        <span>{customer.customerType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {customer.outstandingDebt && customer.outstandingDebt > 0 ? (
                        <div>
                          <div className="font-medium text-amber-700 dark:text-amber-400">
                            {formatCurrency(customer.outstandingDebt)}
                          </div>
                          {customer.activeDebtsCount && customer.activeDebtsCount > 0 && (
                            <div className="text-xs text-gray-500">
                              {customer.activeDebtsCount} active {customer.activeDebtsCount === 1 ? 'debt' : 'debts'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {customer.creditLimit ? formatCurrency(customer.creditLimit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(customer)}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                          title={customer.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-cream-100">
                {editingCustomer ? (t('admin.editCustomer') || 'Edit Customer') : (t('admin.addCustomer') || 'Add Customer')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100 ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                    }`}
                    placeholder="Full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
                  placeholder="Company name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100 ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                    }`}
                    placeholder="customer@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
                  placeholder="Street address, city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credit Limit (GNF)
                </label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100 ${
                    errors.creditLimit ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.creditLimit && <p className="mt-1 text-sm text-red-500">{errors.creditLimit}</p>}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum amount this customer can owe at once
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-cream-100"
                  placeholder="Internal notes about this customer"
                />
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
