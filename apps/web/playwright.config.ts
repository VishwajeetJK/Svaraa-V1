import { defineConfig } from '@playwright/test';

const reuse = !process.env.CI;

/** Starts CP + tenant + web unless already up (local). CI always boots fresh. */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: process.env.WEB_URL ?? 'http://127.0.0.1:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'pnpm --filter @svaraa/control-plane exec tsx src/index.ts',
      url: 'http://127.0.0.1:4000/health',
      reuseExistingServer: reuse,
      timeout: 120_000,
      cwd: '../..',
    },
    {
      command: 'pnpm --filter @svaraa/tenant exec tsx src/index.ts',
      url: 'http://127.0.0.1:4001/health',
      reuseExistingServer: reuse,
      timeout: 120_000,
      cwd: '../..',
    },
    {
      command: 'pnpm --filter @svaraa/web exec vite --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: reuse,
      timeout: 120_000,
      cwd: '../..',
    },
  ],
});
