'use client'

import React from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   BLISS PATISSERIE LOGO COMPONENT
   Luxury French Patisserie Brand Identity
   ═══════════════════════════════════════════════════════════════════════════ */

// Bliss Patisserie Color Palette (from brand guidelines)
export interface BlissPalette {
  name: string
  primary: string      // Main frame color
  secondary: string    // Gradient end
  accent: string       // Script/text color
  cream: string        // Background
  warm: string         // Warm accent
  decorative: string   // Sparkle/detail color
}

export const blissPalettes: Record<string, BlissPalette> = {
  royalPlum: {
    name: 'Royal Plum',
    primary: '#3D1B4D',
    secondary: '#5A2D6E',
    accent: '#2C1810',
    cream: '#FFFEFE',
    warm: '#6B5744',
    decorative: '#9B4D9F',
  },
  cafeCreme: {
    name: 'Café Crème',
    primary: '#4A3526',
    secondary: '#6B4E3D',
    accent: '#2C1810',
    cream: '#FFF8F0',
    warm: '#8B7355',
    decorative: '#A0826D',
  },
  rosePetal: {
    name: 'Rose Petal',
    primary: '#8B6B7A',
    secondary: '#A68A9F',
    accent: '#5C3D4F',
    cream: '#FFF5F7',
    warm: '#D4A5B8',
    decorative: '#C48FA5',
  },
  pistache: {
    name: 'Pistache',
    primary: '#6B8B6F',
    secondary: '#8FA893',
    accent: '#3D4F3E',
    cream: '#FAFFF5',
    warm: '#A8C4A5',
    decorative: '#9FB89D',
  },
}

export type BlissPaletteName = keyof typeof blissPalettes

interface BlissLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  variant?: 'full' | 'icon' | 'wordmark' | 'minimal'
  palette?: BlissPaletteName
  animate?: boolean
  showTagline?: boolean
  className?: string
}

const sizeMap = {
  xs: { width: 80, height: 48, fontSize: 12, taglineSize: 6 },
  sm: { width: 120, height: 72, fontSize: 16, taglineSize: 7 },
  md: { width: 180, height: 108, fontSize: 22, taglineSize: 8 },
  lg: { width: 260, height: 156, fontSize: 32, taglineSize: 10 },
  xl: { width: 360, height: 216, fontSize: 44, taglineSize: 12 },
  hero: { width: 480, height: 288, fontSize: 60, taglineSize: 14 },
}

/* ─────────────────────────────────────────────────────────────────────────────
   BLISS PATISSERIE ICON - Elegant Frame with Diagonal Stripes
   ───────────────────────────────────────────────────────────────────────────── */
const BlissIcon = ({
  size,
  colors,
  animate,
}: {
  size: number
  colors: BlissPalette
  animate?: boolean
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={animate ? 'animate-float' : ''}
  >
    <defs>
      {/* Gradient for frame */}
      <linearGradient id="plumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.primary} />
        <stop offset="50%" stopColor={colors.secondary} />
        <stop offset="100%" stopColor={colors.decorative} />
      </linearGradient>

      {/* Diagonal stripes pattern */}
      <pattern id="diagonalStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect width="4" height="8" fill={colors.cream} />
        <rect x="4" width="4" height="8" fill={colors.primary} fillOpacity="0.1" />
      </pattern>

      {/* Inner glow */}
      <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feOffset dx="0" dy="1" result="offsetBlur" />
        <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
      </filter>
    </defs>

    {/* Outer decorative frame */}
    <rect
      x="4"
      y="4"
      width="72"
      height="72"
      rx="8"
      fill="url(#plumGradient)"
    />

    {/* Inner cream background with stripes */}
    <rect
      x="8"
      y="8"
      width="64"
      height="64"
      rx="6"
      fill={colors.cream}
    />
    <rect
      x="8"
      y="8"
      width="64"
      height="64"
      rx="6"
      fill="url(#diagonalStripes)"
    />

    {/* Ornate corner decorations */}
    <path
      d="M14 14 L14 22 M14 14 L22 14"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M66 14 L66 22 M66 14 L58 14"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M14 66 L14 58 M14 66 L22 66"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M66 66 L66 58 M66 66 L58 66"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />

    {/* Central "B" monogram in elegant script */}
    <text
      x="40"
      y="52"
      textAnchor="middle"
      fill={colors.accent}
      style={{
        fontFamily: "'Brush Script MT', cursive",
        fontSize: '36px',
        fontStyle: 'italic',
      }}
    >
      B
    </text>

    {/* Sparkle decorations */}
    <circle cx="24" cy="28" r="2" fill={colors.decorative} className="animate-sparkle" />
    <circle cx="56" cy="52" r="1.5" fill={colors.decorative} className="animate-sparkle" style={{ animationDelay: '0.5s' }} />

    {/* Subtle inner border */}
    <rect
      x="10"
      y="10"
      width="60"
      height="60"
      rx="4"
      fill="none"
      stroke={colors.primary}
      strokeWidth="0.5"
      opacity="0.2"
    />
  </svg>
)

/* ─────────────────────────────────────────────────────────────────────────────
   FULL BLISS LOGO - Icon + Typography
   ───────────────────────────────────────────────────────────────────────────── */
export function BlissLogo({
  size = 'md',
  variant = 'full',
  palette = 'royalPlum',
  animate = false,
  showTagline = true,
  className = '',
}: BlissLogoProps) {
  const dimensions = sizeMap[size]
  const colors = blissPalettes[palette]
  const iconSize = Math.min(dimensions.height * 0.8, 80)

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`}>
        <BlissIcon size={iconSize} colors={colors} animate={animate} />
      </div>
    )
  }

  // Minimal variant - just the wordmark
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span
          className="bliss-script"
          style={{
            fontSize: dimensions.fontSize,
            color: colors.accent,
          }}
        >
          Bliss
        </span>
      </div>
    )
  }

  // Wordmark variant - text only with tagline
  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <span
          className="bliss-script"
          style={{
            fontSize: dimensions.fontSize,
            color: colors.accent,
            lineHeight: 1,
          }}
        >
          Bliss
        </span>
        <span
          className="bliss-elegant uppercase tracking-[0.3em]"
          style={{
            fontSize: dimensions.taglineSize,
            color: colors.primary,
            marginTop: '2px',
          }}
        >
          Patisserie
        </span>
        {showTagline && size !== 'xs' && size !== 'sm' && (
          <span
            className="bliss-body uppercase tracking-[0.25em] mt-1"
            style={{
              fontSize: Math.max(dimensions.taglineSize - 2, 6),
              color: colors.warm,
              opacity: 0.8,
            }}
          >
            Boulangerie • Creamerie
          </span>
        )}
      </div>
    )
  }

  // Full logo: icon + text
  return (
    <div
      className={`inline-flex items-center gap-3 ${animate ? 'animate-float' : ''} ${className}`}
    >
      <BlissIcon size={iconSize} colors={colors} animate={false} />

      <div className="flex flex-col justify-center">
        {/* Main brand name */}
        <span
          className="bliss-script leading-none"
          style={{
            fontSize: dimensions.fontSize,
            color: colors.accent,
          }}
        >
          Bliss
        </span>

        {/* Patisserie subtitle */}
        <span
          className="bliss-elegant uppercase tracking-[0.25em] leading-tight"
          style={{
            fontSize: dimensions.taglineSize + 2,
            color: colors.primary,
          }}
        >
          Patisserie
        </span>

        {/* Full tagline for larger sizes */}
        {showTagline && (size === 'lg' || size === 'xl' || size === 'hero') && (
          <div
            className="flex items-center gap-2 mt-0.5"
            style={{
              fontSize: dimensions.taglineSize - 1,
              color: colors.warm,
            }}
          >
            <span className="bliss-body uppercase tracking-[0.15em]">Boulangerie</span>
            <span style={{ color: colors.decorative }}>•</span>
            <span className="bliss-body uppercase tracking-[0.15em]">Creamerie</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO LOGO - Large display version with decorative frame
   ───────────────────────────────────────────────────────────────────────────── */
export function BlissLogoHero({
  palette = 'royalPlum',
  animate = true,
  className = '',
}: {
  palette?: BlissPaletteName
  animate?: boolean
  className?: string
}) {
  const colors = blissPalettes[palette]

  return (
    <div
      className={`relative inline-flex flex-col items-center p-8 ${className}`}
    >
      {/* Decorative frame background */}
      <div
        className="absolute inset-0 rounded-3xl diagonal-stripes-bliss ornate-corners"
        style={{
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.cream}ee 100%)`,
          border: `2px solid ${colors.primary}20`,
        }}
      />

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center ${animate ? 'animate-float' : ''}`}>
        {/* Icon */}
        <BlissIcon size={120} colors={colors} animate={false} />

        {/* Brand name */}
        <h1
          className="bliss-script mt-4"
          style={{
            fontSize: '72px',
            color: colors.accent,
            lineHeight: 0.9,
          }}
        >
          Bliss
        </h1>

        {/* Patisserie */}
        <span
          className="bliss-elegant uppercase tracking-[0.4em] -mt-1"
          style={{
            fontSize: '18px',
            color: colors.primary,
          }}
        >
          Patisserie
        </span>

        {/* Divider line */}
        <div
          className="w-32 h-px my-3"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.decorative}, transparent)`,
          }}
        />

        {/* Business lines */}
        <div
          className="flex items-center gap-4 bliss-body uppercase tracking-[0.2em]"
          style={{
            fontSize: '11px',
            color: colors.warm,
          }}
        >
          <span>Patisserie</span>
          <span style={{ color: colors.decorative }}>✦</span>
          <span>Boulangerie</span>
          <span style={{ color: colors.decorative }}>✦</span>
          <span>Creamerie</span>
        </div>
      </div>

      {/* Sparkle decorations */}
      <div
        className="absolute top-6 right-8 w-2 h-2 rounded-full animate-sparkle"
        style={{ background: colors.decorative }}
      />
      <div
        className="absolute bottom-10 left-6 w-1.5 h-1.5 rounded-full animate-sparkle"
        style={{ background: colors.decorative, animationDelay: '0.7s' }}
      />
      <div
        className="absolute top-1/3 left-4 w-1 h-1 rounded-full animate-sparkle"
        style={{ background: colors.decorative, animationDelay: '1.4s' }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAVIGATION LOGO - Compact version for headers
   ───────────────────────────────────────────────────────────────────────────── */
export function BlissLogoNav({
  palette = 'royalPlum',
  className = '',
}: {
  palette?: BlissPaletteName
  className?: string
}) {
  const colors = blissPalettes[palette]

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Compact icon */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="navPlumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>

        <rect x="4" y="4" width="72" height="72" rx="8" fill="url(#navPlumGradient)" />
        <rect x="8" y="8" width="64" height="64" rx="6" fill={colors.cream} />

        {/* Corner accents */}
        <path d="M14 14 L14 20 M14 14 L20 14" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <path d="M66 66 L66 60 M66 66 L60 66" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

        {/* B monogram */}
        <text
          x="40"
          y="52"
          textAnchor="middle"
          fill={colors.accent}
          style={{
            fontFamily: "'Brush Script MT', cursive",
            fontSize: '36px',
            fontStyle: 'italic',
          }}
        >
          B
        </text>
      </svg>

      {/* Text */}
      <div className="flex flex-col -space-y-0.5">
        <span
          className="bliss-script leading-none"
          style={{
            fontSize: '20px',
            color: colors.accent,
          }}
        >
          Bliss
        </span>
        <span
          className="bliss-elegant uppercase tracking-[0.2em] text-[9px] leading-tight"
          style={{ color: colors.primary }}
        >
          Patisserie
        </span>
      </div>
    </div>
  )
}

// Export the icon separately for favicon/custom use
export { BlissIcon }

export default BlissLogo
