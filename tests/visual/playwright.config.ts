import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', testMatch: 'visual.spec.ts', workers: 1, fullyParallel: false,
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4175/PWA-Design-System/', browserName: 'chromium',
    locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', reducedMotion: 'reduce', deviceScaleFactor: 1,
    launchOptions: process.env.VISUAL_SMOKE === '1' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}
  },
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175/PWA-Design-System/', reuseExistingServer: false, timeout: 30000 }
});
