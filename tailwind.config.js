/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5BA3D0',
          dark: '#4A8FBA',
        },
        secondary: '#8FB88F',
        accent: '#6AB77B',
        nature: {
          green: '#7FA37F',
          DEFAULT: '#6AB77B',
        },
        earth: '#B89F7A',
        sky: '#AED6F1',
        forest: '#6B8E6B',
        text: {
          dark: '#3D4A3D',
          light: '#6B7A6B',
        },
        bg: {
          light: '#F5F8F5',
          DEFAULT: '#FFFFFF',
        },
        border: {
          DEFAULT: '#D4E4D4',
        },
      },
      backgroundImage: {
        'nature-gradient': 'linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)',
        'sky-gradient': 'linear-gradient(135deg, #AED6F1 0%, #5BA3D0 100%)',
        'earth-gradient': 'linear-gradient(135deg, #8FB88F 0%, #7FA37F 100%)',
      },
      boxShadow: {
        'custom': '0 2px 8px rgba(91, 163, 208, 0.12)',
        'custom-lg': '0 4px 16px rgba(91, 163, 208, 0.18)',
      },
      keyframes: {
        toastSlideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        dropdownFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%': { transform: 'scale(1.1)', opacity: '0.2' },
        },
      },
      animation: {
        toastSlideIn: 'toastSlideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.2s ease',
        slideUp: 'slideUp 0.3s ease',
        dropdownFadeIn: 'dropdownFadeIn 0.2s ease',
        pulse: 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

