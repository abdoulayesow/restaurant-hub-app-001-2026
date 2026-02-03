'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Loader2, X, Save, Users, Building2, ShoppingCart, Eye, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { formatDateForDisplay } from '@/lib/date-utils'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'

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

interface CustomersTabProps {
  onStatsUpdate?: () => void
}

export function CustomersTab({ onStatsUpdate }: CustomersTabProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant } = useRestaurant()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
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

  // Confirmation modal state for activate/deactivate
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [customerToToggle, setCustomerToToggle] = useState<Customer | null>(null)

  const fetchCustomers = useCallback(async () => {
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
  }, [currentRestaurant, showInactive])

  useEffect(() => {
    if (currentRestaurant) {
      fetchCustomers()
    }
  }, [currentRestaurant, fetchCustomers])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired') || 'Name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail') || 'Invalid email format'
    }

    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      newErrors.creditLimit = t('validation.mustBePositive') || 'Must be positive'
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
        if (onStatsUpdate) onStatsUpdate()
        handleCloseModal()
      } else {
        const data = await response.json()
        alert(data.error || t('clients.errors.saveFailed'))
      }
    } catch (error) {
      alert(t('clients.errors.saveFailed'))
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = (customer: Customer) => {
    // Prevent deletion if customer has outstanding debt
    if (customer.isActive && customer.outstandingDebt && customer.outstandingDebt > 0) {
      const debtAmount = formatCurrency(customer.outstandingDebt)
      alert(
        t('clients.cannotDeleteWithDebtMessage')?.replace('{amount}', debtAmount) ||
        `Cannot delete client with outstanding debt of ${debtAmount}. Please clear all debts first.`
      )
      return
    }

    setCustomerToToggle(customer)
    setIsConfirmModalOpen(true)
  }

  const executeToggleActive = async () => {
    if (!customerToToggle) return

    try {
      const response = await fetch(`/api/customers/${customerToToggle.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsConfirmModalOpen(false)
        setCustomerToToggle(null)
        await fetchCustomers()
        if (onStatsUpdate) onStatsUpdate()
      } else {
        const data = await response.json()
        alert(data.error || t('clients.errors.updateFailed'))
      }
    } catch (error) {
      alert(t('clients.errors.updateFailed'))
      console.error(error)
    }
  }

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer)
    setIsViewModalOpen(true)
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700">
      {/* Header Actions */}
      <div className="p-6 border-b border-gray-200 dark:border-stone-700">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('clients.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
            >
              <option value="all">{t('clients.allTypes')}</option>
              <option value="Individual">{t('clients.individual')}</option>
              <option value="Corporate">{t('clients.corporate')}</option>
              <option value="Wholesale">{t('clients.wholesale')}</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-stone-300 border border-gray-300 dark:border-stone-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded text-gray-500 focus:ring-gray-500"
              />
              {t('clients.showInactive')}
            </label>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('clients.addClient')}
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-stone-700/50 border-b border-gray-200 dark:border-stone-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('clients.clientName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('clients.clientType')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('clients.phone')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('clients.outstandingDebt')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('clients.creditLimit')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('clients.status')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-stone-400">
                  {t('clients.noClients')}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const TypeIcon = customerTypeIcons[customer.customerType]
                const hasDebt = Boolean(customer.outstandingDebt && customer.outstandingDebt > 0)
                return (
                  <tr
                    key={customer.id}
                    onClick={() => handleViewCustomer(customer)}
                    className="hover:bg-gray-50 dark:hover:bg-stone-700/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900 dark:text-stone-100">
                        {customer.name}
                      </div>
                      {customer.company && (
                        <div className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                          {customer.company}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-stone-400">
                        <TypeIcon className="w-4 h-4" />
                        <span>
                          {customer.customerType === 'Individual' && t('clients.individual')}
                          {customer.customerType === 'Corporate' && t('clients.corporate')}
                          {customer.customerType === 'Wholesale' && t('clients.wholesale')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-stone-400">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {hasDebt ? (
                        <div>
                          <div className="font-medium text-amber-600 dark:text-amber-400">
                            {formatCurrency(customer.outstandingDebt!)}
                          </div>
                          {customer.activeDebtsCount && customer.activeDebtsCount > 0 && (
                            <div className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
                              {customer.activeDebtsCount} {customer.activeDebtsCount === 1 ? t('clients.activeDebt') : t('clients.activeDebts')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-stone-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-stone-400">
                      {customer.creditLimit ? formatCurrency(customer.creditLimit) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-400'
                      }`}>
                        {customer.isActive ? t('clients.activeStatus') : t('clients.inactiveStatus')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-600 rounded transition-colors"
                          title={t('common.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenModal(customer)
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleActive(customer)
                          }}
                          disabled={hasDebt && customer.isActive}
                          className={`p-1.5 rounded transition-colors ${
                            hasDebt && customer.isActive
                              ? 'text-gray-400 dark:text-stone-600 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
                          }`}
                          title={
                            hasDebt && customer.isActive
                              ? t('clients.cannotDeleteWithDebt')
                              : customer.isActive
                              ? t('clients.deactivate')
                              : t('clients.activate')
                          }
                        >
                          {hasDebt && customer.isActive ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-stone-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-stone-100">
                {editingCustomer ? t('clients.editClient') : t('clients.addClient')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                    {t('clients.clientName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 transition-colors ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                    }`}
                    placeholder={t('clients.clientName')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                    {t('clients.clientType')}
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerFormData['customerType'] })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
                  >
                    <option value="Individual">{t('clients.individual')}</option>
                    <option value="Corporate">{t('clients.corporate')}</option>
                    <option value="Wholesale">{t('clients.wholesale')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                  {t('clients.company')}
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
                  placeholder={t('clients.company')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                    {t('clients.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
                    placeholder={t('clients.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                    {t('clients.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                    }`}
                    placeholder={t('clients.emailPlaceholder')}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                  {t('clients.address')}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
                  placeholder={t('clients.address')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                  {t('clients.creditLimitGNF')}
                </label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 transition-colors ${
                    errors.creditLimit ? 'border-red-500' : 'border-gray-300 dark:border-stone-600'
                  }`}
                  placeholder={t('clients.creditLimitPlaceholder')}
                  min="0"
                />
                {errors.creditLimit && <p className="mt-1 text-sm text-red-500">{errors.creditLimit}</p>}
                <p className="mt-1.5 text-xs text-gray-500 dark:text-stone-400">
                  {t('clients.creditLimitHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                  {t('clients.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100"
                  placeholder={t('clients.notesPlaceholder')}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-800/50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2.5 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700 rounded-lg transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {isViewModalOpen && viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-stone-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-stone-100">
                {t('clients.clientDetails')}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Client Name & Type */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                      {viewingCustomer.name}
                    </h2>
                    {viewingCustomer.company && (
                      <p className="text-gray-600 dark:text-stone-400 mt-1">
                        {viewingCustomer.company}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    viewingCustomer.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-400'
                  }`}>
                    {viewingCustomer.isActive ? t('clients.activeStatus') : t('clients.inactiveStatus')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-stone-400">
                  {(() => {
                    const TypeIcon = customerTypeIcons[viewingCustomer.customerType]
                    return (
                      <>
                        <TypeIcon className="w-4 h-4" />
                        <span>
                          {viewingCustomer.customerType === 'Individual' && t('clients.individual')}
                          {viewingCustomer.customerType === 'Corporate' && t('clients.corporate')}
                          {viewingCustomer.customerType === 'Wholesale' && t('clients.wholesale')}
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-stone-100 uppercase tracking-wide mb-3">
                  {t('clients.contactInfo')}
                </h3>
                <div className="space-y-3 bg-gray-50 dark:bg-stone-900/50 rounded-lg p-4">
                  {viewingCustomer.phone && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-stone-400">{t('clients.phone')}</span>
                      <p className="text-sm text-gray-900 dark:text-stone-100 mt-0.5">{viewingCustomer.phone}</p>
                    </div>
                  )}
                  {viewingCustomer.email && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-stone-400">{t('clients.email')}</span>
                      <p className="text-sm text-gray-900 dark:text-stone-100 mt-0.5">{viewingCustomer.email}</p>
                    </div>
                  )}
                  {viewingCustomer.address && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-stone-400">{t('clients.address')}</span>
                      <p className="text-sm text-gray-900 dark:text-stone-100 mt-0.5">{viewingCustomer.address}</p>
                    </div>
                  )}
                  {!viewingCustomer.phone && !viewingCustomer.email && !viewingCustomer.address && (
                    <p className="text-sm text-gray-500 dark:text-stone-400 italic">
                      {t('common.noData')}
                    </p>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-stone-100 uppercase tracking-wide mb-3">
                  {t('clients.financialInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-stone-900/50 rounded-lg p-4">
                    <span className="text-xs text-gray-500 dark:text-stone-400">{t('clients.creditLimit')}</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-stone-100 mt-1">
                      {viewingCustomer.creditLimit ? formatCurrency(viewingCustomer.creditLimit) : '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-stone-900/50 rounded-lg p-4">
                    <span className="text-xs text-gray-500 dark:text-stone-400">{t('clients.outstandingDebt')}</span>
                    <p className={`text-lg font-semibold mt-1 ${
                      viewingCustomer.outstandingDebt && viewingCustomer.outstandingDebt > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-900 dark:text-stone-100'
                    }`}>
                      {viewingCustomer.outstandingDebt && viewingCustomer.outstandingDebt > 0
                        ? formatCurrency(viewingCustomer.outstandingDebt)
                        : t('clients.noOutstandingDebt')}
                    </p>
                    {viewingCustomer.activeDebtsCount && viewingCustomer.activeDebtsCount > 0 && (
                      <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
                        {viewingCustomer.activeDebtsCount} {viewingCustomer.activeDebtsCount === 1 ? t('clients.activeDebt') : t('clients.activeDebts')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingCustomer.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-stone-100 uppercase tracking-wide mb-3">
                    {t('clients.notes')}
                  </h3>
                  <div className="bg-gray-50 dark:bg-stone-900/50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-stone-300 whitespace-pre-wrap">
                      {viewingCustomer.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 dark:border-stone-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-stone-400">
                  <span>
                    {t('clients.createdOn')}: {formatDateForDisplay(viewingCustomer.createdAt, locale === 'fr' ? 'fr-GN' : 'en-GN')}
                  </span>
                  <span>
                    {t('clients.lastUpdated')}: {formatDateForDisplay(viewingCustomer.updatedAt, locale === 'fr' ? 'fr-GN' : 'en-GN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-800/50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2.5 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700 rounded-lg transition-colors font-medium"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleOpenModal(viewingCustomer)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                {t('common.edit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate/Deactivate Confirmation Modal */}
      {customerToToggle && (
        <DeleteConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false)
            setCustomerToToggle(null)
          }}
          onConfirm={executeToggleActive}
          title={customerToToggle.isActive
            ? t('clients.deactivateClient') || 'Deactivate Client'
            : t('clients.activateClient') || 'Activate Client'
          }
          description={customerToToggle.isActive
            ? t('clients.deactivateDescription') || 'This client will be marked as inactive'
            : t('clients.activateDescription') || 'This client will be marked as active'
          }
          itemType={t('common.client') || 'Client'}
          itemName={customerToToggle.name}
          itemDetails={[
            { label: t('clients.clientType') || 'Type', value: customerToToggle.customerType === 'Individual' ? t('clients.individual') || 'Individual' : customerToToggle.customerType === 'Corporate' ? t('clients.corporate') || 'Corporate' : t('clients.wholesale') || 'Wholesale' },
            ...(customerToToggle.company ? [{ label: t('clients.company') || 'Company', value: customerToToggle.company }] : []),
          ]}
          warningMessage={customerToToggle.isActive
            ? t('clients.deactivateWarning') || 'The client will no longer appear in selection lists but their historical data will be preserved.'
            : t('clients.activateWarning') || 'The client will be available for new transactions.'
          }
          severity={customerToToggle.isActive ? 'warning' : 'normal'}
        />
      )}
    </div>
  )
}
