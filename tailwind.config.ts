import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // BLISS PATISSERIE - Luxury French Patisserie Palette
        // ═══════════════════════════════════════════════════════════════

        // Royal Plum - Primary brand color (from logo frames)
        plum: {
          50: '#F8F5FA',
          100: '#F0E9F5',
          200: '#E1D4EB',
          300: '#C4A8D6',
          400: '#9B4D9F',
          500: '#5A2D6E',   // Secondary
          600: '#4A2459',
          700: '#3D1B4D',   // Primary (logo color)
          800: '#2E1439',
          900: '#1F0D26',
          950: '#150918',
        },

        // Deep Espresso - Accent & text color (from "Bliss" script)
        espresso: {
          50: '#F7F5F4',
          100: '#EBE7E4',
          200: '#D7CFC9',
          300: '#B09A8C',
          400: '#8B7765',
          500: '#6B5744',   // Warm accent
          600: '#564536',
          700: '#2C1810',   // Deep brown (logo script)
          800: '#1F110B',
          900: '#140A07',
        },

        // Warm Cream - Backgrounds (luxury paper feel)
        cream: {
          50: '#FFFEFE',    // Pure cream (primary bg)
          100: '#FFF8F0',   // Warm cream
          200: '#FFE4C4',   // Peachy cream
          300: '#F5D4A8',
          400: '#E8C08A',
          500: '#D4A574',
        },

        // Mauve - Decorative accent (rose-purple)
        mauve: {
          50: '#FDF5F9',
          100: '#FAE8F1',
          200: '#F5D1E4',
          300: '#E9A8C8',
          400: '#C48FA5',   // Rose accent
          500: '#9B4D9F',   // Decorative purple
          600: '#8B4D8F',
          700: '#6B3A6D',
          800: '#4A2849',
          900: '#2D1A2C',
        },

        // ═══════════════════════════════════════════════════════════════
        // LEGACY PALETTES (kept for gradual migration)
        // ═══════════════════════════════════════════════════════════════

        // Terracotta palette - Previous primary
        terracotta: {
          50: '#FEF7F4',
          100: '#FDEEE8',
          200: '#FADDD0',
          300: '#F5C4AD',
          400: '#E89A71',
          500: '#C45C26',
          600: '#A84D20',
          700: '#8B3A14',
          800: '#6E2E10',
          900: '#5C2E13',
        },

        // Dark mode warm backgrounds
        dark: {
          900: '#1A1412',
          800: '#2D241F',
          700: '#3D322B',
          600: '#4D4238',
          500: '#5D524A',
        },

        // Gold palette (backwards compatibility)
        gold: {
          50: '#fdfaf3',
          100: '#faf5e6',
          200: '#f3e6c0',
          300: '#ecd799',
          400: '#e5c873',
          500: '#D4AF37',
          600: '#c09a2f',
          700: '#a08527',
          800: '#80701f',
          900: '#605b17',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // TYPOGRAPHY - French Luxury System
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        // Display - Playfair Display (hero text, headings)
        display: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        // Elegant - Cormorant Garamond (subheadings, cards)
        elegant: ['var(--font-cormorant)', 'Cormorant Garamond', 'Garamond', 'serif'],
        // Body - Montserrat (UI text, forms)
        body: ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
        // Script - cursive for brand moments
        script: ['Brush Script MT', 'cursive'],
        // Legacy
        sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },

      // ═══════════════════════════════════════════════════════════════
      // VISUAL EFFECTS
      // ═══════════════════════════════════════════════════════════════
      backgroundImage: {
        // Luxury gradients
        'gradient-plum': 'linear-gradient(135deg, #3D1B4D 0%, #5A2D6E 50%, #9B4D9F 100%)',
        'gradient-espresso': 'linear-gradient(135deg, #2C1810 0%, #6B5744 100%)',
        'gradient-cream': 'linear-gradient(180deg, #FFFEFE 0%, #FFF8F0 100%)',
        'gradient-mauve': 'linear-gradient(135deg, #9B4D9F 0%, #C48FA5 100%)',
        // Legacy
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #ecd799 100%)',
      },

      boxShadow: {
        // Luxury shadows with plum tint
        'plum': '0 4px 14px 0 rgba(61, 27, 77, 0.15)',
        'plum-lg': '0 10px 40px 0 rgba(61, 27, 77, 0.2)',
        'plum-xl': '0 20px 60px 0 rgba(61, 27, 77, 0.25)',
        // Warm espresso shadows
        'warm': '0 4px 14px 0 rgba(44, 24, 16, 0.12)',
        'warm-lg': '0 10px 40px 0 rgba(44, 24, 16, 0.18)',
        // Inner glow
        'inner-plum': 'inset 0 2px 4px 0 rgba(61, 27, 77, 0.1)',
        // Legacy
        gold: '0 4px 14px 0 rgba(212, 175, 55, 0.2)',
        'gold-lg': '0 10px 40px 0 rgba(212, 175, 55, 0.3)',
      },

      // Animation timing
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },

      // Animation easing
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-subtle': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // Keyframe animations
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer-luxury': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'card-entrance': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },

      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer-luxury': 'shimmer-luxury 2.5s infinite',
        'card-entrance': 'card-entrance 0.5s ease-out',
        'sparkle': 'sparkle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
