'use client'

import { useState } from 'react'
import { Database } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SuppliersTab } from '@/components/admin/SuppliersTab'
import { CategoriesTab } from '@/components/admin/CategoriesTab'
import { ExpenseGroupsTab } from '@/components/admin/ExpenseGroupsTab'

type TabType = 'suppliers' | 'categories' | 'expenseGroups'

export default function ReferenceDataPage() {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<TabType>('suppliers')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-terracotta-500" />
          <h1
            className="text-3xl font-bold text-terracotta-900 dark:text-cream-100"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            {t('admin.referenceData') || 'Reference Data Management'}
          </h1>
        </div>
        <p className="text-terracotta-600 dark:text-cream-300">
          {t('admin.referenceDataDesc') || 'Manage suppliers, categories, and expense groups'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-terracotta-200 dark:border-dark-700">
        <div className="flex border-b border-terracotta-200 dark:border-dark-700">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`
              px-6 py-4 font-medium transition-colors
              ${activeTab === 'suppliers'
                ? 'text-terracotta-600 dark:text-terracotta-400 border-b-2 border-terracotta-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-terracotta-600 dark:hover:text-terracotta-400'
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
                ? 'text-terracotta-600 dark:text-terracotta-400 border-b-2 border-terracotta-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-terracotta-600 dark:hover:text-terracotta-400'
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
                ? 'text-terracotta-600 dark:text-terracotta-400 border-b-2 border-terracotta-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-terracotta-600 dark:hover:text-terracotta-400'
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
