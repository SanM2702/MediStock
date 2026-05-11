/** @type {import('tailwindcss').Config} */
export default {
  // 'class' strategy: ThemeContext agrega/quita la clase "dark" en <html>
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          50:  '#E6F4F1',
          100: '#C2E3DC',
          200: '#8ECABC',
          300: '#5BB09D',
          400: '#2E9880',
          500: '#0F6E56',
          600: '#0C5A46',
          700: '#094535',
          800: '#063025',
          900: '#031A13',
        },
        accent: {
          DEFAULT: '#16A97F',
          light: '#D1FAE5',
        },
        status: {
          available: '#16A34A',
          limited:   '#D97706',
          out:       '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(15,110,86,0.10)',
        nav:  '0 -2px 16px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(180px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
