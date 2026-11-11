import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  // Set PLAYWRIGHT_CHANNEL=chrome to use an existing Chrome installation.
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
    },
  ],
  webServer: [
    {
      command: 'node scripts/seed-e2e.mjs && npm run dev:api -- --persist-to .wrangler/e2e/state',
      url: 'http://localhost:8787/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev:web',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
