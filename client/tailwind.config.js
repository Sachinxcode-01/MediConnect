export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themeLight: '#F0FDF4',       // green-50 - Main background
        themeSoft: '#DCFCE7',        // green-100 - Cards/Secondary
        themeMedium: '#86EFAC',      // green-300
        themePrimary: '#22C55E',     // green-500 - Buttons & Accents
        themeDark: '#166534',        // green-800 - Text & Heavy contrast
        themeDeep: '#14532D',        // green-900 - Headers
        glass: 'rgba(255, 255, 255, 0.6)',
        glassBorder: 'rgba(34, 197, 94, 0.2)',
      },
      fontFamily: {
        geist: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(34, 197, 94, 0.4)',
        'neon-hover': '0 10px 40px rgba(34, 197, 94, 0.6)',
        'glass': '0 8px 32px 0 rgba(34, 197, 94, 0.1)',
        '3d': '0 20px 25px -5px rgba(22, 101, 52, 0.2), 0 8px 10px -6px rgba(22, 101, 52, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        }
      }
    },
  },
  plugins: [],
}
