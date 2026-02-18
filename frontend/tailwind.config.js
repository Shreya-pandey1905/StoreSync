/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {

        'light-bg-primary': '#f9fafb',
        'light-text-primary': '#1f2937',
        'dark-bg-primary': '#1f2937',
        'dark-text-primary': '#f9fafb',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        light: {
          text: {
            primary: '#111827',
            secondary: '#374151',
            muted: '#6b7280',
          },
          bg: {
            primary: '#ffffff',
            secondary: '#f9fafb',
          }
        },
        dark: {
          text: {
            primary: '#f3f4f6',
            secondary: '#d1d5db',
            muted: '#9ca3af',
          },
          bg: {
            primary: '#111827',
            secondary: '#1f2937',
          }
        },
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
