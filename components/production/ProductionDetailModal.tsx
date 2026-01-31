'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X,
  Package,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  Utensils,
  Trash2,
  Edit3,
  Croissant,
  Wheat,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ProductionStatus, SubmissionStatus } from '@prisma/client'
import { canApprove, canEditApproved } from '@/lib/roles'

interface ProductionDetailModalProps {
  production: {
    id: string
    productName: string
    productNameFr: string | null
    quantity: number
    date: string
    estimatedCostGNF: number | null
    preparationStatus: ProductionStatus
    status: SubmissionStatus
    notes: string | null
    stockDeducted: boolean
    stockDeductedAt: string | null
    createdByName: string | null
    createdAt: string
    updatedAt: string
    productionType?: 'Patisserie' | 'Boulangerie' | null
    ingredientDetails: Array<{
      itemId: string
      itemName: string
      quantity: number
      unit: string
      unitCostGNF: number
      currentStock?: number
    }>
  } | null
  isOpen: boolean
  onClose: () => void
  userRole: string | null | undefined
  onStatusChange?: (productionId: string, newStatus: ProductionStatus) => Promise<void>
  onDelete?: (productionId: string) => Promise<void>
  onEdit?: (productionId: string) => void
  onUpdate?: () => void
}

export function ProductionDetailModal({
  production,
  isOpen,
  onClose,
  userRole,
  onStatusChange,
  onDelete,
  onEdit,
  onUpdate,
}: ProductionDetailModalProps) {
  const { t, locale } = useLocale()
  const [changing, setChanging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'timeline'>('overview')

  if (!isOpen || !production) return null

  const isManager = canApprove(userRole)
  const canEdit = canEditApproved(userRole)

  const productName =
    locale === 'fr' && production.productNameFr
      ? production.productNameFr
      : production.productName

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-GN') + ' GNF'
  }

  const handleStatusChange = async (newStatus: ProductionStatus) => {
    if (!onStatusChange) return

    setChanging(true)
    try {
      await onStatusChange(production.id, newStatus)
      onUpdate?.()
    } finally {
      setChanging(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setDeleting(true)
    try {
      await onDelete(production.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeleting(false)
    }
  }

  const totalCost =
    production.ingredientDetails?.reduce(
      (sum, ing) => sum + ing.quantity * ing.unitCostGNF,
      0
    ) || production.estimatedCostGNF || 0

  const ingredientCount = production.ingredientDetails?.length || 0

  // Sort ingredients by cost (highest first)
  const sortedIngredients = [...(production.ingredientDetails || [])].sort(
    (a, b) => b.quantity * b.unitCostGNF - a.quantity * a.unitCostGNF
  )

  // Calculate percentages for each ingredient
  const ingredientsWithPercentage = sortedIngredients.map(ing => ({
    ...ing,
    totalCost: ing.quantity * ing.unitCostGNF,
    percentage: totalCost > 0 ? ((ing.quantity * ing.unitCostGNF) / totalCost) * 100 : 0,
  }))

  // Production type icon and color
  const getProductionTypeConfig = () => {
    if (production.productionType === 'Patisserie') {
      return {
        icon: Croissant,
        label: locale === 'fr' ? 'Pâtisserie' : 'Pastry',
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
      }
    } else if (production.productionType === 'Boulangerie') {
      return {
        icon: Wheat,
        label: locale === 'fr' ? 'Boulangerie' : 'Bakery',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700',
      }
    }
    return {
      icon: Utensils,
      label: locale === 'fr' ? 'Production' : 'Production',
      color: 'bg-stone-100 dark:bg-stone-700/50 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600',
    }
  }

  const typeConfig = getProductionTypeConfig()
  const TypeIcon = typeConfig.icon

  // Status workflow steps - simplified to match actual production cycle
  const workflowSteps = [
    {
      key: 'planning',
      label: t('production.statusPlanning') || (locale === 'fr' ? 'Planification' : 'Planning'),
      completed: true, // Always completed since production exists
      date: production.createdAt,
      description: t('production.timelinePlanningDesc') || (locale === 'fr' ? 'Production créée et enregistrée' : 'Production created and recorded'),
    },
    {
      key: 'completed',
      label: t('production.statusComplete') || (locale === 'fr' ? 'Terminé' : 'Complete'),
      completed: production.preparationStatus === 'Complete',
      date: production.preparationStatus === 'Complete' ? production.updatedAt : null,
      description: production.stockDeducted
        ? (t('production.timelineCompleteDesc') || (locale === 'fr' ? 'Production terminée, stock déduit' : 'Production completed, stock deducted'))
        : (t('production.timelineCompleteDescNoStock') || (locale === 'fr' ? 'Production terminée' : 'Production completed')),
    },
    {
      key: 'approved',
      label: t('production.statusApproved') || (locale === 'fr' ? 'Approuvé' : 'Approved'),
      completed: production.status === 'Approved',
      date: production.status === 'Approved' ? production.updatedAt : null,
      description: t('production.timelineApprovedDesc') || (locale === 'fr' ? 'Approuvé par le gestionnaire' : 'Approved by manager'),
    },
  ]

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'Approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400'
    }
  }

  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'Planning':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Complete':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      default:
        return 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400'
    }
  }

  // Determine if delete is allowed (Owner only, not Complete or Approved)
  const canDelete =
    canEdit &&
    onDelete &&
    production.preparationStatus !== 'Complete' &&
    production.status !== 'Approved'

  // Determine if edit is allowed (Owner only, Planning status)
  const canEditProduction =
    canEdit &&
    onEdit &&
    production.preparationStatus === 'Planning'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="pointer-events-auto animate-modal-entrance w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-stone-900 rounded-2xl shadow-2xl flex flex-col border border-stone-200 dark:border-stone-700">
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm">
                  <TypeIcon className="w-7 h-7 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.color}`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      {typeConfig.label}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 truncate mb-2">
                    {productName}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(production.preparationStatus)}`}>
                      {production.preparationStatus === 'Planning' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {t(`production.status${production.preparationStatus}`) || production.preparationStatus}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(production.status)}`}>
                      {t(`common.${production.status.toLowerCase()}`) || production.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5 text-stone-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
            <div className="px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {t('production.overview') || 'Overview'}
                </button>
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'ingredients'
                      ? 'border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {t('production.ingredients') || 'Ingredients'} ({ingredientCount})
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'timeline'
                      ? 'border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {t('production.timeline') || 'Timeline'}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quantity Card */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                          {t('production.quantity') || 'Quantity'}
                        </span>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 tabular-nums mb-1">
                      {production.quantity}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      {locale === 'fr' ? 'unités produites' : 'units produced'}
                    </p>
                  </div>

                  {/* Date Card */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                          {t('production.date') || 'Date'}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                      {formatDate(production.date)}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      {locale === 'fr' ? 'date de production' : 'production date'}
                    </p>
                  </div>

                  {/* Cost Card */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                          {t('production.totalCost') || 'Total Cost'}
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums mb-1">
                      {formatCurrency(totalCost)}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      {ingredientCount} {locale === 'fr' ? 'ingrédients' : 'ingredients'}
                    </p>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5 border border-stone-200 dark:border-stone-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-stone-200 dark:bg-stone-700">
                        <User className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">
                          {t('production.createdBy') || 'Created By'}
                        </p>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {production.createdByName || t('common.unknown') || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-stone-200 dark:bg-stone-700">
                        <Calendar className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">
                          {t('common.createdAt') || 'Created'}
                        </p>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {formatDateTime(production.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Deduction Status */}
                <div
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                    production.stockDeducted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${production.stockDeducted ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                    {production.stockDeducted ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-bold mb-1 ${
                        production.stockDeducted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {production.stockDeducted
                        ? t('production.stockDeducted') || 'Stock Deducted'
                        : t('production.stockNotDeducted') || 'Stock Not Yet Deducted'}
                    </p>
                    {production.stockDeductedAt && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatDateTime(production.stockDeductedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {production.notes && (
                  <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5 border border-stone-200 dark:border-stone-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-stone-200 dark:bg-stone-700">
                        <FileText className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 font-medium">
                          {t('production.notes') || 'Notes'}
                        </p>
                        <p className="text-sm text-stone-700 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                          {production.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                {ingredientCount === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Package className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 font-medium">
                      {t('production.noIngredients') || 'No ingredients recorded'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Ingredients List with Visual Bars */}
                    <div className="space-y-3">
                      {ingredientsWithPercentage.map((ingredient, index) => {
                        const hasStock =
                          ingredient.currentStock !== undefined &&
                          ingredient.currentStock >= ingredient.quantity

                        return (
                          <div
                            key={index}
                            className="bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-200 dark:border-stone-700 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/baking/inventory?search=${encodeURIComponent(ingredient.itemName)}`}
                                  className="text-base font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 hover:underline inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-200"
                                >
                                  {ingredient.itemName}
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <div className="flex items-center gap-4 mt-2 text-sm text-stone-500 dark:text-stone-400">
                                  <span className="tabular-nums font-medium">
                                    {ingredient.quantity} {ingredient.unit}
                                  </span>
                                  <span className="text-stone-300 dark:text-stone-600">×</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(ingredient.unitCostGNF)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                                  {formatCurrency(ingredient.totalCost)}
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                  {ingredient.percentage.toFixed(1)}% {locale === 'fr' ? 'du total' : 'of total'}
                                </p>
                              </div>
                            </div>

                            {/* Cost Percentage Bar */}
                            <div className="mb-3">
                              <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 rounded-full transition-all duration-500"
                                  style={{ width: `${ingredient.percentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Stock Status */}
                            {ingredient.currentStock !== undefined && (
                              <div className="flex items-center justify-between">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    hasStock
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}
                                >
                                  {hasStock ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {t('production.available') || 'Available'}
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      {t('production.lowStock') || 'Low Stock'}
                                    </>
                                  )}
                                </span>
                                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                  {locale === 'fr' ? 'Stock actuel:' : 'Current stock:'}{' '}
                                  <span className="font-bold text-stone-700 dark:text-stone-300">
                                    {ingredient.currentStock} {ingredient.unit}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Total Summary */}
                    <div className="flex items-center justify-between py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700">
                      <span className="text-base font-bold text-amber-900 dark:text-amber-200">
                        {t('production.totalEstimatedCost') || 'Total Estimated Cost'}
                      </span>
                      <span className="text-2xl font-bold text-amber-900 dark:text-amber-100 tabular-nums">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                {/* Workflow Timeline */}
                <div className="relative">
                  {workflowSteps.map((step, index) => {
                    const isLast = index === workflowSteps.length - 1
                    return (
                      <div key={step.key} className="relative">
                        {!isLast && (
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-stone-200 dark:bg-stone-700">
                            {step.completed && (
                              <div className="absolute top-0 left-0 w-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500" style={{ height: workflowSteps[index + 1]?.completed ? '100%' : '0%' }} />
                            )}
                          </div>
                        )}
                        <div className="relative flex items-start gap-4 pb-8">
                          <div
                            className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                              step.completed
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-400'
                                : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600'
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Clock className="w-6 h-6 text-stone-400 dark:text-stone-500" />
                            )}
                          </div>
                          <div className="flex-1 pt-2">
                            <p
                              className={`text-base font-bold mb-1 ${
                                step.completed
                                  ? 'text-stone-900 dark:text-stone-100'
                                  : 'text-stone-500 dark:text-stone-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {step.description && (
                              <p className={`text-sm mb-2 ${
                                step.completed
                                  ? 'text-stone-600 dark:text-stone-400'
                                  : 'text-stone-400 dark:text-stone-500'
                              }`}>
                                {step.description}
                              </p>
                            )}
                            {step.date && step.completed && (
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {formatDateTime(step.date)}
                              </p>
                            )}
                            {!step.completed && (
                              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 italic">
                                {t('production.timelinePending') || (locale === 'fr' ? 'En attente' : 'Pending')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Warning if stock not deducted for completed production */}
                {production.preparationStatus === 'Complete' && !production.stockDeducted && (
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                        {locale === 'fr' ? 'Attention: Stock non déduit' : 'Warning: Stock Not Deducted'}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        {locale === 'fr'
                          ? 'Cette production est marquée comme terminée mais le stock n\'a pas encore été déduit.'
                          : 'This production is marked as complete but stock has not been deducted yet.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 px-6 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Left: Status Change Buttons (Manager only) */}
              <div className="flex items-center gap-2 flex-wrap">
                {isManager && onStatusChange && (
                  <>
                    {(['Planning', 'Complete'] as ProductionStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={changing || production.preparationStatus === status}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          production.preparationStatus === status
                            ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/50'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700'
                        }`}
                      >
                        {t(`production.status${status}`) || status}
                      </button>
                    ))}
                  </>
                )}

                {/* Edit Button (Owner only, Planning status) */}
                {canEditProduction && (
                  <button
                    onClick={() => onEdit?.(production.id)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 inline-flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    {t('common.edit') || 'Edit'}
                  </button>
                )}

                {/* Delete Button (Owner only, not Complete or Approved) */}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/50 inline-flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete') || 'Delete'}
                  </button>
                )}
              </div>

              {/* Right: Close Button */}
              <button
                onClick={onClose}
                className="ml-auto px-6 py-2.5 rounded-xl border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold transition-all duration-200"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none">
            <div className="pointer-events-auto animate-modal-entrance w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border-2 border-red-200 dark:border-red-800">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
                      {t('common.confirmDelete') || 'Confirm Delete'}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                      {locale === 'fr'
                        ? `Êtes-vous sûr de vouloir supprimer cette production "${productName}"?`
                        : `Are you sure you want to delete this production "${productName}"?`}
                    </p>
                    {production.stockDeducted && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                          {locale === 'fr'
                            ? '⚠️ Le stock utilisé sera restauré automatiquement.'
                            : '⚠️ Used stock will be automatically restored.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 font-semibold transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {locale === 'fr' ? 'Suppression...' : 'Deleting...'}
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        {t('common.delete') || 'Delete'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
