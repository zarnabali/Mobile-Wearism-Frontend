/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B35",
        secondary: "#3C0008",
        accent: "#FF6B35",
      },
      fontFamily: {
        sans: ['HelveticaNeue', 'Helvetica Neue', 'sans-serif'],
        'h-light': ['HelveticaNeue-Light'],
        'h-bold': ['HelveticaNeue-Bold'],
        'h-medium': ['HelveticaNeue-Medium'],
        'h-heavy': ['HelveticaNeue-Heavy'],
        'h-black': ['HelveticaNeue-Black'],
        'h-thin': ['HelveticaNeue-Thin'],
        'h-ultralight': ['HelveticaNeue-UltraLight'],
      }
    },
  },
  plugins: [],
}

