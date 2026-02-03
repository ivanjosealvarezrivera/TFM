/** @type {import('tailwindcss').Config} */
export default {
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
      }
    },
  },
  plugins: [],
}
