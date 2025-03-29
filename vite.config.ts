import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '_redirects',
          dest: ''
        }
      ]
    })
  ],
  optimizeDeps: {
    include: ['@urql/core', 'urql'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    },
    target: 'esnext',
    modulePreload: true,
    cssCodeSplit: true
  },
  server: {
    proxy: {
      '/feeds/merchant-products.csv': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => '/.netlify/functions/merchant-feed'
      }
    }
  }
});