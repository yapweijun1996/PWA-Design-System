import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1440, 1920]) test(`workspace panels, canvas and configuration remain usable at ${width}px`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 }); await page.goto('./#components');
  const explorer = page.locator('.pg-catalog'), preview = page.locator('.pg-stage'), inspector = page.locator('.pg-settings');
  const choose = page.getByRole('button', { name: 'Explorer', exact: true });
  if (width > 1000) {
    const boxes = await Promise.all([explorer, preview, inspector].map(node => node.boundingBox()));
    const [a, b, c] = boxes; if (!a || !b || !c) throw new Error('Missing workspace columns');
    expect(a.x + a.width).toBeLessThanOrEqual(b.x); expect(b.x + b.width).toBeLessThanOrEqual(c.x); expect(Math.abs(a.y - c.y)).toBeLessThan(2);
  } else {
    await expect(explorer).toBeHidden(); await choose.click(); await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeFocused();
    if (width < 700) { await expect(preview).toBeHidden(); await expect(inspector).toBeHidden(); } else { await expect(preview).toBeVisible(); await expect(inspector).toBeVisible(); }
  }
  await page.getByLabel('Component category', { exact: true }).selectOption('Forms'); await expect(explorer.locator('.pg-catalog-item')).toHaveCount(7);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('absent'); await expect(page.getByText('No matching components.', { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search components' }).fill(''); await page.getByLabel('Component category', { exact: true }).selectOption('All');
  await explorer.getByRole('button', { name: 'Button', exact: true }).click();
  if (width < 700) { await expect(choose).toHaveAttribute('aria-expanded', 'false'); await expect(preview).toBeVisible(); await expect(inspector).toBeHidden(); await page.getByRole('button', { name: 'Properties', exact: true }).click(); }
  await page.getByLabel('Variant', { exact: true }).selectOption('secondary'); await expect(page.getByLabel('Variant', { exact: true })).toHaveCount(1); await expect(page.locator('.pg-options')).toHaveCount(0);
  await expect(page.locator('.pg-preview .ds-button')).toHaveAttribute('data-variant', 'secondary'); await expect(page.locator('pre code')).toContainText('"variant": "secondary"');
  if (width < 700) await page.getByRole('button', { name: 'Canvas', exact: true }).click();
  for (const target of ['390', '768', '1440']) { await page.getByLabel('Preview width', { exact: true }).selectOption(target); await expect.poll(() => page.locator('.pg-preview').evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(Number(target)); }
  await expect(page.getByRole('status', { name: 'Preview canvas width' })).toHaveText('1440px canvas'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Preview width', { exact: true }).selectOption('fit');
  await page.getByRole('tab', { name: 'Preview', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Code', exact: true })).toBeFocused(); await expect(page.getByRole('button', { name: 'Copy code', exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Usage', exact: true })).toBeFocused(); await expect(page.locator('.pg-usage')).toBeVisible();
  await page.keyboard.press('End'); await expect(page.getByRole('tab', { name: 'Accessibility', exact: true })).toBeFocused(); await expect(page.getByRole('heading', { name: 'Keyboard and accessibility' })).toBeVisible();
  await page.keyboard.press('Home'); await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toBeFocused();
  if (width < 700) await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page.getByLabel('Label or message').fill('Publish'); await expect(page.locator('pre code')).toContainText('Publish'); await expect(inspector.locator('pre')).toHaveCount(0);
  if (width < 700) await page.getByRole('button', { name: 'Canvas', exact: true }).click();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } }));
  await page.getByRole('button', { name: 'Copy code', exact: true }).click(); await expect(page.locator('.pg-copy-status')).toHaveText('Code copied.');
  if (width < 700) await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page.getByRole('button', { name: 'Reset properties', exact: true }).click(); await expect(page.getByRole('button', { name: 'Reset properties', exact: true })).toBeFocused(); await expect(page.locator('.pg-preview button')).toHaveText('Save');
  if (width < 700) await page.getByRole('button', { name: 'Canvas', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Code', exact: true })).toHaveAttribute('aria-selected', 'true'); await page.getByRole('tab', { name: 'Preview', exact: true }).click(); await expect(page.locator('.pg-preview button')).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]); expect(errors).toEqual([]);
});

test('mobile properties and catalog focus survive breakpoint changes without discarding configuration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#components');
  await page.getByRole('button', { name: 'Properties', exact: true }).click(); const label = page.getByLabel('Label or message'); await label.fill('Retained');
  await page.setViewportSize({ width: 1440, height: 900 }); await expect(label).toBeFocused(); await page.setViewportSize({ width: 390, height: 844 }); await expect(label).toBeFocused(); await expect(label).toHaveValue('Retained');
  await page.getByRole('button', { name: 'Explorer', exact: true }).click(); const search = page.getByRole('searchbox', { name: 'Search components' }); await search.fill('dialog');
  await page.setViewportSize({ width: 768, height: 900 }); await expect(search).toBeFocused(); await page.setViewportSize({ width: 1440, height: 900 }); await expect(search).toBeFocused(); await page.setViewportSize({ width: 390, height: 844 }); await expect(search).toBeFocused();
  await expect(page.locator('.pg-stage')).toBeHidden(); await expect(page.locator('.pg-settings')).toBeHidden(); await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Explorer', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Properties', exact: true }).click(); await expect(label).toHaveValue('Retained');
});

test('returning to phone reveals the focused inspector despite an earlier open Explorer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#components'); await page.getByRole('button', { name: 'Explorer', exact: true }).click(); await page.setViewportSize({ width: 1440, height: 900 });
  const label = page.getByLabel('Label or message'); await label.fill('Focus must survive'); await page.setViewportSize({ width: 390, height: 844 });
  await expect(label).toBeVisible(); await expect(label).toBeFocused(); await expect(label).toHaveValue('Focus must survive'); await expect(page.locator('.pg-catalog')).toBeHidden();
});

for (const width of [390, 768, 1440]) test(`dark selected controls and information panels pass axe at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await page.goto('./#components'); await page.locator('#theme-select').selectOption('dark');
  if (width <= 1000) await page.getByRole('button', { name: 'Explorer', exact: true }).click();
  await expect(page.locator('.pg-catalog-item[aria-pressed=true]')).toBeVisible(); expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  if (width <= 1000) { await page.getByRole('searchbox', { name: 'Search components' }).press('Escape'); }
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute('aria-selected', 'true'); expect((await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});

test('pane resizing retains configuration and the Code and Usage tabs have distinct responsibilities', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('./#components');
  await page.getByLabel('Label or message').fill('Keep this label');
  const explorer = page.getByRole('separator', { name: 'Resize Explorer', exact: true }); await explorer.focus(); await page.keyboard.press('End'); await expect(explorer).toHaveAttribute('aria-valuenow', '260');
  const inspector = page.getByRole('separator', { name: 'Resize Properties', exact: true }); await inspector.focus(); await page.keyboard.press('End'); await expect(inspector).toHaveAttribute('aria-valuenow', '320');
  const grip = await inspector.boundingBox(); if (!grip) throw new Error('Missing resize handle'); await page.mouse.move(grip.x + grip.width / 2, grip.y + 20); await page.mouse.down(); await page.mouse.move(grip.x + grip.width / 2 + 60, grip.y + 20); await page.mouse.up(); await expect(inspector).toHaveAttribute('aria-valuenow', '280');
  await expect(page.getByLabel('Label or message')).toHaveValue('Keep this label'); await expect(page.locator('.pg-settings pre')).toHaveCount(0); await expect(page.locator('.pg-options')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Code', exact: true }).click(); await expect(page.getByRole('button', { name: 'Copy code', exact: true })).toBeVisible(); await expect(page.locator('pre code')).toContainText('Keep this label');
  await page.getByLabel('Variant', { exact: true }).selectOption('secondary'); await expect(page.locator('pre code')).toContainText('"variant": "secondary"'); await expect(page.getByRole('tab', { name: 'Code', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'Button examples' })).toBeHidden(); await page.getByRole('tab', { name: 'Usage', exact: true }).click(); await expect(page.getByRole('region', { name: 'Button examples' })).toBeVisible(); await page.getByRole('region', { name: 'Button examples' }).getByRole('button', { name: 'Create', exact: true }).click(); await expect(page.getByLabel('Label or message')).toHaveValue('Keep this label');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click(); await expect(page.locator('.pg-preview button')).toHaveText('Keep this label'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
