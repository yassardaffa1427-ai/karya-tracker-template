/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F3FF',
          100: '#ECE9FE',
          200: '#E0DEFC',
          300: '#C7C2F9',
          400: '#8B7CF6',
          500: '#6352F3',
          600: '#5346E0',
          700: '#432BB3',
          800: '#3C2BB8',
        },
        darkbg: {
          main: '#181925',
          card: '#1E1F2E',
          panel: '#3B3980',
          active: '#47449B',
        },
        surface: {
          DEFAULT: '#F4F5FA',
          overlay: '#F0F2F7',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        line: '#E2E8F0',
      },
      borderRadius: {
        card: '16px',
        container: '24px',
        control: '10px',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card-sm': '0px 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'card-md': '0px 8px 28px -6px rgba(15, 23, 42, 0.10)',
        'dark-panel': '0px 12px 32px -4px rgba(0, 0, 0, 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
