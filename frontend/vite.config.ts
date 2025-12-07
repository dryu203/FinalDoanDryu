import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Uncomment sau khi cài: npm install vite-plugin-pwa --save-dev
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Build vào backend/public để backend có thể serve static files
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    // PWA Plugin - Để kích hoạt PWA, cài: npm install vite-plugin-pwa --save-dev
    // Sau đó uncomment và import ở trên, rồi thêm VitePWA({...}) vào đây
    // Xem hướng dẫn chi tiết trong frontend/ENABLE_PWA.md
  ],
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      // Proxy Socket.IO WebSocket traffic to backend
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true
      },
      // Proxy uploads so images can be loaded via same-origin URL /uploads/*
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: true, // Cho phép truy cập từ mọi host (bao gồm ngrok)
    // Cho phép tất cả các domain ngrok
    allowedHosts: [
      'localhost',
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok-free.dev',
      '.ngrok.app'
    ]
  }
});


