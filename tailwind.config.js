/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'maybank-yellow': '#ffc72c',
        'maybank-gold': '#d4a843',
        'maybank-dark': '#1a1a2e',
        'maybank-blue': '#16213e',
      },
    },
  },
  plugins: [],
}
