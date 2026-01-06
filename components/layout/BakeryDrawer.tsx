'use client'

import { X, Check, MapPin, Store } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { colorPalettes, type PaletteName } from '@/components/brand/Logo'

interface Bakery {
  id: string
  name: string
  location: string | null
}

interface BakeryDrawerProps {
  isOpen: boolean
  onClose: () => void
  bakeries: Bakery[]
  currentBakeryId: string | null
  onSelectBakery: (bakery: Bakery) => void
}

const paletteNames: PaletteName[] = ['terracotta', 'warmBrown', 'burntSienna', 'gold']

export function BakeryDrawer({
  isOpen,
  onClose,
  bakeries,
  currentBakeryId,
  onSelectBakery,
}: BakeryDrawerProps) {
  const { t } = useLocale()
  const currentBakery = bakeries.find(b => b.id === currentBakeryId)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="
          animate-slide-in
          fixed left-0 top-0 bottom-0 w-80
          bg-cream-50 dark:bg-dark-900
          warm-shadow-lg
          grain-overlay
          z-50
          flex flex-col
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="bakery-drawer-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-terracotta-500/15 dark:border-terracotta-400/20">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="bakery-drawer-title"
              className="text-xl font-serif text-terracotta-900 dark:text-cream-100"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {t('bakery.myBakeries') || 'My Bakeries'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-cream-200 dark:hover:bg-dark-700 transition-colors"
              aria-label={t('common.close') || 'Close'}
            >
              <X className="w-5 h-5 text-terracotta-600 dark:text-cream-300" />
            </button>
          </div>

          {/* Current bakery highlight */}
          {currentBakery && (
            <div
              className="p-4 rounded-2xl bg-terracotta-500/10 dark:bg-terracotta-400/10"
              style={{
                borderLeft: `4px solid ${colorPalettes[paletteNames[bakeries.findIndex(b => b.id === currentBakeryId) % 4]].primary}`
              }}
            >
              <p className="text-xs uppercase tracking-wider text-terracotta-600/70 dark:text-cream-300/70 mb-1 font-medium">
                {t('bakery.currentlyActive') || 'Currently Active'}
              </p>
              <p
                className="text-lg text-terracotta-900 dark:text-cream-100"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                {currentBakery.name}
              </p>
              {currentBakery.location && (
                <p className="text-sm text-terracotta-600/80 dark:text-cream-300/80 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {currentBakery.location}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bakery list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs uppercase tracking-wider text-terracotta-600/70 dark:text-cream-300/70 mb-3 px-2 font-medium">
            {t('bakery.switchBakery') || 'Switch Bakery'}
          </p>

          <div className="space-y-2">
            {bakeries.map((bakery, index) => {
              const isSelected = bakery.id === currentBakeryId
              const bakeryPalette = colorPalettes[paletteNames[index % 4]]

              return (
                <button
                  key={bakery.id}
                  onClick={() => {
                    onSelectBakery(bakery)
                    onClose()
                  }}
                  className={`
                    w-full p-4 rounded-xl text-left
                    transition-all duration-200
                    ${isSelected
                      ? 'bg-cream-200 dark:bg-dark-700'
                      : 'hover:bg-cream-100 dark:hover:bg-dark-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Color indicator with initial */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor: bakeryPalette.primary,
                        fontFamily: "'DM Serif Display', Georgia, serif"
                      }}
                    >
                      {bakery.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-terracotta-900 dark:text-cream-100 font-medium truncate">
                        {bakery.name}
                      </p>
                      {bakery.location && (
                        <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {bakery.location}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-terracotta-500/15 dark:border-terracotta-400/20">
          <div className="flex items-center justify-center gap-2 text-xs text-terracotta-600/60 dark:text-cream-300/60">
            <Store className="w-4 h-4" />
            <span>
              {bakeries.length} {bakeries.length === 1
                ? (t('bakery.bakeryAccessible') || 'bakery accessible')
                : (t('bakery.bakeriesAccessible') || 'bakeries accessible')
              }
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default BakeryDrawer
