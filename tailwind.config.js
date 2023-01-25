/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          default: '#0077FF',
          compare: '#FFC44E',
          dark: '#1E222B',
          tint: '#99BADD',
          light: '#486AE8',
        },
        gray: {
          1000: '#363636',
          900: '#7D7D7D',
          800: '#B6B6B6',
          700: '#D9D9D9',
        },
      },
    },
  },
}
