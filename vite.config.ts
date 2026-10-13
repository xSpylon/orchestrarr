import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      // Keep the browser's Host: API-key mode checks writes against it (CSRF), and a rewritten Host never matches the Origin.
      '/api': { target: process.env.API_ORIGIN || 'http://127.0.0.1:4173', changeOrigin: false },
    },
  },
});
