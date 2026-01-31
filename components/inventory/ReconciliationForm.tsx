'use client'

import { useState, useMemo } from 'react'
import { Search, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { InventoryItem } from './InventoryCard'
import { getCategoryLabel } from './CategoryFilter'

interface ReconciliationFormProps {
  items: InventoryItem[]
  onSubmit: (
    items: { inventoryItemId: string; physicalCount: number }[],
    notes?: string
  ) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

interface CountEntry {
  inventoryItemId: string
  physicalCount: string
  touched: boolean
}

export function ReconciliationForm({
  items,
  onSubmit,
  onCancel,
  isSubmitting,
}: ReconciliationFormProps) {
  const { t, locale } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [notes, setNotes] = useState('')
  const [counts, setCounts] = useState<Map<string, CountEntry>>(new Map())

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category))
    return Array.from(cats).sort()
  }, [items])

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const name = locale === 'fr' && item.nameFr ? item.nameFr : item.name
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !categoryFilter || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [items, searchQuery, categoryFilter, locale])

  // Update count for an item
  const updateCount = (itemId: string, value: string) => {
    const newCounts = new Map(counts)
    newCounts.set(itemId, {
      inventoryItemId: itemId,
      physicalCount: value,
      touched: true,
    })
    setCounts(newCounts)
  }

  // Get count entry for an item
  const getCount = (itemId: string): CountEntry => {
    return counts.get(itemId) || {
      inventoryItemId: itemId,
      physicalCount: '',
      touched: false,
    }
  }

  // Calculate variance preview
  const getVariance = (item: InventoryItem) => {
    const entry = getCount(item.id)
    if (!entry.touched || entry.physicalCount === '') return null
    const physical = parseFloat(entry.physicalCount)
    if (isNaN(physical)) return null
    return physical - item.currentStock
  }

  // Count touched items
  const touchedCount = Array.from(counts.values()).filter(c => c.touched && c.physicalCount !== '').length
  const totalVariances = Array.from(counts.entries()).filter(([id]) => {
    const item = items.find(i => i.id === id)
    if (!item) return false
    const variance = getVariance(item)
    return variance !== null && variance !== 0
  }).length

  // Handle submit
  const handleSubmit = async () => {
    const itemsToSubmit = Array.from(counts.values())
      .filter(c => c.touched && c.physicalCount !== '')
      .map(c => ({
        inventoryItemId: c.inventoryItemId,
        physicalCount: parseFloat(c.physicalCount),
      }))
      .filter(c => !isNaN(c.physicalCount))

    if (itemsToSubmit.length === 0) {
      return
    }

    await onSubmit(itemsToSubmit, notes || undefined)
  }

  // Get display name
  const getDisplayName = (item: InventoryItem) => {
    return locale === 'fr' && item.nameFr ? item.nameFr : item.name
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-stone-700">
            <ClipboardList className="w-6 h-6 text-gray-600 dark:text-stone-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
              {t('inventory.reconciliation.countEntry') || 'Enter Physical Counts'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {t('inventory.reconciliation.countEntryDescription') ||
                'Enter the actual physical count for each item. Leave blank to skip items.'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-stone-100">
              {touchedCount}/{items.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-stone-400">
              {t('inventory.reconciliation.itemsCounted') || 'Items counted'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('inventory.searchPlaceholder') || 'Search items...'}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 transition-colors"
        >
          <option value="">{t('inventory.allCategories') || 'All Categories'}</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat, t)}
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-stone-700/50 border-b border-gray-200 dark:border-stone-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.item') || 'Item'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.category') || 'Category'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.reconciliation.systemStock') || 'System Stock'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider w-40">
                  {t('inventory.reconciliation.physicalCount') || 'Physical Count'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-stone-400 uppercase tracking-wider">
                  {t('inventory.reconciliation.variance') || 'Variance'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
              {filteredItems.map((item) => {
                const entry = getCount(item.id)
                const variance = getVariance(item)
                return (
                  <tr
                    key={item.id}
                    className={`${
                      entry.touched
                        ? 'bg-gray-50 dark:bg-stone-700/30'
                        : 'hover:bg-gray-50 dark:hover:bg-stone-700/50'
                    } transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-stone-100">
                        {getDisplayName(item)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300">
                        {getCategoryLabel(item.category, t)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums">
                      <span className="text-gray-900 dark:text-stone-100">
                        {item.currentStock}
                      </span>
                      <span className="ml-1 text-gray-500 dark:text-stone-400 text-sm">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.physicalCount}
                        onChange={(e) => updateCount(item.id, e.target.value)}
                        placeholder={item.currentStock.toString()}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-center tabular-nums transition-colors"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {variance !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                            variance === 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : variance > 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {variance === 0 ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : variance < 0 ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : null}
                          {variance > 0 ? '+' : ''}
                          {variance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-stone-500">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
          {t('inventory.reconciliation.notes') || 'Notes (optional)'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t('inventory.reconciliation.notesPlaceholder') || 'Add any comments about this reconciliation...'}
          className="w-full px-4 py-3 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-stone-400">
          {totalVariances > 0 && (
            <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {`${totalVariances} ${t('inventory.reconciliation.variancesLabel') || 'variance(s) found'}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || touchedCount === 0}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? t('common.submitting') || 'Submitting...'
              : t('inventory.reconciliation.submit') || 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
