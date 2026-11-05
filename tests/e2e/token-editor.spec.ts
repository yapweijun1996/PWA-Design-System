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
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workspace preview' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Editor', exact: true }).click();
  await first.fill('#f7fafc');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByLabel('Token preview', { exact: true })).toBeVisible();
  await expect.poll(() => page.getByLabel('Token preview', { exact: true }).evaluate(node => node.style.getPropertyValue('--ds-color-background'))).toBe('#f7fafc');
  await page.getByRole('button', { name: 'Editor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workspace preview' }).first()).toBeHidden();
  await expect(first).toHaveValue('#f7fafc');
});

test('legacy saved breakpoint overrides migrate without losing other values before paint', async ({ page }) => {
  const saved = JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: { 'breakpoint.tablet': '1024px' }, light: { 'color.surface': '#fafafa' }, dark: {} } });
  await page.addInitScript(value => { localStorage.setItem('pwa-ds-token-overrides-v1', value); requestAnimationFrame(() => { (window as unknown as { firstSurface: string }).firstSurface = getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim(); }); }, saved);
  await page.reload();
  await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
  await expect(page.locator('.token-editor__status')).toContainText('Legacy breakpoint overrides are no longer applied');
  await expect(page.getByText('Layout breakpoints and viewport presets (read-only)')).toBeVisible();
  await expect(page.getByLabel('breakpoint.tablet override')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { firstSurface?: string }).firstSurface)).toBe('#fafafa');
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBe(saved);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-breakpoint-tablet').trim())).toBe('768px');
});

test('pending imports announce progress and Commit explicitly cancels the unread configuration', async ({ page }) => {
  const surface = page.getByLabel('color.surface override'); await surface.fill('#fafafa');
  await page.evaluate(() => {
    File.prototype.text = () => new Promise(resolve => { (window as unknown as { finishPendingImport: (text: string) => void }).finishPendingImport = resolve; });
  });
  await page.getByText('Import, export & reset', { exact: true }).click();
  await page.getByLabel('Import token configuration').setInputFiles({ name: 'pending.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  const status = page.locator('.token-editor__status'); await expect(status).toContainText('Reading token configuration'); await expect(status).toContainText('validated before preview'); await expect(status).toContainText('Committing cancels this read');
  await page.getByRole('button', { name: 'Commit changes' }).click(); await expect(status).toContainText('Pending import canceled. Current draft committed');
  await page.evaluate(() => (window as unknown as { finishPendingImport: (text: string) => void }).finishPendingImport(JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#f8f8f8' }, dark: {} } })));
  await expect(surface).toHaveValue('#fafafa'); await expect(status).toContainText('Pending import canceled. Current draft committed');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pwa-ds-token-overrides-v1') ?? '{}').overrides.light['color.surface'])).toBe('#fafafa');
});

test('a passing local preview explains project-wide contrast failures in another theme', async ({ page }) => {
  await page.getByLabel('Editing scope').selectOption('global'); await page.getByLabel('Preview theme').selectOption('light');
  const surface = page.getByLabel('color.surface override'); await surface.fill('#fafafa');
  const status = page.getByRole('status', { name: 'Draft validation' }); await expect(status).toContainText('project-wide checks (96 combinations)'); await expect(status).toContainText('example: dark/'); await expect(status).toContainText('even when this preview passes');
  await expect(surface).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByLabel('Token preview', { exact: true }).getByLabel('Preview contrast checks', { exact: true }).getByRole('listitem').first()).toContainText('Pass');
  await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  const statusId = await status.getAttribute('id'); expect(statusId).toBeTruthy(); await expect(surface).toHaveAttribute('aria-describedby', new RegExp(statusId ?? 'missing-status-id'));
});

test('alias validation persists through primitive copying, pending imports and navigation warnings', async ({ page }) => {
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }); File.prototype.text = () => new Promise<string>(() => {}); });
  const surface = page.getByLabel('color.surface override'), validation = page.getByRole('status', { name: 'Draft validation' }), feedback = page.locator('.token-editor__status');
  await surface.fill('{primitive.color.missing}'); await expect(validation).toContainText('Missing reference: primitive.color.missing'); const diagnostic = await validation.textContent(), id = await validation.getAttribute('id'); expect(id).toBeTruthy(); await expect(surface).toHaveAttribute('aria-describedby', new RegExp(id ?? 'missing-validation-id'));
  await page.getByText('View primitive source tokens', { exact: true }).click(); await page.locator('.token-editor__help').filter({ has: page.getByText('View primitive source tokens', { exact: true }) }).locator('details > summary').filter({ hasText: /^color$/ }).click();
  await page.getByRole('button', { name: 'Copy color.white name', exact: true }).click(); await expect(feedback).toHaveText('Copied color.white.'); await expect(validation).toHaveText(diagnostic ?? 'missing diagnostic');
  await page.getByText('Import, export & reset', { exact: true }).click(); await page.getByLabel('Import token configuration').setInputFiles({ name: 'pending.json', mimeType: 'application/json', buffer: Buffer.from('{}') }); await expect(feedback).toContainText('Reading token configuration'); await expect(validation).toHaveText(diagnostic ?? 'missing diagnostic');
  await page.getByRole('link', { name: 'Overview', exact: true }).click(); await expect(feedback).toContainText('before leaving this page'); await expect(page).toHaveURL(/#design-tokens$/); await expect(validation).toHaveText(diagnostic ?? 'missing diagnostic'); await expect(validation).toBeVisible(); await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  await surface.fill('#fafafa'); await expect(validation).toHaveCount(0); await expect(page.locator('.token-editor__validation')).toBeHidden(); await expect(page.locator('.token-editor__validation')).toBeEmpty(); await expect(surface).not.toHaveAttribute('aria-describedby', new RegExp(id ?? 'missing-validation-id'));
});

test('rejected contrast imports describe the imported combinations while retaining the invalid draft diagnosis', async ({ page }) => {
  const muted = page.getByLabel('color.text-muted override'), validation = page.getByRole('status', { name: 'Draft validation' }), feedback = page.locator('.token-editor__status');
  await muted.fill('#757575'); await expect(validation).toContainText('color.text-muted / color.background requires 4.5:1'); const diagnostic = await validation.textContent(), id = await validation.getAttribute('id'); expect(id).toBeTruthy();
  const before = await page.evaluate(() => ({ stored: localStorage.getItem('pwa-ds-token-overrides-v1'), style: document.documentElement.getAttribute('style') }));
  const incoming = { schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: { 'color.surface': '#fafafa' }, light: {}, dark: {} } };
  await page.getByText('Import, export & reset', { exact: true }).click(); await page.getByLabel('Import token configuration').setInputFiles({ name: 'contrast.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(incoming)) });
  await expect(feedback).toContainText('Import rejected: Configuration fails project-wide contrast checks'); await expect(feedback).toContainText('color.text / color.surface requires 4.5:1 (example: dark/'); await expect(feedback).not.toContainText('color.text-muted / color.background');
  await expect(validation).toHaveText(diagnostic ?? 'missing diagnostic'); await expect(validation).toBeVisible(); await expect(muted).toHaveAttribute('aria-describedby', new RegExp(id ?? 'missing-validation-id')); await expect(muted).toHaveAttribute('aria-invalid', 'false'); await expect(muted).toHaveValue('#757575'); await expect(page.getByLabel('color.surface override')).toHaveValue(''); await expect(page.getByLabel('Unsaved change count')).toContainText('1 unsaved change');
  expect(await page.evaluate(() => ({ stored: localStorage.getItem('pwa-ds-token-overrides-v1'), style: document.documentElement.getAttribute('style') }))).toEqual(before);
  for (const name of ['Commit changes', 'Export JSON', 'Export CSS']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel draft' }).click(); await expect(page.locator('.token-editor__validation')).toBeHidden(); await expect(page.locator('.token-editor__validation')).toBeEmpty(); await expect(muted).not.toHaveAttribute('aria-describedby', new RegExp(id ?? 'missing-validation-id'));
});
