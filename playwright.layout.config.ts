import { defineConfig } from '@playwright/test';

// All API calls are fulfilled by fixtures, locally and on the deployed site.
// No real login, student data, D1/KV reads or writes are involved.
const target = process.env.WORDSPROUT_LAYOUT_URL;
const address = process.env.WORDSPROUT_VERIFY_IPV4;
const webkit = process.env.PLAYWRIGHT_BROWSER === 'webkit';
export default defineConfig({
  testDir: './tests/layout',
  outputDir: `test-results/layout-${webkit ? 'webkit' : 'chromium'}${target ? '-live' : ''}`,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: target || 'http://localhost:5173',
    browserName: webkit ? 'webkit' : 'chromium',
    channel: webkit ? undefined : process.env.PLAYWRIGHT_CHANNEL || undefined,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    launchOptions: {
      args:
        !webkit && target && address
          ? [`--host-resolver-rules=MAP ${new URL(target).hostname} ${address}`]
          : [],
    },
  },
  webServer: target
    ? undefined
    : {
        command: 'npm run dev:web',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
