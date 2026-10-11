import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@svaraa/walkthrough-kb': path.resolve(__dirname, '../../packages/walkthrough-kb/src'),
    },
  },
  test: {
    environment: 'node',
    exclude: ['**/e2e/**', '**/node_modules/**'],
  },
});
