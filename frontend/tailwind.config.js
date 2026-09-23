/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 1. Editorial Paper Whites & Creams
        paper: {
          light: '#FFFFFF',
          DEFAULT: '#F8FAFC',
          warm: '#FAFAF9',
          border: '#E2E8F0'
        },
        // 2. High-contrast Black & Inks
        ink: {
          darkest: '#09090B',
          DEFAULT: '#0F172A',
          muted: '#334155',
          light: '#64748B',
          border: '#1E293B'
        },
        // 3. Primary Editorial Blue
        rfblue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#0F2B5C',
          950: '#081734',
          DEFAULT: '#1E40AF'
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#0F2B5C',
          950: '#081734',
          DEFAULT: '#1E40AF'
        },
        // 4. Minimal Accent & Alert Red (<5% surface)
        rfred: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          DEFAULT: '#DC2626'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif']
      },
      maxWidth: {
        prose: '72ch'
      }
    }
  },
  plugins: []
};
