'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  showCloseButton?: boolean
  maxHeight?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeight = '70vh',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Touch handlers for drag-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    isDragging.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return

    currentY.current = e.touches[0].clientY - startY.current

    // Only allow dragging down
    if (currentY.current > 0) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return
    isDragging.current = false

    // If dragged more than 100px, close the sheet
    if (currentY.current > 100) {
      onClose()
    } else {
      // Snap back
      sheetRef.current.style.transform = ''
      sheetRef.current.style.transition = ''
    }
    currentY.current = 0
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="
          fixed inset-0 z-50
          bg-black/40 backdrop-blur-sm
          animate-[fadeIn_200ms_ease-out]
        "
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-stone-800
          rounded-t-3xl
          shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
          dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)]
          animate-[slideUp_300ms_cubic-bezier(0.32,0.72,0,1)]
                  "
        style={{ maxHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="
              w-10 h-1.5 rounded-full
              bg-gray-300/50 dark:bg-stone-500/30
            "
            aria-hidden="true"
          />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="
            flex items-center justify-between
            px-6 pb-4
            border-b border-gray-200 dark:border-stone-700
          ">
            {title && (
              <h2
                id="bottom-sheet-title"
                className="
                  text-lg font-bold tracking-tight
                  text-gray-900 dark:text-stone-100
                "
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-2 -mr-2 rounded-full
                  hover:bg-gray-200 dark:hover:bg-stone-700
                  transition-colors
                "
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-stone-300" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: `calc(${maxHeight} - 80px)` }}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export default BottomSheet
