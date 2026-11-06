import { expect, test } from '@playwright/test';
import { tokenCanvas, tokenField } from './token-workspace-helpers';

test('compact mobile table opens a single Inspector with explicit values and accessible color controls', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.goto('./#design-tokens');
  await expect(page.locator('[data-select-token]')).toHaveCount(48);
  const input = await tokenField(page, 'color.background'), inspector = page.locator('.token-editor__field');
  await expect(page.locator('input[data-token]')).toHaveCount(1);
  const rect = await input.boundingBox(); expect(rect).toBeTruthy(); expect((rect?.y ?? 999) + (rect?.height ?? 999)).toBeLessThan(844);
  const actions = await page.locator('.token-editor__toolbar .token-editor__actions > button').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { width: rect.width, height: rect.height }; }));
  expect(actions).toHaveLength(3); for (const action of actions) { expect(action.width).toBeGreaterThanOrEqual(44); expect(action.height).toBeGreaterThanOrEqual(44); }
  await expect(inspector.getByText('Default', { exact: true })).toBeVisible(); await expect(inspector.getByText('Resolved', { exact: true })).toBeVisible();
  await expect(inspector.getByLabel('Token dependency chain')).toContainText('primitive.color.slate.50');
  const detail = inspector.locator('.token-editor__source-detail'); await expect(detail.getByText(/Declared semantic source:/)).toBeHidden(); await detail.getByText('Purpose, source & references', { exact: true }).click(); await expect(detail.getByText(/Declared semantic source:/)).toBeVisible();
  const ids = (await input.getAttribute('aria-describedby'))?.split(' ') ?? []; expect(ids.length).toBeGreaterThan(2); expect(await input.evaluate((_, ids) => ids.every(id => document.getElementById(id)), ids)).toBe(true);
  await expect(input).toHaveAccessibleDescription(/Empty override = inherited value.*Page canvas behind surfaces/);
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page); const tree = await cdp.send('Accessibility.getFullAXTree'); const textbox = tree.nodes.find(node => node.role?.value === 'textbox' && node.name?.value === 'color.background override'); expect(textbox?.description?.value).toContain('Empty override = inherited value'); expect(textbox?.description?.value).toContain('Page canvas behind surfaces.'); await cdp.detach();
  }
  await expect(inspector.getByText('Choose new color', { exact: true })).toBeVisible(); await expect(inspector.locator('input[type="color"]')).toHaveAccessibleName(/^Choose new color for color\.background$/);
  await expect(inspector.locator('.token-editor__swatch')).toHaveCount(1); await input.fill('{primitive.color.white}'); await expect(input).toHaveValue('{primitive.color.white}'); await expect(inspector.locator('.token-editor__swatch')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByLabel('Choose new color for color.background', { exact: true }).fill('#fafafa'); await expect(input).toHaveValue('#fafafa'); expect(await page.evaluate(() => localStorage.getItem('pwa-ds-token-overrides-v1'))).toBeNull(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reference browsing follows canvas theme and a chain link selects another token without losing drafts', async ({ page }) => {
  await page.goto('./#design-tokens'); await page.getByLabel('Editing scope').selectOption('global'); await (await tokenField(page, 'color.link')).fill('{semantic.color.primary}');
  await page.getByLabel('Editing scope').selectOption('light'); await (await tokenField(page, 'color.focus')).fill('{semantic.color.link}');
  await tokenCanvas(page); await page.getByLabel('Search tokens').fill('color.primary'); await (await tokenField(page, 'color.primary')).focus(); const detail = page.locator('.token-editor__source-detail'); await detail.getByText('Purpose, source & references', { exact: true }).click();
  await expect(detail).toContainText('Direct dependents: semantic.color.link. Indirect dependents: semantic.color.focus.'); await page.getByLabel('Canvas theme').selectOption('dark'); await expect(detail).toContainText('Reference chain (dark/blue/comfortable/default)'); await expect(detail).toContainText('Indirect dependents: None.');
  await tokenCanvas(page); await page.getByLabel('Search tokens').fill('color.link'); const link = await tokenField(page, 'color.link'); await expect(link).toHaveValue(''); await page.getByLabel('Editing scope').selectOption('global'); await expect(link).toHaveValue('{semantic.color.primary}');
  await page.getByRole('region', { name: 'Token dependency chain', exact: true }).getByRole('button', { name: 'semantic.color.primary', exact: true }).click(); await expect(page.getByLabel('color.primary override', { exact: true })).toBeFocused(); await expect(page.getByLabel('Unsaved change count')).toHaveText('2 unsaved changes');
});

test('invalid circular aliases remain diagnosable in selected-token references and cannot be saved', async ({ page }) => {
  await page.goto('./#design-tokens'); await page.getByLabel('Editing scope').selectOption('global'); await (await tokenField(page, 'color.link')).fill('{semantic.color.primary}'); await (await tokenField(page, 'color.primary')).fill('{semantic.color.link}');
  const detail = page.locator('.token-editor__source-detail'); await detail.getByText('Purpose, source & references', { exact: true }).click(); await expect(detail).toContainText('Circular reference: semantic.color.primary'); await expect(page.getByRole('status', { name: 'Draft validation' })).toContainText('Circular alias'); await expect(page.getByRole('button', { name: 'Commit changes' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel draft' }).click(); await expect(detail).not.toContainText('Circular reference:'); await expect(page.getByRole('button', { name: 'Commit changes' })).toBeEnabled();
});
