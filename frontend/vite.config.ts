import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-stats.html',
      title: 'WeatherPulse Production Bundle Analysis',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@design-system': fileURLToPath(new URL('./src/design-system', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-vendor';
          }
        },
      },
    },
  },
});
