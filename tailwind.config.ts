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
        // Terracotta palette - Primary brand color
        terracotta: {
          50: '#FEF7F4',
          100: '#FDEEE8',
          200: '#FADDD0',
          300: '#F5C4AD',
          400: '#E89A71',
          500: '#C45C26',  // Primary
          600: '#A84D20',
          700: '#8B3A14',  // Accent
          800: '#6E2E10',
          900: '#5C2E13',  // Dark
        },
        // Warm cream palette
        cream: {
          50: '#FFFCF7',
          100: '#FFF8E7',  // Cream
          200: '#FFE4C4',  // Warm
          300: '#F5D4A8',
          400: '#E8C08A',
          500: '#D4A574',
        },
        // Dark mode warm backgrounds
        dark: {
          900: '#1A1412',
          800: '#2D241F',
          700: '#3D322B',
          600: '#4D4238',
          500: '#5D524A',
        },
        // Gold palette (kept for backwards compatibility)
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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #ecd799 100%)',
      },
      boxShadow: {
        gold: '0 4px 14px 0 rgba(212, 175, 55, 0.2)',
        'gold-lg': '0 10px 40px 0 rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config
