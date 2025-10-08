import { defineConfig, devices } from '@playwright/test';

const previewUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/emoji-game/';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 4_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview -- --host 0.0.0.0 --port 4173',
    url: 'http://127.0.0.1:4173/emoji-game/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['iPhone 12'],
        browserName: 'chromium',
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 12'],
        browserName: 'webkit',
      },
    },
  ],
});
