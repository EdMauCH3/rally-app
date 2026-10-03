/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#053866', // fondo predominante de toda la app
          brown: '#733f2d', // acento secundario ("café"): usar con moderación
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Sube un poco los textos pequeños en toda la app (12px->13px,
        // 14px->15px) sin tocar text-base/lg/xl para arriba.
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.4rem' }],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(99, 102, 241, 0.45)',
        'glow-lg': '0 0 60px -10px rgba(99, 102, 241, 0.5)',
        card: '0 8px 30px -6px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
