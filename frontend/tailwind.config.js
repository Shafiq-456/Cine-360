/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          dark: "#0a0d1a",
          card: "#0f1424",
          surface: "#141b2e",
          blue: "#4f7cff",
        }
      }
    },
  },
  plugins: [],
}

