'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Info, XCircle, X } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'info' | 'error'
  duration?: number
  color?: string
  onClose: () => void
}

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  color,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 300) // Animation duration
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info

  // Use custom color or default based on type
  const bgColor = color || (type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#C45C26')

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[250px]"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={() => {
            setIsLeaving(true)
            setTimeout(onClose, 300)
          }}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
