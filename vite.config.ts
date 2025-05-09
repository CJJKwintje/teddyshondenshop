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
        },
        {
          src: 'contentful-data.json',
          dest: ''
        },
        {
          src: 'contentful-data.json',
          dest: 'assets'
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
        manualChunks: {
          vendor: ['react', 'react-dom'],
          contentful: ['contentful']
        }
      }
    }
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