/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        secondary: '#8b5cf6',
        accent: '#f59e0b',
      },
    },
  },
  plugins: [],
} 