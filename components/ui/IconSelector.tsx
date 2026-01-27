'use client'

import { useState } from 'react'
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Settings,
  Wrench,
  Zap,
  Star,
  Heart,
  Home,
  Building,
  Store,
  Truck,
  Box,
  Archive,
  Layers,
  Tag,
  Bookmark,
  Flag,
  Award,
  Target,
  Activity,
  BarChart,
  PieChart,
  Coffee,
  Utensils,
  Search,
} from 'lucide-react'

interface IconSelectorProps {
  value: string
  onChange: (icon: string) => void
  label?: string
}

const AVAILABLE_ICONS = [
  { name: 'Package', component: Package },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'DollarSign', component: DollarSign },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'TrendingDown', component: TrendingDown },
  { name: 'Users', component: Users },
  { name: 'FileText', component: FileText },
  { name: 'Calendar', component: Calendar },
  { name: 'Clock', component: Clock },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'XCircle', component: XCircle },
  { name: 'AlertCircle', component: AlertCircle },
  { name: 'Info', component: Info },
  { name: 'Settings', component: Settings },
  { name: 'Wrench', component: Wrench },
  { name: 'Zap', component: Zap },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Home', component: Home },
  { name: 'Building', component: Building },
  { name: 'Store', component: Store },
  { name: 'Truck', component: Truck },
  { name: 'Box', component: Box },
  { name: 'Archive', component: Archive },
  { name: 'Layers', component: Layers },
  { name: 'Tag', component: Tag },
  { name: 'Bookmark', component: Bookmark },
  { name: 'Flag', component: Flag },
  { name: 'Award', component: Award },
  { name: 'Target', component: Target },
  { name: 'Activity', component: Activity },
  { name: 'BarChart', component: BarChart },
  { name: 'PieChart', component: PieChart },
  { name: 'Coffee', component: Coffee },
  { name: 'Utensils', component: Utensils },
]

export function IconSelector({ value, onChange, label }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedIcon = AVAILABLE_ICONS.find((icon) => icon.name === value)
  const SelectedIconComponent = selectedIcon?.component

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Current Icon Preview */}
      {SelectedIconComponent && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-stone-700 rounded-lg border border-gray-200 dark:border-stone-600">
          <SelectedIconComponent className="w-8 h-8 text-gray-700" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Selected Icon</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search icons..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:bg-stone-700 dark:text-white"
        />
      </div>

      {/* Icon Grid */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-stone-600 rounded-lg p-2">
        <div className="grid grid-cols-6 gap-2">
          {filteredIcons.map((icon) => {
            const IconComponent = icon.component
            const isSelected = value === icon.name

            return (
              <button
                key={icon.name}
                type="button"
                onClick={() => onChange(icon.name)}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  isSelected
                    ? 'border-gray-900 bg-gray-100 dark:bg-stone-700'
                    : 'border-gray-200 dark:border-stone-600 hover:border-gray-400'
                }`}
                title={icon.name}
              >
                <IconComponent
                  className={`w-6 h-6 ${
                    isSelected
                      ? 'text-gray-900 dark:text-stone-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
              </button>
            )
          })}
        </div>
        {filteredIcons.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            No icons found
          </p>
        )}
      </div>
    </div>
  )
}
