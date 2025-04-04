import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
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