import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 8090;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // Each journey builds its own data, so these could run in parallel, but one at a time
  // keeps a failure's trace and the stack's logs easy to read.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  // Under dist/, which is already ignored by git, Prettier, and ESLint.
  outputDir: 'dist/e2e/test-results',
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'dist/e2e/report' }]]
    : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node scripts/test/serve-web.js ${process.env.E2E_WEB_DIR ?? 'dist/e2e/web'} ${WEB_PORT}`,
    url: `http://localhost:${WEB_PORT}`,
    // Always the export this run just built, never whatever else is on the port.
    reuseExistingServer: false,
  },
});
