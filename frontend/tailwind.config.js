/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#0F121D',      // Dark background
          bgLight: '#181C2E', // Dark card background
          border: '#2A334A',  // Dark borders
          text: '#94A3B8',    // Dark secondary text
          lightBg: '#F1F5F9', // Light background
          lightCard: '#FFFFFF', // Light card background
          lightBorder: '#E2E8F0', // Light border
        },
        primary: {
          DEFAULT: '#3B82F6', // Blue
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        secondary: {
          DEFAULT: '#10B981', // Green
          dark: '#047857',
          light: '#34D399',
        },
        accent: {
          DEFAULT: '#F59E0B', // Orange
          dark: '#B45309',
          light: '#FBBF24',
        },
        danger: {
          DEFAULT: '#EF4444', // Red
          dark: '#B91C1C',
          light: '#F87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
