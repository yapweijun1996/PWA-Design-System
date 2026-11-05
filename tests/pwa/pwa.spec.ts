import { test, expect } from '@playwright/test';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

let temporary = '';
let server: Server;
let site = '';
let staleFile = '';
let origin = '';
const base = '/PWA-Design-System/';

test.beforeAll(async () => {
  temporary = mkdtempSync(join(tmpdir(), 'pwa-studio-test-'));
  const repo = process.cwd();
  for (const name of ['apps', 'packages']) cpSync(join(repo, name), join(temporary, name), { recursive: true });
  cpSync(join(repo, 'package.json'), join(temporary, 'package.json'));
  symlinkSync(join(repo, 'node_modules'), join(temporary, 'node_modules'), 'dir');
  const build = (name: string): void => {
    execFileSync(process.execPath, [join(repo, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'apps/studio/vite.config.ts'], { cwd: temporary, stdio: 'pipe' });
    cpSync(join(temporary, 'dist/studio'), join(temporary, name), { recursive: true });
  };
  build('a');
  build('repeat');
  expect(readFileSync(join(temporary, 'a/sw.js'), 'utf8')).toBe(readFileSync(join(temporary, 'repeat/sw.js'), 'utf8'));
  const layout = join(temporary, 'apps/studio/src/features/layout/index.ts');
  const contents = readFileSync(layout, 'utf8');
  if (!contents.includes('Layout Playground')) throw new Error('Expected layout build marker is missing');
  writeFileSync(layout, contents.replace('Layout Playground', 'Layout Playground Updated'));
  const prepaint = join(temporary, 'apps/studio/src/features/tokens/prepaint.ts');
  writeFileSync(prepaint, `${readFileSync(prepaint, 'utf8')}\ndocument.documentElement.dataset.pwaTestBuild = 'b';\n`);
  build('b');
  site = join(temporary, 'a');
  server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(base)) { response.writeHead(404).end(); return; }
    if (url.pathname === `${base}private.json`) { response.setHeader('content-type', 'application/json'); response.end('{"private":true}'); return; }
    const selectedSite = staleFile && url.pathname === `${base}${staleFile}` ? join(temporary, 'a') : site;
    const path = resolve(selectedSite, url.pathname.slice(base.length) || 'index.html');
    if (!path.startsWith(`${selectedSite}/`)) { response.writeHead(403).end(); return; }
    try {
      const data = readFileSync(path);
      const extension = path.split('.').at(-1);
      const contentType: Record<string, string> = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', webmanifest: 'application/manifest+json', png: 'image/png', svg: 'image/svg+xml' };
      response.setHeader('content-type', contentType[extension ?? ''] ?? 'application/octet-stream');
      response.setHeader('cache-control', 'public, max-age=3600');
      response.end(data);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server address');
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  if (temporary) rmSync(temporary, { recursive: true, force: true });
});

test.beforeEach(() => { site = join(temporary, 'a'); staleFile = ''; });

test('production offline shell, protected update and old lazy chunks', async ({ page, context }) => {
  await page.goto(`${origin}${base}`);
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  expect(manifest.url).toBe(`${origin}${base}manifest.webmanifest`);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  // Playwright's isolated browser context is private and cannot exercise an OS install.
  expect(installability.installabilityErrors.filter(error => error.errorId !== 'in-incognito')).toEqual([]);
  const oldVersion = await page.locator('meta[name="studio-version"]').getAttribute('content');
  expect(oldVersion).toMatch(/^[a-f0-9]{20}$/);
  await page.evaluate(() => fetch('/PWA-Design-System/private.json?token=example'));
  expect(await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))).flat().some(url => url.includes('private.json')))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await page.goto(`${origin}${base}#documentation`);
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Open Accessibility Lab' }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility Lab', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '21.00:1' })).toBeVisible();
  await page.getByRole('link', { name: /Components/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Components', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Design Tokens/ }).first().click();
  const token = page.getByRole('textbox', { name: 'color.background override' });
  await expect(token).toBeVisible();
  await context.setOffline(false);
  site = join(temporary, 'b');
  await page.evaluate(() => {
    const original = ServiceWorkerRegistration.prototype.update;
    let calls = 0;
    ServiceWorkerRegistration.prototype.update = function () { calls++; document.documentElement.dataset.updateChecks = String(calls); return original.call(this); };
    const now = Date.now;
    Date.now = () => now() + 301000;
    for (let index = 0; index < 5; index++) window.dispatchEvent(new Event('online'));
  });
  const update = page.locator('#pwa-update');
  await expect(update).toBeVisible();
  expect(await page.locator('html').getAttribute('data-update-checks')).toBe('1');
  await page.getByText('Import, export & reset').click();
  await page.evaluate(() => { File.prototype.text = () => new Promise(() => {}); });
  await page.locator('input[type="file"]').setInputFiles({ name: 'pending.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await page.getByRole('link', { name: /Overview/ }).first().click();
  await expect(page).toHaveURL(/#design-tokens$/);
  await expect(page.locator('.token-editor__status')).toContainText('before leaving');
  await update.getByRole('button', { name: 'Prepare update' }).click();
  await expect(update.getByRole('status')).toContainText('finish importing');
  await page.getByRole('button', { name: 'Cancel draft' }).click();
  await token.fill('invalid color');
  await page.getByRole('link', { name: /Overview/ }).first().click();
  await expect(page).toHaveURL(/#design-tokens$/);
  await expect(token).toHaveValue('invalid color');
  await update.getByRole('button', { name: 'Prepare update' }).click();
  await expect(update.getByRole('status')).toContainText('Save or cancel');
  await expect(token).toHaveValue('invalid color');
  await page.getByRole('button', { name: 'Cancel draft' }).click();
  const surface = page.getByRole('textbox', { name: 'color.surface override' });
  await surface.fill('#fafafa');
  await page.getByRole('link', { name: /Overview/ }).first().click();
  await expect(page).toHaveURL(/#design-tokens$/);
  await expect(surface).toHaveValue('#fafafa');
  await update.getByRole('button', { name: 'Prepare update' }).click();
  await expect(update.getByRole('status')).toContainText('Save or cancel');
  await expect(surface).toHaveValue('#fafafa');
  await page.getByRole('button', { name: 'Commit changes' }).click();
  const other = await context.newPage();
  await other.goto(`${origin}${base}`);
  await update.getByRole('button', { name: 'Prepare update' }).click();
  await expect(update.getByRole('status')).toContainText('Close all other');
  await other.close();
  await update.getByRole('button', { name: 'Prepare update' }).click();
  await expect(update.getByRole('status')).toContainText('Update prepared');
  expect(await page.locator('meta[name="studio-version"]').getAttribute('content')).toBe(oldVersion);
  const lateTab = await context.newPage();
  await lateTab.goto(`${origin}${base}`);
  await context.setOffline(true);
  await page.getByRole('link', { name: /Layout Playground/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Layout Playground', exact: true })).toBeVisible();
  await context.setOffline(false);
  await lateTab.close();
  await page.reload();
  await expect.poll(() => page.locator('meta[name="studio-version"]').getAttribute('content')).not.toBe(oldVersion);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pwa-ds-token-overrides-v1') ?? '{}').overrides.light['color.surface'])).toBe('#fafafa');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Layout playground updated/i })).toBeVisible();
});

test('cache cleanup defers for unknown clients and only removes obsolete Studio caches', async ({ page, context }) => {
  await page.goto(`${origin}${base}`);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const stale = 'pwa-design-system-static-aaaaaaaaaaaaaaaaaaaa';
  const prior = 'pwa-design-system-static-bbbbbbbbbbbbbbbbbbbb';
  await page.evaluate(async ({ stale, prior }) => { await caches.open(stale); await caches.open(prior); await caches.open('unrelated-app'); }, { stale, prior });
  const unknown = await context.newPage();
  await unknown.goto(`${origin}${base}private.json`);
  await page.evaluate(() => navigator.serviceWorker.controller?.postMessage({ type: 'CLEANUP_CACHES' }));
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => caches.keys())).toContain(stale);
  await unknown.close();
  await page.evaluate(() => navigator.serviceWorker.controller?.postMessage({ type: 'CLEANUP_CACHES' }));
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain(stale);
  const remaining = await page.evaluate(() => caches.keys());
  expect(remaining).toContain(prior);
  expect(remaining).toContain('unrelated-app');
});

for (const file of ['index.html', 'token-prepaint.js']) {
  test(`mixed deployment refuses installation when ${file} is stale`, async ({ page, context }) => {
    await page.goto(`${origin}${base}`);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    const oldVersion = await page.locator('meta[name="studio-version"]').getAttribute('content');
    const newIndex = readFileSync(join(temporary, 'b/index.html'), 'utf8');
    const newVersion = newIndex.match(/name="studio-version" content="([a-f0-9]{20})"/)?.[1];
    expect(newVersion).toBeTruthy();
    expect(newVersion).not.toBe(oldVersion);
    site = join(temporary, 'b'); staleFile = file;
    const state = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('Missing service worker registration');
      const result = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('No failed update')), 10000);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'redundant' || worker.state === 'installed') { clearTimeout(timeout); resolve(worker.state); }
          });
        }, { once: true });
      });
      await registration.update();
      return result;
    });
    expect(state).toBe('redundant');
    expect(await page.evaluate(() => caches.keys())).not.toContain(`pwa-design-system-static-${newVersion}`);
    await context.setOffline(true);
    await page.reload();
    expect(await page.locator('meta[name="studio-version"]').getAttribute('content')).toBe(oldVersion);
  });
}
