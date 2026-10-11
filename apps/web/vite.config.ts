import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

/** GitHub Pages project sites need `/<repo>/`. Set via GITHUB_REPOSITORY or VITE_BASE. */
function pagesBase() {
  if (process.env.VITE_BASE) return process.env.VITE_BASE.endsWith('/')
    ? process.env.VITE_BASE
    : `${process.env.VITE_BASE}/`;
  if (process.env.GITHUB_REPOSITORY) {
    const name = process.env.GITHUB_REPOSITORY.split('/')[1];
    return `/${name}/`;
  }
  return '/';
}

const staticDemo = process.env.VITE_STATIC_DEMO === 'true';

export default defineConfig({
  base: pagesBase(),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Svaraa Lite',
        short_name: 'Svaraa',
        theme_color: '#3B1F2B',
        background_color: '#FBF8F3',
        display: 'standalone',
        start_url: pagesBase(),
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_STATIC_DEMO': JSON.stringify(staticDemo ? 'true' : 'false'),
  },
  resolve: {
    alias: [
      {
        find: '@svaraa/ui/tokens.css',
        replacement: path.resolve(__dirname, '../../packages/ui/src/tokens/tokens.css'),
      },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@svaraa/ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: '@svaraa/shared', replacement: path.resolve(__dirname, '../../packages/shared/src') },
      {
        find: '@svaraa/walkthrough-kb',
        replacement: path.resolve(__dirname, '../../packages/walkthrough-kb/src'),
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/cp': { target: 'http://localhost:4000', changeOrigin: true, rewrite: (p) => p.replace(/^\/cp/, '') },
      '/tenant': { target: 'http://localhost:4001', changeOrigin: true, rewrite: (p) => p.replace(/^\/tenant/, '') },
    },
  },
});
