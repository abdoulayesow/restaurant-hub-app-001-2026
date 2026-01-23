'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export interface NavSubItem {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  href: string
}

export interface NavItemConfig {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  subItems: NavSubItem[]
}

interface NavPillProps {
  item: NavItemConfig
  isActive: boolean
  isExpanded: boolean
  onToggle: () => void
  activeSubItemId?: string
  accentColor: string
}

export function NavPill({
  item,
  isActive,
  isExpanded,
  onToggle,
  activeSubItemId,
  accentColor,
}: NavPillProps) {
  const { locale } = useLocale()
  const Icon = item.icon
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        onToggle()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isExpanded, onToggle])

  return (
    <div className="relative">
      {/* Main pill button */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-haspopup="true"
        className={`
          animate-rise
          flex items-center gap-2 px-4 py-2.5 rounded-full
          font-medium text-sm tracking-wide
          transition-all duration-300 ease-out
          ${isActive || isExpanded
            ? 'text-white shadow-md'
            : 'bg-gray-100 dark:bg-stone-800 text-gray-900 dark:text-stone-100 hover:bg-gray-200 dark:hover:bg-stone-700'
          }
        `}
        style={isActive || isExpanded ? {
          backgroundColor: accentColor,
        } : undefined}
      >
        <Icon className="w-4 h-4" strokeWidth={2.5} />
        <span>{locale === 'fr' ? item.labelFr : item.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown with sub-items */}
      {isExpanded && (
        <div
          ref={dropdownRef}
          className="
            animate-fade-in-up
            absolute top-full left-1/2 -translate-x-1/2 mt-2
            min-w-[200px] p-2
            bg-white dark:bg-stone-800
            rounded-2xl
            shadow-lg
                        z-50
          "
          role="menu"
        >
          {/* Decorative arrow */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-stone-800"
            style={{ boxShadow: '-2px -2px 4px rgba(92, 46, 19, 0.1)' }}
            aria-hidden="true"
          />

          {/* Sub-items */}
          <div className="relative space-y-1">
            {item.subItems.map((subItem, index) => {
              const SubIcon = subItem.icon
              const isSubActive = activeSubItemId === subItem.id

              return (
                <Link
                  key={subItem.id}
                  href={subItem.href}
                  role="menuitem"
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    text-left text-sm font-medium
                    transition-all duration-200
                    ${isSubActive
                      ? 'text-white'
                      : 'text-gray-900 dark:text-stone-100 hover:bg-gray-100 dark:hover:bg-stone-700'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    ...(isSubActive ? { backgroundColor: accentColor } : {})
                  }}
                  onClick={onToggle}
                >
                  <div className={`
                    p-2 rounded-lg
                    ${isSubActive
                      ? 'bg-white/20'
                      : 'bg-gray-200 dark:bg-stone-700'
                    }
                  `}>
                    <SubIcon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span>{locale === 'fr' ? subItem.labelFr : subItem.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default NavPill
