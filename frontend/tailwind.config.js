/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0f1e35', 800: '#1a2f4e', 700: '#1e3a5f', 600: '#24487a' },
        accent: { DEFAULT: '#f0a500', light: '#f8c842' },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
