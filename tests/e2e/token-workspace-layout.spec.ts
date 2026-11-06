import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { tokenCanvas, tokenField } from './token-workspace-helpers';

for (const width of [320, 390, 768, 1440, 1920]) test(`selected-token workspace remains usable at ${width}px`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 }); await page.goto('./#design-tokens');
  await expect(page.locator('[data-select-token]')).toHaveCount(48); await expect(page.locator('input[data-token]')).toHaveCount(1);
  const field = await tokenField(page, 'color.surface'); await field.fill('#fafafa'); const editedRect = await field.boundingBox(); if (!editedRect) throw new Error('Focused edit missing'); expect(editedRect.y).toBeGreaterThanOrEqual(0); expect(editedRect.y + editedRect.height).toBeLessThanOrEqual(1000); await expect(page.getByLabel('Unsaved change count')).toHaveText('1 unsaved change');
  await tokenCanvas(page); const table = page.getByRole('region', { name: 'Token table', exact: true });
  expect(await table.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  const last = page.locator('[data-select-token]').last(); const lastKey = await last.getAttribute('data-select-token'); if (!lastKey) throw new Error('Missing last token');
  await last.scrollIntoViewIfNeeded(); await last.click();
  const input = page.locator('input[data-token]'); await expect(input).toBeFocused();
  const rect = await input.boundingBox(); if (!rect) throw new Error('Inspector input missing'); expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.y + rect.height).toBeLessThan(1000);
  await expect(page.locator('.token-editor__field h2')).toHaveText(lastKey);
  await tokenField(page, 'color.surface'); await expect(field).toHaveValue('#fafafa');
  await page.getByRole('combobox', { name: 'Canvas theme', exact: true }).selectOption('dark'); await expect(page.getByRole('combobox', { name: 'Editing scope', exact: true })).toHaveValue('light');
  await tokenCanvas(page, 'Preview'); await expect(page.getByLabel('Token preview', { exact: true })).toBeVisible();
  await page.getByLabel('Compare light and dark', { exact: true }).check(); await expect(page.getByLabel('Other theme preview', { exact: true })).toBeVisible();
  await page.getByLabel('Token preview', { exact: true }).getByRole('button', { name: 'Open preview dialog' }).click(); await expect(page.getByRole('dialog', { name: 'Preview dialog' })).toBeVisible(); await page.keyboard.press('Escape');
  await expect(page.getByLabel('Token preview', { exact: true }).getByRole('button', { name: 'Open preview dialog' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include('.token-editor').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]); expect(errors).toEqual([]);
});

for (const width of [320, 390]) test(`draft feedback keeps the active Inspector input visible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 }); await page.goto('./#design-tokens');
  const field = await tokenField(page, 'color.surface');
  const assertVisibleGeometry = async () => { await expect.poll(async () => { const input = await field.boundingBox(), header = await page.locator('.studio-topbar').boundingBox(); return !!input && !!header && input.y >= header.y + header.height && input.y + input.height <= 844; }).toBe(true); await expect(field).toBeFocused(); };
  await field.fill('#fafafa'); await assertVisibleGeometry(); await expect(page.getByLabel('Unsaved change count')).toHaveText('1 unsaved change');
  await field.fill('{primitive.color.missing}'); await assertVisibleGeometry(); await expect(page.getByRole('status', { name: 'Draft validation' })).toContainText('Missing reference');
  await page.getByRole('button', { name: 'Undo last change', exact: true }).click(); await expect(field).toHaveValue('#fafafa'); await field.focus(); await assertVisibleGeometry();
  await page.getByRole('combobox', { name: 'Canvas theme', exact: true }).selectOption('dark'); await field.focus(); await assertVisibleGeometry(); await expect(field).toHaveValue('#fafafa');
  await page.getByRole('combobox', { name: 'Editing scope', exact: true }).selectOption('dark'); await expect(field).toHaveValue(''); await page.getByRole('combobox', { name: 'Editing scope', exact: true }).selectOption('light'); await expect(field).toHaveValue('#fafafa'); await field.focus(); await assertVisibleGeometry();
  await page.setViewportSize({ width: 1440, height: 844 }); await page.setViewportSize({ width, height: 844 }); await assertVisibleGeometry();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
