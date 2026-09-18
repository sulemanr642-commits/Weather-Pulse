import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for WeatherPulse
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'msedge', // Leverages Windows native Chromium Edge
      },
    },
  ],
  webServer: {
    command: 'npm.cmd run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
