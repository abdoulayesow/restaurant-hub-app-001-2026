'use client'

import { useState } from 'react'
import { Database } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SuppliersTab } from '@/components/admin/SuppliersTab'
import { CategoriesTab } from '@/components/admin/CategoriesTab'
import { ExpenseGroupsTab } from '@/components/admin/ExpenseGroupsTab'
import { CustomersTab } from '@/components/admin/CustomersTab'

type TabType = 'customers' | 'suppliers' | 'categories' | 'expenseGroups'

export default function ReferenceDataPage() {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<TabType>('customers')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-gray-700" />
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-stone-100"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            {t('admin.referenceData') || 'Reference Data Management'}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-stone-300">
          {t('admin.referenceDataDesc') || 'Manage customers, suppliers, categories, and expense groups'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700">
        <div className="flex border-b border-gray-200 dark:border-stone-700">
          <button
            onClick={() => setActiveTab('customers')}
            className={`
              px-6 py-4 font-medium transition-colors
              ${activeTab === 'customers'
                ? 'text-gray-900 dark:text-stone-100 border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-stone-100'
              }
            `}
          >
            {t('admin.customers') || 'Customers'}
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`
              px-6 py-4 font-medium transition-colors
              ${activeTab === 'suppliers'
                ? 'text-gray-900 dark:text-stone-100 border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-stone-100'
              }
            `}
          >
            {t('admin.suppliers') || 'Suppliers'}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`
              px-6 py-4 font-medium transition-colors
              ${activeTab === 'categories'
                ? 'text-gray-900 dark:text-stone-100 border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-stone-100'
              }
            `}
          >
            {t('admin.categories') || 'Categories'}
          </button>
          <button
            onClick={() => setActiveTab('expenseGroups')}
            className={`
              px-6 py-4 font-medium transition-colors
              ${activeTab === 'expenseGroups'
                ? 'text-gray-900 dark:text-stone-100 border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-stone-100'
              }
            `}
          >
            {t('admin.expenseGroups') || 'Expense Groups'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'suppliers' && <SuppliersTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'expenseGroups' && <ExpenseGroupsTab />}
        </div>
      </div>
    </div>
  )
}
