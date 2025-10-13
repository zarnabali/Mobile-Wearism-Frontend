/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class', // Use class-based dark mode instead of media
  theme: {
    extend: {
      fontFamily: {
        'sans': ['HelveticaNeue-Roman', 'Helvetica Neue', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'sans-serif'],
        'helvetica': ['HelveticaNeue-Roman', 'Helvetica Neue', 'sans-serif'],
        'helvetica-thin': ['HelveticaNeue-Thin', 'Helvetica Neue', 'sans-serif'],
        'helvetica-ultralight': ['HelveticaNeue-UltraLight', 'Helvetica Neue', 'sans-serif'],
        'helvetica-light': ['HelveticaNeue-Light', 'Helvetica Neue', 'sans-serif'],
        'helvetica-roman': ['HelveticaNeue-Roman', 'Helvetica Neue', 'sans-serif'],
        'helvetica-medium': ['HelveticaNeue-Medium', 'Helvetica Neue', 'sans-serif'],
        'helvetica-heavy': ['HelveticaNeue-Heavy', 'Helvetica Neue', 'sans-serif'],
        'helvetica-bold': ['HelveticaNeue-Bold', 'Helvetica Neue', 'sans-serif'],
        'helvetica-black': ['HelveticaNeue-Black', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

