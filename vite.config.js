// LimoFlight V4 — vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/limoflight/',   // ← เพิ่มบรรทัดนี้
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) {
            return 'react';
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'charts';
          }
          if (id.includes('node_modules/@googlemaps')) {
            return 'maps';
          }
          if (id.includes('node_modules/face-api.js')) {
            return 'faceapi';
          }
        },
      },
      /*output: {
        manualChunks: {
          react:    ['react', 'react-dom', 'react-router-dom'],
          charts:   ['chart.js', 'react-chartjs-2'],
          maps:     ['@googlemaps/js-api-loader'],
          faceapi:  ['face-api.js'],
        },
      },*/
    },
  },
})
