import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('./#design-tokens');
  await expect(page.getByRole('heading', { name: 'Design tokens', level: 1 })).toBeVisible();
  await expect(page.getByLabel('color.surface override')).toBeVisible();
});

test('edits preview, cancels, commits and resets without mutating saved state prematurely', async ({ page }) => {
  const surface = page.getByLabel('color.surface override'), preview = page.getByLabel('Token preview');
  await surface.fill('#fafafa');
  await expect.poll(() => preview.evaluate(el => el.style.getPropertyValue('--ds-color-surface'))).toBe('#fafafa');
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
  await page.getByRole('button', { name: 'Cancel draft' }).click(); await expect(surface).toHaveValue('');
  await surface.fill('#fafafa'); await page.getByRole('button', { name: 'Commit changes' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pwa-ds-token-overrides-v1') ?? '{}').overrides.light['color.surface'])).toBe('#fafafa');
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--ds-color-surface'))).toBe('#fafafa');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--ds-color-surface'))).toBe('#0f172a');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--ds-color-surface'))).toBe('#fafafa');
  await page.reload(); await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--ds-color-surface'))).toBe('#fafafa');
  await page.getByText('Import, export & reset', { exact: true }).click();
  await page.getByRole('button', { name: 'Reset draft to defaults' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--ds-color-surface'))).toBe('#fafafa');
  await page.getByRole('button', { name: 'Commit changes' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--ds-color-surface'))).toBe('');
});

test('imports are bounded and transactional; validated JSON and CSS can be exported', async ({ page }) => {
  await page.getByText('Import, export & reset', { exact: true }).click();
  const input = page.getByLabel('Import token configuration');
  const bad = '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"__proto__":{}},"light":{},"dark":{}}}';
  await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(bad) });
  await expect(page.getByRole('status').filter({ hasText: 'Import rejected' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
  await input.setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(65537, 32) });
  await expect(page.getByRole('status').filter({ hasText: 'exceeds 64 KiB' })).toBeVisible();
  const data = { schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#fafafa' }, dark: {} } };
  await input.setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await expect(page.getByRole('status').filter({ hasText: 'Imported configuration previewed' })).toBeVisible();
  await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
  const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  const jsonStream = await jsonDownload.createReadStream(); let json = ''; for await (const chunk of jsonStream) json += chunk.toString();
  expect(JSON.parse(json)).toEqual(data);
  const [cssDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSS' }).click()]);
  const cssStream = await cssDownload.createReadStream(); let css = ''; for await (const chunk of cssStream) css += chunk.toString();
  expect(css).toContain('--ds-color-surface: #fafafa;'); expect(css).not.toContain('url(');
  await page.addStyleTag({ content: css });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim())).toBe('#fafafa');
  const engine = `/PWA-Design-System/@fs${process.cwd()}/packages/tokens/src/engine.mjs`;
  const source = `/PWA-Design-System/@fs${process.cwd()}/apps/studio/src/features/tokens/sources.ts`;
  const mismatches = await page.evaluate(async ({ engine, source, data }) => {
    const { validateProject } = await import(/* @vite-ignore */ engine);
    const { sources } = await import(/* @vite-ignore */ source);
    const combinations = validateProject(sources, data) as Record<string, Record<string, string | number>>;
    const failed: string[] = [];
    for (const [name, expected] of Object.entries(combinations)) {
      const [theme, palette, density, kit] = name.split('/');
      Object.assign(document.documentElement.dataset, { theme, palette, density, kit });
      const style = getComputedStyle(document.documentElement);
      for (const [key, value] of Object.entries(expected)) {
        if (style.getPropertyValue(`--ds-${key.replaceAll('.', '-')}`).trim() !== String(value)) failed.push(`${name}: ${key}`);
      }
    }
    return failed;
  }, { engine, source, data });
  expect(mismatches).toEqual([]);
});

test('visible editor passes a scoped automated accessibility scan', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('.token-editor').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});


test('validated saved overrides are present by the first animation frame', async ({ page }) => {
  const saved = JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#fafafa' }, dark: {} } });
  await page.addInitScript(({ saved }) => {
    localStorage.setItem('pwa-ds-token-overrides-v1', saved);
    localStorage.setItem('pwa-ds-theme', 'light');
    requestAnimationFrame(() => { (window as unknown as { firstSurface: string }).firstSurface = getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim(); });
  }, { saved });
  await page.route('**/src/main.ts*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.reload();
  await expect.poll(() => page.evaluate(() => (window as unknown as { firstSurface?: string }).firstSurface)).toBe('#fafafa');
  await expect(page.locator('#pwa-ds-prepaint-overrides')).toHaveCount(1);
});

test('malicious saved configuration cannot change the first frame or be executed', async ({ page }) => {
  const saved = '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"color.surface":"#ffffff; background:url(https://example.invalid)"},"light":{},"dark":{}}}';
  await page.addInitScript(({ saved }) => {
    localStorage.setItem('pwa-ds-token-overrides-v1', saved);
    localStorage.setItem('pwa-ds-theme', 'light');
    requestAnimationFrame(() => { (window as unknown as { firstSurface: string }).firstSurface = getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim(); });
  }, { saved });
  await page.route('**/src/main.ts*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.reload();
  await expect.poll(() => page.evaluate(() => (window as unknown as { firstSurface?: string }).firstSurface !== undefined)).toBe(true);
  await expect(page.locator('#pwa-ds-prepaint-overrides')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { firstSurface: string }).firstSurface)).not.toContain('url(');
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBe(saved);
});

test('rejects muted text that fails the actual page background despite passing on white', async ({ page }) => {
  const muted = page.getByLabel('color.text-muted override');
  await muted.fill('#757575');
  await expect(page.getByRole('status').filter({ hasText: 'color.text-muted / color.background requires 4.5:1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
});

test('a delayed import cannot overwrite a newer token edit', async ({ page }) => {
  const incoming = JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#fafafa' }, dark: {} } });
  await page.evaluate(json => {
    File.prototype.text = () => new Promise(resolve => { (window as unknown as { finishImport: () => void }).finishImport = () => resolve(json); });
  }, incoming);
  await page.getByText('Import, export & reset', { exact: true }).click();
  const upload = page.getByLabel('Import token configuration');
  await upload.setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: Buffer.from(incoming) });
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { finishImport?: () => void }).finishImport)).toBe('function');
  await page.getByLabel('color.surface override').fill('#f8f8f8');
  await page.evaluate(() => (window as unknown as { finishImport: () => void }).finishImport());
  await expect(page.getByLabel('color.surface override')).toHaveValue('#f8f8f8');
  await expect.poll(() => page.getByLabel('Token preview').evaluate(node => node.style.getPropertyValue('--ds-color-surface'))).toBe('#f8f8f8');
  await expect(page.getByRole('status').filter({ hasText: 'Pending import canceled' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
});

test('prepaint rejects saved colors failing actual page background contrast', async ({ page }) => {
  const saved = JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.text-muted': '#757575' }, dark: {} } });
  await page.addInitScript(({ saved }) => { localStorage.setItem('pwa-ds-token-overrides-v1', saved); }, { saved });
  await page.route('**/src/main.ts*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.reload();
  await expect(page.locator('#pwa-ds-prepaint-overrides')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBe(saved);
});


test('mobile editor starts with editable tokens and keeps optional information accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  const first = page.getByLabel('color.background override');
  const position = await first.boundingBox();
  expect(position).not.toBeNull();
  if (!position) throw new Error('First token is not rendered');
  expect(position.y).toBeLessThan(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const help = page.getByText('How token overrides work', { exact: true }); await help.focus(); await page.keyboard.press('Enter');
  await expect(page.getByText(/Theme-specific overrides take precedence/)).toBeVisible();
  await page.keyboard.press('Enter'); await expect(page.getByText(/Theme-specific overrides take precedence/)).toBeHidden();
  await page.getByText('Live preview', { exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Workspace preview' })).toBeVisible();
  await first.fill('#f7fafc'); await expect(page.getByLabel('Token preview')).toBeVisible();
  await page.getByText('Live preview', { exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Workspace preview' })).toBeHidden();
});
