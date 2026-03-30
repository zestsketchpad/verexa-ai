/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './main.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './state/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        label: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#101419',
        surface: '#101419',
        primary: '#a2c9ff',
        'on-primary': '#0b1118',
        'primary-container': '#4da3ff',
        secondary: '#d0bcff',
        tertiary: '#ffb95c',
        error: '#ffb4ab',
        'on-surface': '#e0e2ea',
        'on-surface-variant': '#c0c7d4',
        'outline-variant': '#404752',
        'surface-container-low': '#181c21',
        'surface-container-lowest': '#0a0e13',
        'surface-container-high': '#262a30',
        'surface-container-highest': '#31353b',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
