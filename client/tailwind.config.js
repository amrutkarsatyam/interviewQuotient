// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,cjs}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
        secondary: '#f1f5f9',
        muted: '#64748b',
        accent: '#10b981',
        destructive: '#ef4444',
        border: '#e2e8f0',
        ring: '#3b82f6',
      },
      borderRadius: {
        lg: `0.75rem`, // Slightly larger radius for a softer look
        md: `0.5rem`,
        sm: `0.375rem`,
      },
      // Added for the glass effect on cards
      backdropBlur: {
        'xl': '24px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate')
  ],
}