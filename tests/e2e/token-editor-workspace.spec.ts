import { expect, test, type Page } from '@playwright/test';
import { tokenCanvas, tokenField } from './token-workspace-helpers';

async function openEditor(page: Page): Promise<void> {
  await page.goto('./#design-tokens');
  await expect(page.getByRole('heading', { name: 'Design tokens', level: 1 })).toBeVisible();
  await tokenField(page, 'color.surface');
}

test('an invalid draft outside table filters stays editable and blocks commit', async ({ page }) => {
  await openEditor(page);
  const surface = page.getByLabel('color.surface override');
  await surface.fill('#not-a-color');
  await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  await page.getByLabel(/search tokens/i).fill('radius.card');
  await expect(page.locator('[data-token-row="color.surface"]')).toBeHidden(); await expect(surface).toHaveValue('#not-a-color');
  await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  await page.getByLabel(/search tokens/i).fill('no-such-token-987');
  await expect(page.getByText(/no .*tokens|no results/i)).toBeVisible();
  await page.getByRole('button', { name: /clear filters/i }).click();
  await expect(surface).toHaveValue('#not-a-color');
  await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
});

test('searches type, source reference and resolved value without changing the draft', async ({ page }) => {
  await openEditor(page);
  const search = page.getByLabel(/search tokens/i);
  await search.fill('dimension');
  await expect(page.locator('[data-token-row="spacing.md"]')).toBeVisible();
  await expect(page.locator('[data-token-row="color.surface"]')).toBeHidden();
  await search.fill('{primitive.color.white}');
  await expect(page.getByLabel('color.surface override')).toBeVisible();
  await search.fill('#ffffff');
  await expect(page.getByLabel('color.surface override')).toBeVisible();
  await search.fill('');
  await expect(page.getByLabel('Unsaved change count')).toContainText('0');
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
});

test('canvas theme is local and editing scope survives global theme changes', async ({ page }) => {
  await openEditor(page);
  const scope = page.getByLabel(/editing scope/i);
  const previewTheme = page.getByLabel(/canvas theme/i);
  await scope.selectOption('light');
  await page.getByLabel('color.surface override').fill('#fafafa');
  const before = await page.evaluate(() => ({ dataset: { ...document.documentElement.dataset }, style: document.documentElement.getAttribute('style'), saved: localStorage.getItem('pwa-ds-token-overrides-v1'), theme: localStorage.getItem('pwa-ds-theme') }));
  await previewTheme.selectOption('dark');
  await expect(scope).toHaveValue('light');
  await expect(page.getByText(/^You are editing Light only while previewing dark/i)).toBeVisible();
  expect(await page.evaluate(() => ({ dataset: { ...document.documentElement.dataset }, style: document.documentElement.getAttribute('style'), saved: localStorage.getItem('pwa-ds-token-overrides-v1'), theme: localStorage.getItem('pwa-ds-theme') }))).toEqual(before);
  await page.locator('#theme-select').selectOption('dark');
  await expect(scope).toHaveValue('light');
  await expect(previewTheme).toHaveValue('dark');
});

test('an alias survives filters and theme changes until the picker explicitly changes it', async ({ page }) => {
  await openEditor(page);
  await page.getByLabel(/editing scope/i).selectOption('light');
  const surface = page.getByLabel('color.surface override');
  await surface.fill('{primitive.color.white}');
  await page.getByLabel(/search tokens/i).fill('color.surface');
  await page.getByLabel(/canvas theme/i).selectOption('dark');
  await page.getByLabel(/canvas theme/i).selectOption('light');
  await expect(surface).toHaveValue('{primitive.color.white}');
  await page.getByText('Import, export & reset', { exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  const stream = await download.createReadStream(); let text = ''; for await (const chunk of stream) text += chunk.toString();
  expect(JSON.parse(text).overrides.light['color.surface']).toBe('{primitive.color.white}');
  await page.getByLabel('Choose new color for color.surface', { exact: true }).fill('#fafafa');
  await expect(surface).toHaveValue('#fafafa');
});

test('no-op and undo restore a clean navigation guard', async ({ page }) => {
  await openEditor(page);
  const surface = page.getByLabel('color.surface override');
  await surface.fill('');
  await expect(page.getByRole('button', { name: /undo/i })).toBeDisabled();
  await page.getByRole('link', { name: 'Overview', exact: true }).first().click();
  await expect(page).toHaveURL(/#overview$/);
  await page.goto('./#design-tokens');
  await page.getByLabel('color.surface override').fill('#fafafa');
  await page.getByRole('button', { name: /undo/i }).click();
  await expect(page.getByLabel('color.surface override')).toHaveValue('');
  await page.getByRole('link', { name: 'Overview', exact: true }).first().click();
  await expect(page).toHaveURL(/#overview$/);
});

test('a failed commit preserves the draft, undo, storage and applied tokens', async ({ page }) => {
  await openEditor(page);
  const before = await page.evaluate(() => ({ saved: localStorage.getItem('pwa-ds-token-overrides-v1'), style: document.documentElement.getAttribute('style') }));
  await page.getByLabel('color.surface override').fill('#fafafa');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key === 'pwa-ds-token-overrides-v1') throw new Error('quota'); return original.call(this, key, value); };
  });
  await page.getByRole('button', { name: 'Commit changes' }).click();
  await expect(page.getByRole('status').filter({ hasText: /could not save|could not commit/i })).toBeVisible();
  await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
  await expect(page.getByRole('button', { name: /undo/i })).toBeEnabled();
  expect(await page.evaluate(() => ({ saved: localStorage.getItem('pwa-ds-token-overrides-v1'), style: document.documentElement.getAttribute('style') }))).toEqual(before);
  await page.getByRole('button', { name: /undo/i }).click();
  await expect(page.getByLabel('color.surface override')).toHaveValue('');
});

test('diffs span scopes and modified-only includes a pending removal', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa-ds-theme', 'light');
    localStorage.setItem('pwa-ds-token-overrides-v1', JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: { 'spacing.md': '1.5rem' }, light: { 'color.surface': '#fafafa' }, dark: {} } }));
  });
  await openEditor(page);
  const scope = page.getByLabel(/editing scope/i), count = page.getByLabel('Unsaved change count');
  await scope.selectOption('light');
  await page.getByLabel('color.surface override').fill('');
  await expect(count).toContainText('1');
  await page.getByLabel(/modified only/i).check();
  await expect(page.locator('[data-token-row="color.surface"]')).toBeVisible();
  await scope.selectOption('global');
  await (await tokenField(page, 'spacing.md')).fill('2rem');
  await expect(count).toContainText('2');
  await page.getByLabel(/modified only/i).uncheck();
  await scope.selectOption('dark');
  await (await tokenField(page, 'radius.card')).fill('2rem');
  await expect(count).toContainText('3');
  await page.getByText(/review changes\s*\(3\)/i).click();
  const review = page.locator('details').filter({ has: page.getByText('Review changes (3)', { exact: true }) });
  await expect(review.getByRole('listitem').filter({ hasText: 'Light only · color.surface:' })).toBeVisible();
  await expect(review.getByRole('listitem').filter({ hasText: 'All themes · spacing.md:' })).toBeVisible();
  await expect(review.getByRole('listitem').filter({ hasText: 'Dark only · radius.card:' })).toBeVisible();
  await page.getByRole('button', { name: /undo/i }).click();
  await expect(scope).toHaveValue('dark');
  await expect(page.getByLabel('radius.card override')).toHaveValue('');
  await expect(count).toContainText('2');
});

test('preview controls keep node identity, focus and state when a token changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await openEditor(page);
  await tokenCanvas(page, 'Preview'); const preview = page.getByLabel('Token preview');
  const sort = preview.getByRole('button', { name: 'Sort by Item' });
  await sort.click(); await expect(preview.getByRole('columnheader', { name: /item/i })).toHaveAttribute('aria-sort', 'ascending');
  await sort.focus();
  const original = await sort.elementHandle(); if (!original) throw new Error('Preview sort button missing');
  await page.evaluate(() => { const input = document.querySelector<HTMLInputElement>('[data-token="color.surface"]'); if (!input) throw new Error('Missing token'); input.value = '#fafafa'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await original.evaluate(node => node.isConnected && node === document.activeElement)).toBe(true);
  await expect(preview.getByRole('columnheader', { name: /item/i })).toHaveAttribute('aria-sort', 'ascending');
  await preview.getByRole('button', { name: 'Open preview dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Preview dialog' }); await expect(dialog).toBeVisible();
  const instance = await dialog.elementHandle(); if (!instance) throw new Error('Preview dialog missing');
  await page.evaluate(() => { const input = document.querySelector<HTMLInputElement>('[data-token="color.surface"]'); if (!input) throw new Error('Missing token'); input.value = '#f8f8f8'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await instance.evaluate(node => node.isConnected && (node as HTMLDialogElement).open)).toBe(true);
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
  await expect(preview.getByRole('button', { name: 'Open preview dialog' })).toBeFocused();
});

test('undo cancels a pending import and late completion cannot restore its draft', async ({ page }) => {
  await openEditor(page);
  const incoming = JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#f6f6f6' }, dark: {} } });
  await page.getByLabel('color.surface override').fill('#fafafa');
  await page.evaluate(json => {
    File.prototype.text = () => new Promise(resolve => { (window as unknown as { finishImport: () => void }).finishImport = () => resolve(json); });
  }, incoming);
  await page.getByText('Import, export & reset', { exact: true }).click();
  await page.getByLabel('Import token configuration').setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: Buffer.from(incoming) });
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { finishImport?: () => void }).finishImport)).toBe('function');
  await page.getByRole('button', { name: /undo/i }).click();
  await page.evaluate(() => (window as unknown as { finishImport: () => void }).finishImport());
  await expect(page.getByLabel('color.surface override')).toHaveValue('');
  await expect(page.getByLabel('Unsaved change count')).toContainText('0');
  await page.getByRole('link', { name: 'Overview', exact: true }).first().click();
  await expect(page).toHaveURL(/#overview$/);
});

test('mobile view switching and breakpoint resize preserve edits without document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await openEditor(page);
  await page.getByLabel('color.surface override').fill('#fafafa');
  await tokenCanvas(page, 'Preview');
  await expect(page.getByLabel('Token preview')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.setViewportSize({ width: 900, height: 844 });
  await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
  await page.setViewportSize({ width: 390, height: 844 });
  await tokenField(page, 'color.surface');
  await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('narrowing from desktop keeps the focused editor field visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await openEditor(page);
  await tokenCanvas(page, 'Preview');
  await expect(page.getByLabel('Token preview')).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 844 });
  const field = page.getByLabel('color.surface override');
  await expect(field).toBeVisible(); await field.focus(); await expect(field).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(field).toBeVisible(); await expect(field).toBeFocused();
  await expect(page.getByLabel('Token preview')).toBeHidden();
});

test('narrowing from desktop keeps the focused preview control visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await openEditor(page);
  await page.setViewportSize({ width: 1000, height: 844 });
  const preview = page.getByLabel('Token preview');
  await tokenCanvas(page, 'Preview'); const control = preview.getByRole('button', { name: 'Preview action' });
  await expect(control).toBeVisible(); await control.focus(); await expect(control).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(preview).toBeVisible(); await expect(control).toBeFocused();
  await expect(page.getByLabel('color.surface override')).toBeHidden();
});
