import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'face-api.js': path.resolve(__dirname, 'node_modules/face-api.js/build/es6/index.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // Fix for Windows permission issues with Vite cache
  cacheDir: 'node_modules/.vite',
  clearScreen: false,
});
