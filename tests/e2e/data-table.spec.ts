import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = `/PWA-Design-System/@fs${resolve('packages/core/src/table/index.ts')}`;
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { document.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(node => { node.remove(); }); document.body.replaceChildren(); });
  await page.addStyleTag({ content: readFileSync(resolve('packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve('packages/core/src/table/table.css'), 'utf8') });
  await page.evaluate(async modulePath => {
    const { createDataTable } = await import(/* @vite-ignore */ modulePath);
    const table = createDataTable({ label: 'People', selectable: true, pageSize: 2,
      columns: [{ id: 'name', label: 'Employee name', sortable: true }, { id: 'dept', label: 'Department with deliberately long heading' }],
      rows: [{ id: 'b', label: 'Bea', cells: { name: 'Bea', dept: 'Operations' } }, { id: 'a', label: 'Ada', cells: { name: 'Ada', dept: 'Engineering' } }, { id: 'c', label: 'Cleo', cells: { name: 'Cleo', dept: 'Support' } }] });
    const main = document.createElement('main'); main.append(table.element); document.body.append(main); Object.assign(window, { fixtureTable: table });
  }, path);
});

test('keyboard sorting, selection and pagination preserve state and focus', async ({ page }) => {
  const all = page.getByRole('checkbox', { name: 'Select all rows on this page' }); await all.focus(); await page.keyboard.press('Space'); await expect(all).toBeChecked();
  const next = page.getByRole('button', { name: 'Next' }); await next.focus(); await page.keyboard.press('Enter'); await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(all).not.toBeChecked(); const cleo = page.getByRole('checkbox', { name: 'Select Cleo' }); await cleo.focus(); await page.keyboard.press('Space'); await expect(cleo).toBeChecked(); await expect(cleo).toBeFocused();
  const sort = page.getByRole('button', { name: 'Sort by Employee name' }); await sort.focus(); await page.keyboard.press('Enter'); await expect(sort).toBeFocused();
  await expect(page.getByRole('columnheader', { name: 'Sort by Employee name' })).toHaveAttribute('aria-sort', 'ascending');
  await expect(sort).toHaveText('Employee name'); await expect(sort).toHaveAccessibleName('Sort by Employee name');
  await expect(page.getByRole('columnheader', { name: 'Sort by Employee name' })).toContainText('(ascending)');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { fixtureTable: { getSelectedIds(): string[] } }).fixtureTable.getSelectedIds())).toEqual(['b', 'a', 'c']);
  expect((await new AxeBuilder({ page }).include('.ds-data-table').analyze()).violations).toEqual([]);
});

test('loading, empty and replacement states retain table semantics', async ({ page }) => {
  const sort = page.getByRole('button', { name: 'Sort by Employee name' }); await sort.focus(); await expect(sort).toBeFocused();
  await page.evaluate(() => (window as unknown as { fixtureTable: { setLoading(value: boolean): void } }).fixtureTable.setLoading(true));
  await expect(page.getByRole('region', { name: 'People table scroll area' })).toBeFocused();
  await expect(page.getByRole('status').first()).toHaveText('Loading rows…'); await expect(page.getByRole('button', { name: 'Sort by Employee name' })).toBeDisabled();
  expect((await new AxeBuilder({ page }).include('.ds-data-table').analyze()).violations).toEqual([]);
  await page.evaluate(() => { const item = (window as unknown as { fixtureTable: { setLoading(value: boolean): void; setRows(value: unknown[]): void } }).fixtureTable; item.setLoading(false); item.setRows([]); });
  await expect(page.getByText('No rows to display.')).toBeVisible(); await expect(page.getByRole('checkbox', { name: 'Select all rows on this page' })).toBeDisabled();
  expect((await new AxeBuilder({ page }).include('.ds-data-table').analyze()).violations).toEqual([]);
});

for (const width of [390, 1440]) test(`responsive table confines overflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  const region = page.getByRole('region', { name: 'People table scroll area' }); await region.focus(); await expect(region).toBeFocused();
  const sizes = await region.evaluate(element => ({ scroll: element.scrollWidth, client: element.clientWidth, page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport); if (width === 390) expect(sizes.scroll).toBeGreaterThan(sizes.client);
  if (sizes.scroll > sizes.client) { await page.keyboard.press('ArrowRight'); await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0); }
});
