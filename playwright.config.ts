import { defineConfig, devices } from '@playwright/test';

const DEFAULT_PORT = Number(process.env.E2E_PORT ?? 4173) || 4173;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${DEFAULT_PORT}`;
const SHOULD_START_WEB_SERVER = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['line']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  webServer: SHOULD_START_WEB_SERVER
    ? {
        command: `npm run dev:client -- --host 127.0.0.1 --port ${DEFAULT_PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
