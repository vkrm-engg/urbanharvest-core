/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,訪問,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}