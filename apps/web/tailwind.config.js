/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'moss-green': {
          50: '#f2f6f2',
          100: '#e5ede5',
          200: '#c8dbca',
          300: '#9dc4a6',
          400: '#76a67d',
          500: '#5a8b5f',
          600: '#43704a',
          700: '#385c3e',
          800: '#314a34',
          900: '#2a3f2e',
        },
      },
    },
  },
  plugins: [],
}
