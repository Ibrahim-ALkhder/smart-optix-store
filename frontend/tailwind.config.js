/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f5f5f6',
          100: '#e5e5e7',
          200: '#cecfd2',
          300: '#acaeb2',
          400: '#83858b',
          500: '#686a70',
          600: '#57585e',
          700: '#4a4b50',
          800: '#414145',
          900: '#0B0B0C',
          950: '#050505',
        },
        gold: {
          50: '#fdf9ed',
          100: '#f9f0cc',
          200: '#f3df95',
          300: '#ecc95e',
          400: '#e6b83a',
          500: '#D4AF37',
          600: '#b8872a',
          700: '#996624',
          800: '#7d5123',
          900: '#674220',
          950: '#3b220e',
        },
        primary: {
          50: '#fdf9ed',
          100: '#f9f0cc',
          200: '#f3df95',
          300: '#ecc95e',
          400: '#e6b83a',
          500: '#D4AF37',
          600: '#b8872a',
          700: '#996624',
          800: '#7d5123',
          900: '#674220',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-vertical': 'linear-gradient(180deg, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
