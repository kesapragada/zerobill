// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ====================== [ THE ULTIMATE FIX ] ======================
  // Add this 'server' configuration block.
  // This tells the Vite development server to create a proxy.
  // Any request from your frontend code that starts with '/api'
  // will be transparently forwarded to your backend server at http://localhost:5000.
  // This solves ALL cross-origin and cookie issues during development.
  // =================================================================
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend server URL
        changeOrigin: true, // Recommended for virtual-hosted sites
      },
    },
  },
})