import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('desktop preview and property controls share the workbench above supporting documentation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('./#components');
  const preview = page.getByRole('region', { name: 'Live component preview' }), properties = page.getByRole('region', { name: 'Preview properties' });
  await expect(preview).toBeVisible(); await expect(properties).toBeVisible();
  const p = await preview.boundingBox(), c = await properties.boundingBox(); if (!p || !c) throw new Error('Missing workbench');
  expect(Math.abs(p.y - c.y)).toBeLessThan(2); expect(p.x + p.width).toBeLessThanOrEqual(c.x); const controls = await properties.locator('.pg-controls').boundingBox(); if (!controls) throw new Error('Missing properties'); expect(controls.y + controls.height).toBeLessThan(900);
  await expect(page.locator('.pg-settings pre')).toHaveCount(0); await page.getByRole('tab', { name: 'Code', exact: true }).click(); await expect(page.getByRole('button', { name: 'Copy code', exact: true })).toBeVisible(); await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute('aria-selected', 'true'); await expect(page.locator('#pg-panel-Usage')).toBeHidden(); await expect(page.locator('#pg-panel-API')).toBeHidden();
  await properties.getByLabel('Label or message').fill('Publish'); await expect(preview.getByRole('button', { name: 'Publish', exact: true })).toBeVisible(); await expect(page.locator('pre code')).toContainText('Publish');
});

test('mobile picker closes with Escape or selection, preserves search and restores meaningful focus across resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#components');
  const toggle = page.getByRole('button', { name: 'Explorer', exact: true }), catalog = page.getByRole('region', { name: 'Component catalog' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(catalog).toHaveCount(0);
  await toggle.click(); const search = page.getByRole('searchbox', { name: 'Search components' }); await expect(search).toBeFocused(); await search.fill('dialog'); await page.keyboard.press('Escape'); await expect(toggle).toBeFocused(); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click(); await expect(search).toHaveValue('dialog'); await catalog.getByRole('button', { name: 'Dialog', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dialog', exact: true })).toBeFocused(); await expect(toggle).toHaveAccessibleName('Explorer'); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const open = page.locator('.pg-preview').getByRole('button', { name: 'Open dialog' }); await open.click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(open).toBeFocused();
  await toggle.click(); await page.setViewportSize({ width: 1280, height: 900 }); await expect(search).toBeFocused(); await page.setViewportSize({ width: 390, height: 844 }); await expect(search).toBeFocused(); await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused(); await page.setViewportSize({ width: 1280, height: 900 }); await expect(page.getByRole('heading', { name: 'Dialog', exact: true })).toBeFocused();
});

for (const width of [320, 768, 1440]) test(`component workbench fits ${width}px and keeps catalog/end content reachable`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await page.setViewportSize({ width, height: 900 }); await page.goto('./#components');
  if (width <= 768) await page.getByRole('button', { name: 'Explorer', exact: true }).click();
  const list = page.getByRole('region', { name: 'Scrollable component list' });
  await list.evaluate(node => { node.scrollTop = node.scrollHeight; }); await expect(list.getByRole('button', { name: 'Data Table', exact: true })).toBeInViewport(); await list.getByRole('button', { name: 'Data Table', exact: true }).click();
  await page.getByRole('tab', { name: 'Usage', exact: true }).click(); await expect(page.locator('.pg-usage')).toHaveAttribute('open', ''); await page.getByRole('tab', { name: 'API', exact: true }).click(); await expect(page.locator('.pg-api-details')).toHaveAttribute('open', '');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2)); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await expect(page.locator('.pg-properties dd').last()).toBeInViewport(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0)); await expect(page.getByRole('heading', { name: 'Components', exact: true })).toBeInViewport(); expect(errors).toEqual([]);
  expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});

test('short wide viewport retains a usable catalog and keyboard access to its last component', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 320 }); await page.goto('./#components');
  const catalog = page.getByRole('region', { name: 'Component catalog' }), list = page.getByRole('region', { name: 'Scrollable component list' });
  expect(await catalog.evaluate(node => getComputedStyle(node).position)).toBe('static');
  const height = await list.evaluate(node => node.clientHeight); expect(height).toBeGreaterThanOrEqual(128);
  const last = list.getByRole('button', { name: 'Data Table', exact: true }); await last.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Data Table', exact: true })).toBeVisible();
  await expect(last).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
