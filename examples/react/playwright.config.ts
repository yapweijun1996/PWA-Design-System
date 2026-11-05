import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'react.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4174/', browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {} },
  webServer: { command: 'npm run dev:react-example -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174/', reuseExistingServer: !process.env.CI, timeout: 30000 }
});
