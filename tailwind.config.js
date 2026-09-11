/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts,js}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        linkding: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          text: '#1e293b',
          muted: '#64748b',
          accent: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
