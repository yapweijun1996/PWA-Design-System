import { defineConfig } from '@playwright/test';

const requestedBrowser = process.env.PLAYWRIGHT_BROWSER ?? 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(requestedBrowser)) {
  throw new Error('PLAYWRIGHT_BROWSER must be chromium, firefox, or webkit');
}
const browserName = requestedBrowser as 'chromium' | 'firefox' | 'webkit';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173/PWA-Design-System/',
    browserName,
    launchOptions: browserName === 'chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/PWA-Design-System/',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
