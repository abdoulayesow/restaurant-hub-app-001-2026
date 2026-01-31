'use client'

import { Briefcase, Banknote } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export type ViewMode = 'business' | 'cash'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { t } = useLocale()

  return (
    <div className="flex bg-white dark:bg-stone-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-stone-700">
      <button
        onClick={() => onViewModeChange('business')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
          viewMode === 'business'
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
            : 'text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-700'
        }`}
      >
        <Briefcase className="w-4 h-4" />
        <span className="hidden sm:inline">{t('dashboard.businessView')}</span>
      </button>
      <button
        onClick={() => onViewModeChange('cash')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
          viewMode === 'cash'
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
            : 'text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-700'
        }`}
      >
        <Banknote className="w-4 h-4" />
        <span className="hidden sm:inline">{t('dashboard.cashView')}</span>
      </button>
    </div>
  )
}
