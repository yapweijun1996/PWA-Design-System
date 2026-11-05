import { expect, test } from '@playwright/test';

test('compact mobile rows retain explicit values, descriptions and a distinct color picker', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.goto('./#design-tokens');
  const row = page.locator('[data-token-row="color.background"]'), input = page.getByLabel('color.background override', { exact: true });
  await expect(input).toBeVisible(); const rect = await input.boundingBox(); expect(rect).toBeTruthy(); expect((rect?.y ?? 999) + (rect?.height ?? 999)).toBeLessThan(844);
  await expect(row.getByText('Default', { exact: true })).toBeVisible(); await expect(row.getByText('Resolved', { exact: true })).toBeVisible();
  await expect(row.locator('.token-editor__source-detail').getByText('Page canvas behind surfaces.')).toBeHidden();
  await row.getByText('Purpose, source & references', { exact: true }).click(); await expect(row.locator('.token-editor__source-detail').getByText('Page canvas behind surfaces.')).toBeVisible();
  const ids = (await input.getAttribute('aria-describedby'))?.split(' ') ?? []; expect(ids.length).toBeGreaterThan(2);
  expect(await input.evaluate((_, ids) => ids.every(id => document.getElementById(id)), ids)).toBe(true);
  await row.getByText('Purpose, source & references', { exact: true }).click();
  await expect(input).toHaveAccessibleDescription(/Empty override = inherited value.*Page canvas behind surfaces/);
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page); const tree = await cdp.send('Accessibility.getFullAXTree');
    const textbox = tree.nodes.find(node => node.role?.value === 'textbox' && node.name?.value === 'color.background override');
    expect(textbox?.description?.value).toContain('Empty override = inherited value'); expect(textbox?.description?.value).toContain('Page canvas behind surfaces.'); await cdp.detach();
  }
  await expect(row.getByText('Choose new color', { exact: true })).toBeVisible();
  await expect(row.locator('input[type="color"]')).toHaveAccessibleName(/^Choose new color for color\.background$/);
  const swatch = row.locator('.token-editor__swatch'); await expect(swatch).toHaveCount(1); expect(await swatch.evaluate(node => node.parentElement?.textContent)).toBe('Resolved');
  await input.fill('{primitive.color.white}'); await expect(input).toHaveValue('{primitive.color.white}');
  await expect(row.locator('.token-editor__swatch')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByLabel('Choose new color for color.background', { exact: true }).fill('#fafafa'); await expect(input).toHaveValue('#fafafa');
  expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reference browsing follows the preview theme and retains aliases through disclosure use', async ({ page }) => {
  await page.goto('./#design-tokens'); await page.getByLabel('Editing scope').selectOption('global');
  await page.getByLabel('color.link override', { exact: true }).fill('{semantic.color.primary}');
  await page.getByLabel('Editing scope').selectOption('light'); await page.getByLabel('color.focus override', { exact: true }).fill('{semantic.color.link}');
  await page.getByLabel('Search tokens').fill('color.primary'); const row = page.locator('[data-token-row="color.primary"]');
  await row.getByText('Purpose, source & references', { exact: true }).click();
  await expect(row.locator('.token-editor__source-detail')).toContainText('Direct dependents: semantic.color.link. Indirect dependents: semantic.color.focus.');
  await page.getByLabel('Preview theme').selectOption('dark'); await expect(row.locator('.token-editor__source-detail')).toContainText('Reference chain (dark/blue/comfortable/default)'); await expect(row.locator('.token-editor__source-detail')).toContainText('Indirect dependents: None.');
  await page.getByLabel('Search tokens').fill('color.link'); await expect(page.getByLabel('color.link override', { exact: true })).toHaveValue('');
  await page.getByLabel('Editing scope').selectOption('global'); await expect(page.getByLabel('color.link override', { exact: true })).toHaveValue('{semantic.color.primary}');
});

test('invalid circular aliases remain diagnosable in reference details and cannot be saved', async ({ page }) => {
  await page.goto('./#design-tokens'); await page.getByLabel('Editing scope').selectOption('global');
  await page.getByLabel('color.link override', { exact: true }).fill('{semantic.color.primary}'); await page.getByLabel('color.primary override', { exact: true }).fill('{semantic.color.link}');
  await page.getByLabel('Search tokens').fill('color.primary'); const row = page.locator('[data-token-row="color.primary"]'); await row.getByText('Purpose, source & references', { exact: true }).click();
  await expect(row.locator('.token-editor__source-detail')).toContainText('Circular reference: semantic.color.primary');
  await expect(page.getByRole('status', { name: 'Draft validation' })).toContainText('Circular alias'); await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel draft' }).click(); await expect(row.locator('.token-editor__source-detail')).not.toContainText('Circular reference:'); await expect(page.getByRole('button', { name: 'Commit changes' })).toBeEnabled();
});
