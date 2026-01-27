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
  position?: 'bottom' | 'bottom-left' | 'bottom-right' | 'top'
  showCloseButton?: boolean
}

export function FloatingActionPicker({
  isOpen,
  onClose,
  items,
  onSelect,
  position = 'bottom',
  showCloseButton = true
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
    'bottom': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-6 left-4',
    'bottom-right': 'bottom-6 right-4',
    'top': 'top-[88px] left-1/2 -translate-x-1/2'
  }

  const animationClass = position === 'top' ? 'animate-slide-down' : 'animate-slide-up'

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
          fixed z-50
          ${positionClasses[position]}
          flex flex-row items-center gap-3
        `}
        role="menu"
        aria-label="Select option"
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
              flex items-center gap-2 px-4 py-2 rounded-full
              font-medium text-sm tracking-wide
              text-white shadow-md
              transition-all duration-300 ease-out
              hover:shadow-lg hover:scale-105 active:scale-95
              ${animationClass}
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
              <span className="w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>
            )}

            {/* Label */}
            <span>{item.label}</span>

            {/* Active indicator */}
            {item.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}

        {/* Close button on the right - optional */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className={`
              w-12 h-12 rounded-full
              bg-gray-200 dark:bg-gray-700
              text-gray-600 dark:text-gray-300
              flex items-center justify-center
              shadow-lg hover:shadow-xl
              transform transition-all duration-300
              hover:scale-105 active:scale-95
              ${animationClass}
            `}
            style={{ animationDelay: `${items.length * 50}ms` }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

    </>
  )
}

export default FloatingActionPicker
