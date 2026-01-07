'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

const PRESET_COLORS = [
  { name: 'Terracotta', value: '#C45C26' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Warm Brown', value: '#8B4513' },
  { name: 'Burnt Sienna', value: '#A0522D' },
  { name: 'Sky Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Pink', value: '#EC4899' },
]

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState(value)

  const handlePresetClick = (color: string) => {
    onChange(color)
    setCustomHex(color)
  }

  const handleCustomChange = (hex: string) => {
    setCustomHex(hex)
    // Validate hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex)
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Current Color Preview */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">Selected Color</p>
          <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
            {value.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preset Colors</p>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handlePresetClick(color.value)}
              className="relative w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              style={{
                backgroundColor: color.value,
                borderColor: value === color.value ? '#000' : 'transparent',
              }}
              title={color.name}
            >
              {value === color.value && (
                <Check className="w-5 h-5 absolute inset-0 m-auto text-white drop-shadow-lg" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Hex Input */}
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Custom Hex Color
        </label>
        <input
          type="text"
          value={customHex}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-terracotta-500 dark:bg-dark-700 dark:text-white"
        />
        {customHex && !/^#[0-9A-Fa-f]{6}$/.test(customHex) && (
          <p className="mt-1 text-xs text-red-500">Invalid hex format (use #RRGGBB)</p>
        )}
      </div>
    </div>
  )
}
