import { expect, test, type Frame, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function previewFrame(page: Page): Promise<Frame> {
  const handle = await page.getByTitle('Layout preview').elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) throw new Error('Layout preview frame not available');
  return frame;
}

test('layout presets and editable width set the actual sandboxed iframe viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/PWA-Design-System/#layout-playground');
  await expect(page.getByRole('heading', { name: 'Layout Playground' })).toBeVisible();
  const iframe = page.getByTitle('Layout preview');
  await expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin');
  const frame = await previewFrame(page);
  await expect(frame.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  for (const [name, width] of [['Mobile', 390], ['Tablet', 768], ['Desktop', 1440]] as const) {
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
    await expect.poll(() => frame.evaluate(() => window.innerWidth)).toBe(width);
    await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toHaveAttribute('aria-pressed', 'true');
  }
  const width = page.getByLabel('Viewport width (px)');
  await width.fill('1024'); await width.press('Tab');
  await expect.poll(() => frame.evaluate(() => window.innerWidth)).toBe(1024);
  await expect(page.getByText('1024 px')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await frame.evaluate(() => document.querySelectorAll('script,link').length)).toBe(0);
  await width.fill('100'); await width.press('Tab');
  expect(await width.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
  await page.getByRole('button', { name: /^Mobile/ }).click();
  expect(await width.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
});

test('all seven local examples render, the table scrolls locally, and appearance follows the Studio', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/PWA-Design-System/#layout-playground');
  const frame = await previewFrame(page);
  await page.getByRole('button', { name: /^Mobile/ }).click();
  const example = page.getByRole('combobox', { name: 'Example', exact: true });
  const samples = [['dashboard', 'Dashboard'], ['erp-form', 'ERP form'], ['data-table', 'Data table'], ['settings', 'Settings page'], ['card-grid', 'Card grid'], ['dialog', 'Dialog'], ['mobile-navigation', 'Mobile navigation']] as const;
  for (const [value, name] of samples) {
    await example.selectOption(value);
    await expect(frame.getByRole('heading', { name, exact: true })).toBeVisible();
    if (value === 'erp-form') {
      const fontSize = await frame.getByLabel('Order reference').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(16);
    }
  }
  await example.selectOption('data-table');
  const tableRegion = frame.getByRole('region', { name: 'Scrollable example table' });
  const overflow = await tableRegion.evaluate(element => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(overflow.scroll).toBeGreaterThan(overflow.client);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const before = await frame.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
  await page.getByRole('combobox', { name: 'Studio theme' }).selectOption('dark');
  await expect.poll(() => frame.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(before);
  await example.selectOption('dialog'); await expect(frame.getByRole('dialog', { name: 'Example dialog' })).toBeVisible();
  await example.selectOption('mobile-navigation'); await expect(frame.getByRole('navigation', { name: 'Example navigation' })).toBeVisible();
});

test('Studio layout switches at the authoritative build-time breakpoints', async ({ page }) => {
  const source = JSON.parse(readFileSync(resolve('packages/tokens/primitives.json'), 'utf8')) as Record<string, { $value: string }>;
  const mobile = Number.parseInt(source['breakpoint.mobile'].$value, 10), desktop = Number.parseInt(source['breakpoint.desktop'].$value, 10);
  await page.setViewportSize({ width: mobile - 1, height: 900 }); await page.goto('./#components');
  const layout = page.locator('.ws-layout'), catalog = page.locator('.pg-catalog'), preview = page.locator('.pg-stage'), inspector = page.locator('.pg-settings');
  await expect(layout).toBeVisible();
  for (const [width, columns] of [[mobile - 1, 1], [mobile, 2], [desktop, 2], [desktop + 1, 2], [1440, 5]]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => layout.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(columns);
    await expect(page.locator('.ws-workspace')).toHaveAttribute('data-mode', width < mobile ? 'phone' : width <= desktop + 1 ? 'compact' : 'wide');
    await expect(preview).toBeVisible();
    if (width < mobile) await expect(inspector).toBeHidden(); else await expect(inspector).toBeVisible();
    const explorer = page.getByRole('button', { name: 'Explorer', exact: true });
    if (width <= desktop + 1) {
      await expect(catalog).toBeHidden(); await expect(explorer).toBeVisible(); await explorer.click();
      await expect(catalog).toBeVisible(); await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeFocused();
      if (width < mobile) { await expect(preview).toBeHidden(); await expect(inspector).toBeHidden(); }
      else { await expect(preview).toBeVisible(); await expect(inspector).toBeVisible(); }
      await page.keyboard.press('Escape'); await expect(explorer).toBeFocused(); await expect(catalog).toBeHidden(); await expect(preview).toBeVisible();
    } else { await expect(catalog).toBeVisible(); await expect(explorer).toBeHidden(); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
