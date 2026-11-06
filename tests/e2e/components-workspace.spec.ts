import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1440, 1920]) test(`workspace panels, canvas and configuration remain usable at ${width}px`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 }); await page.goto('./#components');
  const explorer = page.locator('.pg-catalog'), preview = page.locator('.pg-stage'), inspector = page.locator('.pg-settings');
  if (width > 1000) {
    const boxes = await Promise.all([explorer, preview, inspector].map(node => node.boundingBox()));
    const [a, b, c] = boxes; if (!a || !b || !c) throw new Error('Missing workspace columns');
    expect(a.x + a.width).toBeLessThanOrEqual(b.x); expect(b.x + b.width).toBeLessThanOrEqual(c.x); expect(Math.abs(a.y - c.y)).toBeLessThan(2);
  } else {
    await expect(explorer).toBeHidden(); await page.getByRole('button', { name: /^Explorer:/ }).click();
    await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeFocused(); if (width < 700) { await expect(preview).toBeHidden(); await expect(inspector).toBeHidden(); } else { await expect(preview).toBeVisible(); await expect(inspector).toBeVisible(); }
  }
  const choose = page.getByRole('button', { name: /^Explorer:/ });
  await page.getByRole('button', { name: 'Forms 7', exact: true }).click(); await expect(explorer.locator('.pg-catalog-item')).toHaveCount(7);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('absent'); await expect(page.getByText('No matching components.', { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search components' }).fill(''); await page.getByRole('button', { name: 'All 21', exact: true }).click();
  await explorer.getByRole('button', { name: 'Button', exact: true }).click();
  if (width < 700) { await expect(choose).toHaveAttribute('aria-expanded', 'false'); await expect(preview).toBeVisible(); await expect(inspector).toBeHidden(); }
  await page.getByRole('group', { name: 'Quick variant' }).getByRole('button', { name: 'Secondary', exact: true }).click();
  await expect(page.locator('.pg-preview .ds-button')).toHaveAttribute('data-variant', 'secondary'); await expect(page.locator('pre code')).toContainText('"variant": "secondary"');
  await page.getByLabel('Preview width', { exact: true }).selectOption('390');
  await expect.poll(() => page.locator('.pg-preview').evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(390);
  await page.getByLabel('Preview width', { exact: true }).selectOption('1440');
  await expect.poll(() => page.locator('.pg-preview').evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(1440);
  await expect(page.getByRole('status', { name: 'Preview canvas width' })).toHaveText('1440px canvas');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Preview width', { exact: true }).selectOption('fit');
  await page.getByRole('tab', { name: 'Preview', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Usage', exact: true })).toBeFocused(); await expect(page.locator('.pg-usage')).toBeVisible();
  await page.keyboard.press('End'); await expect(page.getByRole('tab', { name: 'Accessibility', exact: true })).toBeFocused(); await expect(page.getByRole('heading', { name: 'Keyboard and accessibility' })).toBeVisible();
  await page.keyboard.press('Home'); await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'View code', exact: true }).click(); await expect(page.getByRole('region', { name: 'Preview properties' })).toBeVisible(); await expect(page.locator('.pg-code')).toBeFocused();
  await page.getByLabel('Label or message').fill('Publish'); await expect(page.locator('pre code')).toContainText('Publish');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } }));
  await page.getByRole('button', { name: 'Copy code', exact: true }).click(); await expect(page.locator('.pg-copy-status')).toHaveText('Code copied.');
  if (width < 700) { await page.getByRole('button', { name: 'Preview', exact: true }).click(); await expect(page.locator('.pg-preview button')).toHaveText('Publish'); }
  await page.getByRole('button', { name: 'Reset properties', exact: true }).click(); await expect(page.getByRole('button', { name: 'Reset properties', exact: true })).toBeFocused(); await expect(page.locator('.pg-preview button')).toHaveText('Save');
  expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]); expect(errors).toEqual([]);
});

test('mobile properties and catalog focus survive breakpoint changes without discarding configuration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#components');
  await page.getByRole('button', { name: 'Properties', exact: true }).click(); const label = page.getByLabel('Label or message'); await label.fill('Retained');
  await page.setViewportSize({ width: 1440, height: 900 }); await expect(label).toBeFocused(); await page.setViewportSize({ width: 390, height: 844 }); await expect(label).toBeFocused(); await expect(label).toHaveValue('Retained');
  await page.getByRole('button', { name: /^Explorer:/ }).click(); const search = page.getByRole('searchbox', { name: 'Search components' }); await search.fill('dialog');
  await page.setViewportSize({ width: 768, height: 900 }); await expect(search).toBeFocused(); await page.setViewportSize({ width: 1440, height: 900 }); await expect(search).toBeFocused(); await page.setViewportSize({ width: 390, height: 844 }); await expect(search).toBeFocused();
  await expect(page.locator('.pg-stage')).toBeHidden(); await expect(page.locator('.pg-settings')).toBeHidden(); await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: /^Explorer:/ })).toBeFocused();
  await page.getByRole('button', { name: 'Properties', exact: true }).click(); await expect(label).toHaveValue('Retained');
});

test('returning to phone reveals the focused inspector despite an earlier open Explorer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#components');
  await page.getByRole('button', { name: /^Explorer:/ }).click(); await page.setViewportSize({ width: 1440, height: 900 });
  const label = page.getByLabel('Label or message'); await label.fill('Focus must survive'); await page.setViewportSize({ width: 390, height: 844 });
  await expect(label).toBeVisible(); await expect(label).toBeFocused(); await expect(label).toHaveValue('Focus must survive'); await expect(page.locator('.pg-catalog')).toBeHidden();
});

for (const width of [390, 768, 1440]) test(`dark selected controls and information panels pass axe at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await page.goto('./#components'); await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
  if (width <= 1000) await page.getByRole('button', { name: /^Explorer:/ }).click();
  await expect(page.locator('.pg-catalog-item[aria-pressed=true]')).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  if (width <= 1000) await page.getByRole('button', { name: /^Explorer:/ }).click();
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});
