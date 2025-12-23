/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#121212',
        surfaceHighlight: '#1e1e1e',
        primary: '#00ff9d',
        secondary: '#00ccff',
        danger: '#ff4d4d',
        text: '#e0e0e0',
        muted: '#888888'
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
