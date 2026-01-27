'use client'

import React from 'react'

// Color palette type definition
export interface ColorPalette {
  name: string
  primary: string
  secondary: string
  accent: string
  cream: string
  warm: string
  dark: string
}

// Color Palettes - Warm Bakery Tones
export const colorPalettes: Record<string, ColorPalette> = {
  terracotta: {
    name: 'Terracotta',
    primary: '#C45C26',
    secondary: '#E07B3C',
    accent: '#8B3A14',
    cream: '#FFF8E7',
    warm: '#FFE4C4',
    dark: '#5C2E13',
  },
  warmBrown: {
    name: 'Warm Brown',
    primary: '#8B4513',
    secondary: '#A0522D',
    accent: '#654321',
    cream: '#FFF8DC',
    warm: '#DEB887',
    dark: '#3E2723',
  },
  burntSienna: {
    name: 'Burnt Sienna',
    primary: '#A0522D',
    secondary: '#CD853F',
    accent: '#7B3F24',
    cream: '#FFFAF0',
    warm: '#F5DEB3',
    dark: '#4A2C17',
  },
  // Keep gold as fallback option
  gold: {
    name: 'Classic Gold',
    primary: '#D4AF37',
    secondary: '#E5C873',
    accent: '#A08527',
    cream: '#FDFAF3',
    warm: '#F3E6C0',
    dark: '#605B17',
  },
}

export type PaletteName = keyof typeof colorPalettes

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'wordmark'
  palette?: PaletteName
  className?: string
  appName?: string // Dynamic app name (e.g., "Cafe Hub", "Restaurant Hub")
}

const sizeMap = {
  xs: { icon: 24, text: 14, gap: 6 },
  sm: { icon: 32, text: 18, gap: 8 },
  md: { icon: 40, text: 22, gap: 10 },
  lg: { icon: 56, text: 28, gap: 12 },
  xl: { icon: 72, text: 36, gap: 16 },
}

// Stylized wheat sheaf icon forming a subtle "hub" shape
const WheatIcon = ({
  size,
  colors
}: {
  size: number
  colors: ColorPalette
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Background circle - warm cream */}
    <circle cx="32" cy="32" r="30" fill={colors.cream} />
    <circle cx="32" cy="32" r="30" stroke={colors.primary} strokeWidth="2" />

    {/* Central wheat stalk */}
    <path
      d="M32 52V24"
      stroke={colors.accent}
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Left wheat grains */}
    <ellipse cx="26" cy="20" rx="4" ry="7" fill={colors.primary} transform="rotate(-20 26 20)" />
    <ellipse cx="24" cy="28" rx="3.5" ry="6" fill={colors.secondary} transform="rotate(-25 24 28)" />
    <ellipse cx="25" cy="36" rx="3" ry="5" fill={colors.primary} transform="rotate(-30 25 36)" />

    {/* Right wheat grains */}
    <ellipse cx="38" cy="20" rx="4" ry="7" fill={colors.primary} transform="rotate(20 38 20)" />
    <ellipse cx="40" cy="28" rx="3.5" ry="6" fill={colors.secondary} transform="rotate(25 40 28)" />
    <ellipse cx="39" cy="36" rx="3" ry="5" fill={colors.primary} transform="rotate(30 39 36)" />

    {/* Top grain */}
    <ellipse cx="32" cy="14" rx="4" ry="6" fill={colors.accent} />

    {/* Small decorative dots */}
    <circle cx="32" cy="46" r="2" fill={colors.primary} />
  </svg>
)

// Artisan bread loaf icon with steam - Primary logo icon
const BreadIcon = ({
  size,
  colors
}: {
  size: number
  colors: ColorPalette
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Background circle */}
    <circle cx="32" cy="32" r="30" fill="#FFF8E7" />
    <circle cx="32" cy="32" r="30" stroke={colors.primary} strokeWidth="2" />

    {/* Bread loaf body */}
    <path
      d="M14 38C14 38 14 30 20 26C26 22 38 22 44 26C50 30 50 38 50 38C50 42 46 46 32 46C18 46 14 42 14 38Z"
      fill="#FFE4C4"
      stroke={colors.primary}
      strokeWidth="2"
    />

    {/* Bread top crust - dome */}
    <path
      d="M18 30C18 30 22 18 32 18C42 18 46 30 46 30"
      stroke="#8B3A14"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Score marks on bread */}
    <path d="M24 26L28 34" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
    <path d="M32 24L32 34" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
    <path d="M40 26L36 34" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />

    {/* Steam lines */}
    <path d="M26 14C26 14 27 10 26 8" stroke="#E07B3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M32 12C32 12 33 8 32 6" stroke="#E07B3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M38 14C38 14 39 10 38 8" stroke="#E07B3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
)

// Croissant icon variant
const CroissantIcon = ({
  size,
  colors
}: {
  size: number
  colors: ColorPalette
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Background circle */}
    <circle cx="32" cy="32" r="30" fill={colors.cream} />
    <circle cx="32" cy="32" r="30" stroke={colors.primary} strokeWidth="2" />

    {/* Croissant body - crescent shape */}
    <path
      d="M12 36C12 36 16 20 32 20C48 20 52 36 52 36C52 36 46 44 32 44C18 44 12 36 12 36Z"
      fill={colors.warm}
      stroke={colors.primary}
      strokeWidth="2"
    />

    {/* Croissant layers/ridges */}
    <path d="M18 34C22 30 26 28 32 28C38 28 42 30 46 34" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M22 38C26 35 28 34 32 34C36 34 38 35 42 38" stroke={colors.secondary} strokeWidth="1.5" strokeLinecap="round" fill="none" />

    {/* Pointed ends */}
    <path d="M10 38L16 34" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M54 38L48 34" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />

    {/* Shine highlight */}
    <ellipse cx="28" cy="26" rx="4" ry="2" fill={colors.cream} opacity="0.5" />
  </svg>
)

export function Logo({
  size = 'md',
  variant = 'full',
  palette = 'terracotta',
  className = '',
  appName,
}: LogoProps) {
  const dimensions = sizeMap[size]
  const colors = colorPalettes[palette]

  // Parse app name into prefix and "Hub" suffix
  // e.g., "Cafe Hub" -> prefix: "Cafe", suffix: "Hub"
  const [prefix, suffix] = appName
    ? [appName.replace(/\s*Hub$/i, ''), 'Hub']
    : ['Bakery', 'Hub']

  if (variant === 'icon') {
    return (
      <div className={className}>
        <BreadIcon size={dimensions.icon} colors={colors} />
      </div>
    )
  }

  if (variant === 'wordmark') {
    return (
      <div className={className}>
        <span
          style={{
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            fontSize: dimensions.text,
            fontWeight: 700,
            color: colors.primary,
            letterSpacing: '-0.02em',
          }}
        >
          {prefix}
          <span style={{ color: colors.accent, fontWeight: 800 }}>{suffix}</span>
        </span>
      </div>
    )
  }

  // Full logo: icon + text
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: dimensions.gap
      }}
    >
      <BreadIcon size={dimensions.icon} colors={colors} />
      <span
        style={{
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          fontSize: dimensions.text,
          fontWeight: 700,
          color: colors.primary,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {prefix}
        <span style={{ color: colors.accent, fontWeight: 800 }}>{suffix}</span>
      </span>
    </div>
  )
}

// Alternative icons exported for flexibility
export function LogoWithBread({
  size = 'md',
  variant = 'full',
  palette = 'terracotta',
  className = ''
}: LogoProps) {
  const dimensions = sizeMap[size]
  const colors = colorPalettes[palette]

  if (variant === 'icon') {
    return (
      <div className={className}>
        <BreadIcon size={dimensions.icon} colors={colors} />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: dimensions.gap
      }}
    >
      <BreadIcon size={dimensions.icon} colors={colors} />
      <span
        style={{
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          fontSize: dimensions.text,
          fontWeight: 700,
          color: colors.primary,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Bakery
        <span style={{ color: colors.accent, fontWeight: 800 }}>Hub</span>
      </span>
    </div>
  )
}

export function LogoWithCroissant({
  size = 'md',
  variant = 'full',
  palette = 'terracotta',
  className = ''
}: LogoProps) {
  const dimensions = sizeMap[size]
  const colors = colorPalettes[palette]

  if (variant === 'icon') {
    return (
      <div className={className}>
        <CroissantIcon size={dimensions.icon} colors={colors} />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: dimensions.gap
      }}
    >
      <CroissantIcon size={dimensions.icon} colors={colors} />
      <span
        style={{
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          fontSize: dimensions.text,
          fontWeight: 700,
          color: colors.primary,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Bakery
        <span style={{ color: colors.accent, fontWeight: 800 }}>Hub</span>
      </span>
    </div>
  )
}

// Export individual icons for favicon/custom use
export { WheatIcon, BreadIcon, CroissantIcon }

export default Logo
