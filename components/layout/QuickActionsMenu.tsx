'use client'

import { useState } from 'react'
import { Users, Zap, X, Plus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { colorPalettes } from '@/components/brand/Logo'
import { CustomerQuickCreate } from './CustomerQuickCreate'

interface QuickAction {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  onClick: () => void
}

export function QuickActionsMenu() {
  const { locale } = useLocale()
  const { currentPalette } = useRestaurant()
  const [isOpen, setIsOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)

  const accentColor = colorPalettes[currentPalette].primary

  const quickActions: QuickAction[] = [
    {
      id: 'customers',
      label: 'Add Customer',
      labelFr: 'Ajouter Client',
      icon: Users,
      onClick: () => {
        setCustomerModalOpen(true)
        setIsOpen(false)
      },
    },
  ]

  return (
    <>
      {/* Floating Action Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick Actions Panel */}
        {isOpen && (
          <div
            className="mb-4 w-72 bg-white/95 dark:bg-stone-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-stone-700 overflow-hidden"
            style={{
              animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 border-b border-gray-200 dark:border-stone-700"
              style={{
                background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`,
              }}
            >
              <h3
                className="text-lg font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                <Zap
                  className="w-5 h-5"
                  style={{ color: accentColor }}
                  strokeWidth={2.5}
                />
                {locale === 'fr' ? 'Actions Rapides' : 'Quick Actions'}
              </h3>
              <p className="text-xs text-gray-600/70 dark:text-stone-300/70 mt-1">
                {locale === 'fr'
                  ? 'Raccourcis pour tâches fréquentes'
                  : 'Shortcuts for common tasks'}
              </p>
            </div>

            {/* Actions List */}
            <div className="p-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-xl
                      text-left transition-all duration-300
                      hover:bg-gray-50 dark:hover:bg-stone-700
                      group
                    "
                    style={{
                      animation: `fadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s backwards`,
                    }}
                  >
                    <div
                      className="
                        w-12 h-12 rounded-xl flex items-center justify-center
                        bg-gradient-to-br from-gray-50 to-gray-100
                        dark:from-stone-800 dark:to-stone-700
                        group-hover:scale-110 transition-transform duration-300
                      "
                      style={{
                        boxShadow: `0 2px 12px ${accentColor}20`,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: accentColor }}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-stone-100">
                        {locale === 'fr' ? action.labelFr : action.label}
                      </p>
                      <p className="text-xs text-gray-600/60 dark:text-stone-300/60 mt-0.5">
                        {action.id === 'customers' &&
                          (locale === 'fr'
                            ? 'Créer nouveau client'
                            : 'Create new customer')}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400/40 dark:text-stone-400/40 group-hover:text-gray-600 dark:group-hover:text-stone-200 transition-colors" />
                  </button>
                )
              })}
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-3 bg-gray-50/50 dark:bg-stone-800/50 border-t border-gray-200/20 dark:border-stone-700">
              <p className="text-xs text-gray-600/60 dark:text-stone-300/60 text-center">
                {locale === 'fr'
                  ? 'Plus d\'actions bientôt disponibles'
                  : 'More actions coming soon'}
              </p>
            </div>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-16 h-16 rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-500
            hover:scale-110 active:scale-95
            group
          "
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 8px 32px ${accentColor}40, 0 0 0 0 ${accentColor}30`,
          }}
          aria-label={locale === 'fr' ? 'Actions rapides' : 'Quick actions'}
        >
          {isOpen ? (
            <X className="w-7 h-7 text-white transition-transform duration-300 rotate-90" />
          ) : (
            <Zap className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" strokeWidth={2.5} />
          )}
        </button>

        {/* Ripple effect circles */}
        {!isOpen && (
          <>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                backgroundColor: accentColor,
                opacity: 0.3,
              }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 1s',
                backgroundColor: accentColor,
                opacity: 0.2,
              }}
            />
          </>
        )}
      </div>

      {/* Customer Quick Create Modal */}
      <CustomerQuickCreate
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />
    </>
  )
}
