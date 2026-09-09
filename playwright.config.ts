import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://living-dex-companion.vercel.app',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
