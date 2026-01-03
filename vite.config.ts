
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[Vite Proxy Connection Error]:', err.message);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (proxyRes.statusCode === 404) {
              console.warn(`[Vite Proxy 404] Resource not found on backend: ${req.url}`);
            }
          });
        }
      }
    }
  }
});
