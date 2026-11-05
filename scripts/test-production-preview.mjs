import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { resolve } from 'node:path';

const server = await preview({
  configFile: resolve('apps/studio/vite.config.ts'),
  logLevel: 'silent',
  preview: { host: '127.0.0.1', port: 0, strictPort: true }
});
let browser;
try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Preview did not bind a TCP port');
  const base = `http://127.0.0.1:${address.port}/PWA-Design-System/`;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {})
  });
  const valid = JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#fafafa' }, dark: {} } });
  const malicious = '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"color.surface":"#ffffff; background:url(https://example.invalid)"},"light":{},"dark":{}}}';
  for (const [kind, saved] of [['valid', valid], ['malicious', malicious]]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage(); const errors = []; const external = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!request.url().startsWith(base)) external.push(request.url()); });
      await page.addInitScript(value => {
        localStorage.setItem('pwa-ds-token-overrides-v1', value);
        localStorage.setItem('pwa-ds-theme', 'light');
        requestAnimationFrame(() => { window.firstSurface = getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim(); });
      }, saved);
      // Only the parser-blocking bootstrap and compiled stylesheet may affect this first-frame check.
      await page.route('**/assets/*.js', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
      await page.goto(base);
      await page.waitForFunction(() => window.firstSurface !== undefined);
      const result = await page.evaluate(() => ({ first: window.firstSurface, bootstrap: Boolean(document.getElementById('pwa-ds-prepaint-overrides')), stored: localStorage.getItem('pwa-ds-token-overrides-v1') }));
      if (kind === 'valid' && (result.first !== '#fafafa' || !result.bootstrap)) throw new Error('Valid saved token did not reach the first frame');
      if (kind === 'malicious' && (result.first !== '#ffffff' || result.bootstrap || result.stored !== saved)) throw new Error('Invalid saved token affected the first frame or storage');
      if (errors.length || external.length) throw new Error(`Unexpected ${kind} bootstrap error or external request`);
    } finally { await context.close(); }
  }
  const context = await browser.newContext();
  try {
    const page = await context.newPage(); const failures = []; const errors = []; const external = []; const assets = [];
    page.on('response', response => {
      if (response.url().startsWith(base) && /\.(?:js|css|svg)(?:\?|$)/.test(response.url())) {
        assets.push(new URL(response.url()).pathname);
        if (response.status() >= 400) failures.push(response.status());
      }
    });
    page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('about:')) external.push(request.url()); });
    page.on('requestfailed', request => failures.push(request.failure()?.errorText ?? 'request failed'));
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${base}#overview`);
    await page.getByRole('heading', { name: 'A shared foundation for better interfaces.' }).waitFor();
    for (const [hash, heading] of [['components', 'Components'], ['design-tokens', 'Design tokens'], ['layout-playground', 'Layout Playground']]) {
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.getByRole('heading', { name: heading, exact: true }).first().waitFor();
    }
    if (!assets.includes('/PWA-Design-System/token-prepaint.js') || !assets.includes('/PWA-Design-System/theme-init.js')) throw new Error('Required production bootstrap assets were not loaded');
    if (failures.length || errors.length || external.length) throw new Error(`Production preview had ${failures.length} failed resources, ${errors.length} console/page errors and ${external.length} external requests`);
    console.log(`Production preview passed first-frame validation, subpath navigation and ${assets.length} asset responses.`);
  } finally { await context.close(); }
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose, reject) => server.httpServer.close(error => error ? reject(error) : resolveClose()));
}
