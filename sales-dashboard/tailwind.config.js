/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '.app-dark'],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#004730',
        'darker-green': '#1A664B',
        'medium-dark-green': '#4B7F61',
        'pale-green': '#8CC2A2',
        'lighter-pale-green': '#B7D4C0',
        'light-greenish-bg': '#F0F4F0',
        'primary-red': '#D42E12',
        'brighter-green': '#22C55E',
        'gray-brand': '#1a1a1a',
        // Escala de grises estandarizada (basada en Tailwind Slate/Gray)
        'brand-gray': {
          0: '#ffffff',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712'
        },
        // Escala de superficie para modo oscuro
        'surface-dark': {
          0: '#000000',
          50: '#09090b',
          100: '#18181b',
          200: '#27272a',
          300: '#3f3f46',
          400: '#52525b',
          500: '#71717a',
          600: '#a1a1aa',
          700: '#d4d4d8',
          800: '#e4e4e7',
          900: '#f4f4f5',
          950: '#fafafa'
        },
        // Paleta para gráficos (Violín, Pie, etc)
        'chart-greens': [
          '#004730', '#1A664B', '#2D8A66', '#4B7F61', '#6BA285', '#8CC2A2', '#B7D4C0'
        ],
        // Fondos de gráficos Plotly
        'chart-bg-dark': 'rgba(31, 41, 55, 0.5)',
        'chart-bg-light': 'rgba(249, 250, 251, 0.5)'
      },
      fontFamily: {
        brand: ['Outfit', 'Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
