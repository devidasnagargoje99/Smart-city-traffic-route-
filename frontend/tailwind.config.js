/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        traffic: {
          low: '#10b981',       // Green
          moderate: '#f59e0b',  // Yellow / Amber
          heavy: '#f97316',     // Orange
          severe: '#ef4444',    // Red
          unknown: '#9ca3af'    // Gray
        }
      }
    },
  },
  plugins: [],
}
