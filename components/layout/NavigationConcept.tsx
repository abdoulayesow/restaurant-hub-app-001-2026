'use client'

/**
 * BAKERY HUB NAVIGATION CONCEPT
 *
 * Design Direction: "Rising Dough"
 * - Warm artisan bakery aesthetic with terracotta and cream
 * - Pill-based main navigation with expanding sub-items
 * - Sidebar drawer for bakery switching
 * - Organic animations inspired by bread rising
 *
 * This is a concept file demonstrating the proposed navigation pattern.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard,
  ChefHat,
  Wallet,
  TrendingUp,
  Target,
  Package,
  Utensils,
  Receipt,
  Building2,
  ChevronDown,
  X,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Check
} from 'lucide-react'

// ============================================================================
// DESIGN TOKENS - Brand-aligned color system
// ============================================================================

const colors = {
  // Primary palette (terracotta family)
  terracotta: {
    50: '#FEF7F4',
    100: '#FDEEE8',
    200: '#FADDD0',
    300: '#F5C4AD',
    400: '#E89A71',
    500: '#C45C26', // Primary
    600: '#A84D20',
    700: '#8B3A14', // Accent
    800: '#6E2E10',
    900: '#5C2E13', // Dark
  },
  // Warm neutrals (cream family)
  cream: {
    50: '#FFFCF7',
    100: '#FFF8E7', // Cream
    200: '#FFE4C4', // Warm
    300: '#F5D4A8',
    400: '#E8C08A',
    500: '#D4A574',
  },
  // Dark mode palette
  dark: {
    900: '#1A1412',
    800: '#2D241F',
    700: '#3D322B',
    600: '#4D4238',
    500: '#5D524A',
  }
}

// ============================================================================
// BREAD ICON - XL Version (72x72)
// ============================================================================

const BreadIconXL = ({ className = '' }: { className?: string }) => (
  <svg
    width="72"
    height="72"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <circle cx="32" cy="32" r="30" fill="#FFF8E7" />
    <circle cx="32" cy="32" r="30" stroke="#C45C26" strokeWidth="2" />
    <path
      d="M14 38C14 38 14 30 20 26C26 22 38 22 44 26C50 30 50 38 50 38C50 42 46 46 32 46C18 46 14 42 14 38Z"
      fill="#FFE4C4"
      stroke="#C45C26"
      strokeWidth="2"
    />
    <path
      d="M18 30C18 30 22 18 32 18C42 18 46 30 46 30"
      stroke="#8B3A14"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M24 26L28 34" stroke="#C45C26" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 24L32 34" stroke="#C45C26" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 26L36 34" stroke="#C45C26" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 14C26 14 27 10 26 8" stroke="#E07B3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M32 12C32 12 33 8 32 6" stroke="#E07B3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M38 14C38 14 39 10 38 8" stroke="#E07B3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
)

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

interface NavSubItem {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  href: string
}

interface NavItem {
  id: string
  label: string
  labelFr: string
  icon: React.ElementType
  subItems: NavSubItem[]
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelFr: 'Tableau',
    icon: LayoutDashboard,
    subItems: [
      { id: 'current', label: 'Current', labelFr: 'Actuel', icon: TrendingUp, href: '/dashboard' },
      { id: 'projection', label: 'Projection', labelFr: 'Projection', icon: Target, href: '/dashboard/projection' },
    ]
  },
  {
    id: 'baking',
    label: 'Baking',
    labelFr: 'Boulangerie',
    icon: ChefHat,
    subItems: [
      { id: 'production', label: 'Production', labelFr: 'Production', icon: Utensils, href: '/baking/production' },
      { id: 'inventory', label: 'Inventory', labelFr: 'Inventaire', icon: Package, href: '/baking/inventory' },
    ]
  },
  {
    id: 'finances',
    label: 'Finances',
    labelFr: 'Finances',
    icon: Wallet,
    subItems: [
      { id: 'sales', label: 'Sales', labelFr: 'Ventes', icon: TrendingUp, href: '/finances/sales' },
      { id: 'expenses', label: 'Expenses', labelFr: 'Dépenses', icon: Receipt, href: '/finances/expenses' },
      { id: 'bank', label: 'Bank', labelFr: 'Banque', icon: Building2, href: '/finances/bank' },
    ]
  },
]

// Mock bakeries for demonstration
const mockBakeries = [
  { id: '1', name: 'Boulangerie Centrale', location: 'Conakry Centre', color: '#C45C26' },
  { id: '2', name: 'Pain Doré Kaloum', location: 'Kaloum', color: '#8B4513' },
  { id: '3', name: 'La Mie Dorée', location: 'Ratoma', color: '#A0522D' },
]

// ============================================================================
// STYLES - CSS-in-JS for the concept
// ============================================================================

const styles = `
  /* Import distinctive fonts */
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  :root {
    --font-display: 'DM Serif Display', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;

    /* Light mode */
    --bg-primary: #FFFCF7;
    --bg-secondary: #FFF8E7;
    --bg-tertiary: #FFE4C4;
    --text-primary: #5C2E13;
    --text-secondary: #8B3A14;
    --text-muted: #A08060;
    --accent: #C45C26;
    --accent-hover: #A84D20;
    --border: rgba(196, 92, 38, 0.15);
    --shadow: rgba(92, 46, 19, 0.1);
    --grain-opacity: 0.03;
  }

  .dark {
    --bg-primary: #1A1412;
    --bg-secondary: #2D241F;
    --bg-tertiary: #3D322B;
    --text-primary: #FFF8E7;
    --text-secondary: #FFE4C4;
    --text-muted: #A08060;
    --accent: #E89A71;
    --accent-hover: #F5C4AD;
    --border: rgba(232, 154, 113, 0.2);
    --shadow: rgba(0, 0, 0, 0.3);
    --grain-opacity: 0.05;
  }

  /* Flour grain texture overlay */
  .grain-overlay {
    position: relative;
  }
  .grain-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: var(--grain-opacity);
    pointer-events: none;
    border-radius: inherit;
  }

  /* Rising dough animation */
  @keyframes rise {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-2px) scale(1.02); }
    100% { transform: translateY(0) scale(1); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes breadSteam {
    0%, 100% { opacity: 0.4; transform: translateY(0) scaleY(1); }
    50% { opacity: 0.7; transform: translateY(-3px) scaleY(1.1); }
  }

  .nav-item-hover:hover {
    animation: rise 0.4s ease-out;
  }

  .dropdown-enter {
    animation: fadeInUp 0.25s ease-out forwards;
  }

  .drawer-enter {
    animation: slideIn 0.3s ease-out forwards;
  }

  /* Warm shadow */
  .warm-shadow {
    box-shadow:
      0 4px 6px -1px var(--shadow),
      0 2px 4px -2px var(--shadow),
      0 0 0 1px var(--border);
  }

  .warm-shadow-lg {
    box-shadow:
      0 10px 25px -5px var(--shadow),
      0 8px 10px -6px var(--shadow),
      0 0 0 1px var(--border);
  }
`

// ============================================================================
// NAV PILL COMPONENT - Individual navigation category
// ============================================================================

interface NavPillProps {
  item: NavItem
  isActive: boolean
  isExpanded: boolean
  onToggle: () => void
  onSubItemClick: (href: string) => void
  activeSubItem?: string
  locale: 'en' | 'fr'
}

function NavPill({
  item,
  isActive,
  isExpanded,
  onToggle,
  onSubItemClick,
  activeSubItem,
  locale
}: NavPillProps) {
  const Icon = item.icon
  const dropdownRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative">
      {/* Main pill button */}
      <button
        onClick={onToggle}
        className={`
          nav-item-hover
          flex items-center gap-2 px-4 py-2.5 rounded-full
          font-medium text-sm tracking-wide
          transition-all duration-300 ease-out
          ${isActive || isExpanded
            ? 'bg-[var(--accent)] text-white shadow-md'
            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
        style={{
          fontFamily: 'var(--font-body)',
        }}
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
            dropdown-enter
            absolute top-full left-1/2 -translate-x-1/2 mt-2
            min-w-[180px] p-2
            bg-[var(--bg-primary)] rounded-2xl
            warm-shadow-lg
            grain-overlay
            z-50
          "
        >
          {/* Decorative arrow */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[var(--bg-primary)]"
            style={{ boxShadow: '-2px -2px 4px var(--shadow)' }}
          />

          {/* Sub-items */}
          <div className="relative space-y-1">
            {item.subItems.map((subItem, index) => {
              const SubIcon = subItem.icon
              const isSubActive = activeSubItem === subItem.id

              return (
                <button
                  key={subItem.id}
                  onClick={() => onSubItemClick(subItem.href)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    text-left text-sm font-medium
                    transition-all duration-200
                    ${isSubActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div className={`
                    p-2 rounded-lg
                    ${isSubActive
                      ? 'bg-white/20'
                      : 'bg-[var(--bg-tertiary)]'
                    }
                  `}>
                    <SubIcon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span>{locale === 'fr' ? subItem.labelFr : subItem.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BAKERY DRAWER COMPONENT - Slide-out bakery selector
// ============================================================================

interface BakeryDrawerProps {
  isOpen: boolean
  onClose: () => void
  bakeries: typeof mockBakeries
  currentBakeryId: string
  onSelectBakery: (id: string) => void
  locale: 'en' | 'fr'
}

function BakeryDrawer({
  isOpen,
  onClose,
  bakeries,
  currentBakeryId,
  onSelectBakery,
  locale
}: BakeryDrawerProps) {
  const currentBakery = bakeries.find(b => b.id === currentBakeryId)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="
        drawer-enter
        fixed left-0 top-0 bottom-0 w-80
        bg-[var(--bg-primary)]
        warm-shadow-lg
        grain-overlay
        z-50
        flex flex-col
      ">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {locale === 'fr' ? 'Mes Boulangeries' : 'My Bakeries'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Current bakery highlight */}
          {currentBakery && (
            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: `${currentBakery.color}15`,
                borderLeft: `4px solid ${currentBakery.color}`
              }}
            >
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {locale === 'fr' ? 'Actuellement' : 'Currently Active'}
              </p>
              <p
                className="text-lg text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {currentBakery.name}
              </p>
              <p className="text-sm text-[var(--text-muted)]">{currentBakery.location}</p>
            </div>
          )}
        </div>

        {/* Bakery list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3 px-2">
            {locale === 'fr' ? 'Changer de boulangerie' : 'Switch Bakery'}
          </p>

          <div className="space-y-2">
            {bakeries.map((bakery, index) => {
              const isSelected = bakery.id === currentBakeryId

              return (
                <button
                  key={bakery.id}
                  onClick={() => {
                    onSelectBakery(bakery.id)
                    onClose()
                  }}
                  className={`
                    w-full p-4 rounded-xl text-left
                    transition-all duration-200
                    ${isSelected
                      ? 'bg-[var(--bg-tertiary)]'
                      : 'hover:bg-[var(--bg-secondary)]'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Color indicator */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor: bakery.color,
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {bakery.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[var(--text-primary)] font-medium truncate"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {bakery.name}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] truncate">
                        {bakery.location}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="w-5 h-5 text-[var(--accent)]" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-center text-[var(--text-muted)]">
            {bakeries.length} {locale === 'fr' ? 'boulangeries accessibles' : 'bakeries accessible'}
          </p>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// MAIN NAVIGATION HEADER COMPONENT
// ============================================================================

export function NavigationConcept() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [activeSubItem, setActiveSubItem] = useState('current')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentBakeryId, setCurrentBakeryId] = useState('1')
  const [isDark, setIsDark] = useState(false)
  const [locale, setLocale] = useState<'en' | 'fr'>('fr')

  const currentBakery = mockBakeries.find(b => b.id === currentBakeryId)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.nav-dropdown-container')) {
        setExpandedItem(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSubItemClick = (href: string) => {
    console.log('Navigate to:', href)
    setExpandedItem(null)
    // Extract sub-item id from href for demo
    const subId = href.split('/').pop()
    if (subId) setActiveSubItem(subId)
  }

  return (
    <>
      <style>{styles}</style>

      <div className={isDark ? 'dark' : ''}>
        {/* Full page container for demo */}
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">

          {/* HEADER */}
          <header className="
            sticky top-0 z-40
            bg-[var(--bg-primary)]/95 backdrop-blur-md
            border-b border-[var(--border)]
            grain-overlay
          ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-24">

                {/* LEFT: Logo + Bakery trigger */}
                <div className="flex items-center gap-4">
                  {/* Logo with bread icon */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="
                      flex items-center gap-3
                      p-2 -ml-2 rounded-2xl
                      hover:bg-[var(--bg-secondary)]
                      transition-all duration-300
                      group
                    "
                  >
                    <div className="relative">
                      <BreadIconXL className="transition-transform duration-300 group-hover:scale-105" />
                      {/* Steam animation on hover */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <div className="w-0.5 h-3 bg-[var(--accent)] rounded-full" style={{ animation: 'breadSteam 1.5s ease-in-out infinite' }} />
                          <div className="w-0.5 h-4 bg-[var(--accent)] rounded-full" style={{ animation: 'breadSteam 1.5s ease-in-out infinite 0.2s' }} />
                          <div className="w-0.5 h-3 bg-[var(--accent)] rounded-full" style={{ animation: 'breadSteam 1.5s ease-in-out infinite 0.4s' }} />
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <h1
                        className="text-2xl text-[var(--text-primary)] leading-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Bakery<span className="text-[var(--accent)]">Hub</span>
                      </h1>
                      {currentBakery && (
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: currentBakery.color }}
                          />
                          {currentBakery.name}
                        </p>
                      )}
                    </div>
                  </button>
                </div>

                {/* CENTER: Navigation pills */}
                <nav className="hidden lg:flex items-center gap-2 nav-dropdown-container">
                  {navigationItems.map(item => (
                    <NavPill
                      key={item.id}
                      item={item}
                      isActive={item.subItems.some(sub => sub.id === activeSubItem)}
                      isExpanded={expandedItem === item.id}
                      onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      onSubItemClick={handleSubItemClick}
                      activeSubItem={activeSubItem}
                      locale={locale}
                    />
                  ))}
                </nav>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-2">
                  {/* Language toggle */}
                  <button
                    onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                    className="
                      px-3 py-1.5 rounded-full
                      text-xs font-bold tracking-wider
                      bg-[var(--bg-secondary)] text-[var(--text-primary)]
                      hover:bg-[var(--bg-tertiary)]
                      transition-colors
                    "
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {locale === 'fr' ? 'EN' : 'FR'}
                  </button>

                  {/* Theme toggle */}
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="
                      p-2.5 rounded-full
                      bg-[var(--bg-secondary)]
                      hover:bg-[var(--bg-tertiary)]
                      transition-all duration-300
                    "
                  >
                    {isDark ? (
                      <Sun className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-[var(--text-secondary)]" />
                    )}
                  </button>

                  {/* User menu */}
                  <button className="
                    flex items-center gap-2 px-3 py-2 rounded-full
                    bg-[var(--bg-secondary)]
                    hover:bg-[var(--bg-tertiary)]
                    transition-colors
                  ">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* DEMO CONTENT */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2
                className="text-4xl text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Navigation Concept Demo
              </h2>
              <p className="text-[var(--text-muted)] max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
                Click the <strong>BakeryHub logo</strong> to open the bakery drawer.
                Click <strong>Dashboard, Baking, or Finances</strong> to see the dropdown sub-items.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Pill Navigation',
                  desc: 'Clean pills with expanding dropdowns. Sub-items reveal smoothly with staggered animation.'
                },
                {
                  title: 'Bakery Drawer',
                  desc: 'Slide-out drawer for switching between bakeries. Shows current bakery with accent color.'
                },
                {
                  title: 'Artisan Aesthetic',
                  desc: 'Warm terracotta palette, flour-grain texture, organic "rising dough" animations.'
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="
                    p-6 rounded-2xl
                    bg-[var(--bg-secondary)]
                    warm-shadow
                    grain-overlay
                  "
                >
                  <h3
                    className="text-lg text-[var(--text-primary)] mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Mobile navigation hint */}
            <div className="lg:hidden mt-12 text-center">
              <p className="text-[var(--text-muted)] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                📱 On mobile, navigation becomes a bottom tab bar or hamburger menu.
                This concept focuses on desktop layout.
              </p>
            </div>
          </main>
        </div>

        {/* Bakery Drawer */}
        <BakeryDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          bakeries={mockBakeries}
          currentBakeryId={currentBakeryId}
          onSelectBakery={setCurrentBakeryId}
          locale={locale}
        />
      </div>
    </>
  )
}

export default NavigationConcept
