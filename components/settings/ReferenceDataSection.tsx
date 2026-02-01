'use client'

import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SuppliersTab } from '@/components/admin/SuppliersTab'
import { CategoriesTab } from '@/components/admin/CategoriesTab'
import { ExpenseGroupsTab } from '@/components/admin/ExpenseGroupsTab'

type TabType = 'suppliers' | 'categories' | 'expenseGroups'

export function ReferenceDataSection() {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<TabType>('suppliers')

  return (
    <div className="space-y-6">
      {/* Section Description */}
      <div className="mb-4">
        <p className="text-gray-600 dark:text-stone-400">
          {t('settings.referenceDataDesc') || 'Manage suppliers, expense categories, and expense groups used across your bakery.'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700">
        <div className="flex border-b border-gray-200 dark:border-stone-700">
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
          {activeTab === 'suppliers' && <SuppliersTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'expenseGroups' && <ExpenseGroupsTab />}
        </div>
      </div>
    </div>
  )
}
