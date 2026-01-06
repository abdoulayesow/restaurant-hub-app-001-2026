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
        gold: {
          50: '#fdfaf3',
          100: '#faf5e6',
          200: '#f3e6c0',
          300: '#ecd799',
          400: '#e5c873',
          500: '#D4AF37', // PRIMARY
          600: '#c09a2f',
          700: '#a08527',
          800: '#80701f',
          900: '#605b17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
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
