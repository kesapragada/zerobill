// frontend/tailwind.config.js
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-darkest': '#0F172A',
        'navy-dark': '#1E293B',
        'navy-medium': '#334155',
        'navy-light': '#94A3B8',
        'navy-lightest': '#F1F5F9',
        'brand-primary': {
          DEFAULT: '#4F46E5',
          'foreground': '#FFFFFF',
        },
        'brand-secondary': '#38BDF8',
        'danger': '#F43F5E',
      },
    },
  },
  plugins: [forms],
}