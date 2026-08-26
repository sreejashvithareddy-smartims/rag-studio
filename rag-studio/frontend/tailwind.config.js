/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f5ff',
          100: '#e6ecff',
          200: '#c3d0ff',
          300: '#9fb3ff',
          400: '#5b7cff',
          500: '#3b5bff',
          600: '#2a44db',
          700: '#2136ad',
          800: '#1c2c87',
          900: '#18256b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        panel: '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
      },
    },
  },
  plugins: [],
}
