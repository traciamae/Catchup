/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FDFBF7",
        amberRetro: "#D97706",
        roseRetro: "#E11D48",
        stoneRetro: "#78716C",
      },
    },
  },
  plugins: [],
}