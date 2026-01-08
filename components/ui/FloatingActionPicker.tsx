'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export interface FloatingActionItem {
  id: string
  label: string
  sublabel?: string
  color: string
  icon?: React.ReactNode
  isActive?: boolean
}

interface FloatingActionPickerProps {
  isOpen: boolean
  onClose: () => void
  items: FloatingActionItem[]
  onSelect: (item: FloatingActionItem) => void
  position?: 'bottom' | 'bottom-left' | 'bottom-right'
}

export function FloatingActionPicker({
  isOpen,
  onClose,
  items,
  onSelect,
  position = 'bottom'
}: FloatingActionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }
    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const positionClasses = {
    'bottom': 'left-1/2 -translate-x-1/2',
    'bottom-left': 'left-4',
    'bottom-right': 'right-4'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating buttons container - horizontal layout */}
      <div
        ref={containerRef}
        className={`
          fixed bottom-6 z-50
          ${positionClasses[position]}
          flex flex-row items-center gap-3
        `}
        role="menu"
        aria-label="Select bakery"
      >
        {/* Action buttons - pill style matching nav buttons */}
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => {
              onSelect(item)
              onClose()
            }}
            className={`
              flex items-center gap-3 px-5 py-3 rounded-full
              font-semibold text-base tracking-wide
              text-white shadow-md
              transition-all duration-300 ease-out
              hover:shadow-lg hover:scale-105 active:scale-95
              animate-slide-up
              ${item.isActive ? 'ring-2 ring-white/50' : ''}
            `}
            style={{
              backgroundColor: item.color,
              animationDelay: `${(items.length - 1 - index) * 50}ms`
            }}
            role="menuitem"
          >
            {/* Icon */}
            {item.icon && (
              <span className="w-5 h-5 flex items-center justify-center">
                {item.icon}
              </span>
            )}

            {/* Label */}
            <span>{item.label}</span>

            {/* Active indicator */}
            {item.isActive && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}

        {/* Close button on the right */}
        <button
          onClick={onClose}
          className="
            w-12 h-12 rounded-full
            bg-gray-200 dark:bg-gray-700
            text-gray-600 dark:text-gray-300
            flex items-center justify-center
            shadow-lg hover:shadow-xl
            transform transition-all duration-300
            hover:scale-105 active:scale-95
            animate-slide-up
          "
          style={{ animationDelay: `${items.length * 50}ms` }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

    </>
  )
}

export default FloatingActionPicker
