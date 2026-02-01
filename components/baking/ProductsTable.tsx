'use client'

import { Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  PRODUCT_CATEGORY_ICONS,
  PRODUCT_CATEGORY_COLORS,
  type ProductCategoryValue,
} from '@/lib/constants/product-categories'

export interface Product {
  id: string
  name: string
  nameFr: string | null
  category: ProductCategoryValue
  unit: string
  priceGNF: number | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface ProductsTableProps {
  products: Product[]
  isManager: boolean
  onEdit: (product: Product) => void
  onToggleActive: (product: Product) => void
}

export function ProductsTable({
  products,
  isManager,
  onEdit,
  onToggleActive,
}: ProductsTableProps) {
  const { t, locale } = useLocale()

  if (products.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
          <thead className="bg-stone-50 dark:bg-stone-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {t('production.products.productName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {t('inventory.category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {t('production.products.unit')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {t('production.products.price')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {t('common.status')}
              </th>
              {isManager && (
                <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {products.map((product) => {
              const CategoryIcon = PRODUCT_CATEGORY_ICONS[product.category]
              const categoryColors = PRODUCT_CATEGORY_COLORS[product.category]
              const displayName = locale === 'fr' && product.nameFr ? product.nameFr : product.name
              const secondaryName = locale === 'fr' ? product.name : product.nameFr

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors ${
                    !product.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {displayName}
                      </div>
                      {secondaryName && (
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {secondaryName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5" />
                      {t(`production.${product.category.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                    {t(`units.${product.unit}`) || product.unit}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-stone-900 dark:text-stone-100">
                    {product.priceGNF != null ? (
                      <span>
                        {new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN').format(product.priceGNF)}
                        <span className="ml-1 text-xs text-stone-500 dark:text-stone-400">GNF</span>
                      </span>
                    ) : (
                      <span className="text-stone-400 dark:text-stone-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        {t('production.products.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400">
                        {t('production.products.inactive')}
                      </span>
                    )}
                  </td>
                  {isManager && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleActive(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isActive
                              ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                          title={product.isActive ? t('production.products.productDeactivated') : t('production.products.productActivated')}
                        >
                          {product.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
