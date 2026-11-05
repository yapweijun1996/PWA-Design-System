import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('./#components');
  await expect(page.getByRole('heading', { name: 'Components', level: 1 })).toBeVisible();
});
test('catalog searches all families, keyboard selects and route teardown removes preview', async ({ page }) => {
  const catalog = page.getByRole('region', { name: 'Component catalog' });
  await expect(catalog.locator('.pg-catalog-item')).toHaveCount(21);
  const search = page.getByRole('searchbox', { name: 'Search components' }); await search.fill('tooltip');
  await expect(catalog.locator('.pg-catalog-item')).toHaveCount(1);
  const tooltip = catalog.getByRole('button', { name: 'Tooltip' }); await tooltip.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Tooltip', level: 2 })).toBeVisible();
  await page.locator('.pg-preview').getByRole('button', { name: 'More information' }).focus(); await expect(page.getByRole('tooltip')).toBeVisible();
  await page.getByRole('link', { name: /Overview/ }).first().click(); await expect(page.locator('.pg-page')).toHaveCount(0); await expect(page.getByRole('tooltip')).toHaveCount(0);
});
test('supported options and escaped labels update preview and code together', async ({ page }) => {
  const detail = page.getByRole('region', { name: 'Component playground' });
  await detail.getByLabel('Variant').selectOption('secondary');
  const input = detail.getByLabel('Label or message'); const hostile = '<img src=x onerror=alert(1)>'; await input.fill(hostile);
  const preview = detail.locator('.pg-preview'); const button = preview.getByRole('button', { name: hostile });
  await expect(button).toHaveAttribute('data-variant', 'secondary'); await expect(preview.locator('img')).toHaveCount(0);
  const code = detail.locator('pre code'); await expect(code).toContainText('"variant": "secondary"'); await expect(code).toContainText(JSON.stringify(hostile));
  const previous = await code.textContent(); await input.fill(' '); await expect(input).toHaveAttribute('aria-invalid', 'true'); await expect(code).toHaveText(previous ?? ''); await expect(button).toBeVisible();
});
test('copy permission failure gives usable feedback', async ({ page }) => {
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  const detail = page.getByRole('region', { name: 'Component playground' }); await detail.getByRole('button', { name: 'Copy code' }).click(); await expect(detail.locator('.pg-copy-status')).toContainText('Copy failed');
});
test('API reference and supported scalar and list controls match their previews', async ({ page }) => {
  const catalog = page.getByRole('region', { name: 'Component catalog' }); const detail = page.getByRole('region', { name: 'Component playground' });
  await catalog.getByRole('button', { name: 'Input', exact: true }).click(); await detail.getByText('Component API and defaults').click();
  await expect(detail.locator('dl')).toContainText('placeholder'); await expect(detail.locator('dl')).toContainText('not editable');
  await detail.getByLabel('Input type').selectOption('email'); await detail.getByLabel('Initial value').fill('sample@example.test');
  await expect(detail.locator('.pg-preview input')).toHaveAttribute('type', 'email'); await expect(detail.locator('.pg-preview input')).toHaveValue('sample@example.test');
  await expect(detail.locator('pre code')).toContainText('"value": "sample@example.test"');
  await catalog.getByRole('button', { name: 'Select', exact: true }).click();
  await detail.getByLabel('Options (value | label, one per line)').fill('a | Alpha\nb | Beta | disabled');
  await expect(detail.locator('.pg-preview option')).toHaveCount(2); await expect(detail.locator('.pg-preview option').nth(1)).toBeDisabled(); await expect(detail.locator('pre code')).toContainText('"label": "Alpha"');
});
test('menu editor changes real item labels and disabled states, rejecting invalid input', async ({ page }) => {
  const catalog = page.getByRole('region', { name: 'Component catalog' }); const detail = page.getByRole('region', { name: 'Component playground' });
  await catalog.getByRole('button', { name: 'Menu', exact: true }).click(); const items = detail.getByLabel('Items (label per line, optional | disabled)');
  await items.fill('Archive\nReview'); await expect(detail.locator('.pg-preview [role=menuitem]').first()).toHaveText('Archive'); await expect(detail.locator('pre code')).toContainText('"label":"Archive"');
  await items.fill('Archive\nReview | disabled'); await expect(detail.locator('.pg-preview [role=menuitem]').nth(1)).toHaveAttribute('aria-disabled', 'true'); await expect(detail.locator('pre code')).toContainText('"disabled":true');
  const before = await detail.locator('pre code').textContent(); await items.fill('Archive | unexpected'); await expect(detail.locator('#pg-error')).toContainText('Invalid Items');
  await expect(detail.locator('pre code')).toHaveText(before ?? ''); await expect(detail.locator('.pg-preview [role=menuitem]').nth(1)).toHaveAttribute('aria-disabled', 'true');
});
test('invalid extra stays in a form-level summary and assertive alert updates after mount', async ({ page }) => {
  const catalog = page.getByRole('region', { name: 'Component catalog' }); const detail = page.getByRole('region', { name: 'Component playground' });
  await catalog.getByRole('button', { name: 'Textarea', exact: true }).click(); const rows = detail.getByLabel('Rows'); const label = detail.getByLabel('Label or message'); const code = detail.locator('pre code');
  const before = await code.textContent(); await rows.fill('0'); await expect(detail.locator('#pg-error')).toContainText('Rows'); await expect(label).not.toHaveAttribute('aria-invalid', 'true');
  const placeholder = detail.getByLabel('Placeholder'); await placeholder.fill('Valid'); await expect(placeholder).not.toHaveAttribute('aria-invalid', 'true'); await expect(detail.locator('#pg-error')).toContainText('Rows'); await expect(code).toHaveText(before ?? '');
  await catalog.getByRole('button', { name: 'Alert', exact: true }).click(); await detail.getByLabel('Assertive').selectOption('true'); await expect(detail.locator('.pg-preview [role=alert]')).toHaveText('Review your settings.');
  const snippet = await detail.locator('pre code').textContent() ?? ''; expect(snippet.indexOf('document.body.append')).toBeLessThan(snippet.indexOf('component.setMessage'));
});
test('preview theme is isolated and inherited by a top-layer tooltip', async ({ page }) => {
  const detail = page.getByRole('region', { name: 'Component playground' });
  const select = detail.getByLabel('Preview theme'); const preview = detail.locator('.pg-preview'); const code = detail.locator('pre code');
  const rootTheme = await page.locator('html').getAttribute('data-theme'); const originalCode = await code.textContent();
  await select.selectOption('dark'); const dark = await preview.evaluate(node => getComputedStyle(node).backgroundColor);
  expect(await page.locator('html').getAttribute('data-theme')).toBe(rootTheme); await expect(code).toHaveText(originalCode ?? '');
  await select.selectOption('light'); const light = await preview.evaluate(node => getComputedStyle(node).backgroundColor); expect(light).not.toBe(dark);
  await select.selectOption('studio'); await expect(preview).toHaveAttribute('data-preview-theme', 'studio');
  await page.getByRole('button', { name: 'Tooltip', exact: true }).click(); await detail.getByLabel('Preview theme').selectOption('dark');
  await detail.locator('.pg-preview').getByRole('button', { name: 'More information' }).focus();
  const tip = page.getByRole('tooltip'); await expect(tip).toBeVisible();
  const colors = await detail.locator('.pg-preview').evaluate(node => ({ preview: getComputedStyle(node).getPropertyValue('--ds-color-surface').trim(), tip: getComputedStyle(node.querySelector('[role=tooltip]') as Element).getPropertyValue('--ds-color-surface').trim() }));
  expect(colors.tip).toBe(colors.preview);
});
test('playground is accessible to automated checks and fits a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).include('.pg-page').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(); expect(results.violations).toEqual([]);
});
test('mobile catalog scroll is discoverable and preview is visible near the top', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#components');
  const preview = page.locator('.pg-preview'); await expect(preview).toBeVisible(); const box = await preview.boundingBox();
  expect(box).not.toBeNull(); if (!box) throw new Error('Preview has no bounds'); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(844);
  const list = page.getByRole('region', { name: 'Scrollable component list' }); await expect(list).toHaveAttribute('tabindex', '0'); await expect(page.getByText('Scroll the list to see more components, or use search to filter.')).toBeVisible();
  const end = await list.evaluate(node => node.scrollHeight - node.clientHeight);
  await list.focus(); await page.keyboard.press('End'); await expect.poll(() => list.evaluate(node => node.scrollTop)).toBe(end); await page.keyboard.press('Home'); await expect.poll(() => list.evaluate(node => node.scrollTop)).toBe(0);
  const scroll = await list.evaluate(node => { const max = node.scrollHeight - node.clientHeight; node.scrollTop = 0; const top = node.scrollTop; node.scrollTop = max / 2; const middle = node.scrollTop; node.scrollTop = max; return { top, middle, bottom: node.scrollTop, max }; });
  expect(scroll.top).toBe(0); expect(scroll.middle).toBeGreaterThan(0); expect(scroll.bottom).toBeGreaterThan(scroll.middle); expect(scroll.bottom).toBeCloseTo(scroll.max, 0);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('menu'); const menu = list.getByRole('button', { name: 'Menu', exact: true }); await menu.focus(); await page.keyboard.press('Enter');
  await preview.getByRole('button', { name: 'Actions' }).click(); await expect(preview.getByRole('menu')).toBeVisible(); await page.keyboard.press('Escape'); await expect(preview.getByRole('button', { name: 'Actions' })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
test('desktop preview appears before detailed controls and input heights align', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 }); await page.goto('./#components');
  const preview = page.locator('.pg-preview'); await expect(preview).toBeVisible(); const box = await preview.boundingBox(); if (!box) throw new Error('Preview has no bounds'); expect(box.y + box.height).toBeLessThanOrEqual(720);
  const heights = await page.locator('.pg-controls').evaluate(node => [...node.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')].map(item => item.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(1); expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
});

test('Data Table preview and generated code follow the same configuration', async ({ page }) => {
  const catalog = page.getByRole('region', { name: 'Component catalog' });
  await page.getByRole('searchbox', { name: 'Search components' }).fill('data table');
  await catalog.getByRole('button', { name: 'Data Table' }).click();
  const detail = page.getByRole('region', { name: 'Component playground' });
  const preview = detail.locator('.pg-preview'); const code = detail.locator('pre code');
  await expect(preview.getByRole('table', { name: 'People' })).toBeVisible(); await expect(code).toContainText('createDataTable');
  await detail.getByLabel('Row selection').selectOption('true'); await expect(preview.getByRole('checkbox', { name: 'Select Ada' })).toBeVisible(); await expect(code).toContainText('"selectable": true');
  await detail.getByLabel('Page size').fill('1'); await expect(preview.getByText('Page 1 of 3')).toBeVisible(); await expect(code).toContainText('"pageSize": 1');
  await detail.getByLabel('State').selectOption('empty'); await expect(preview.getByText('No rows to display.')).toBeVisible(); await expect(code).toContainText('"rows": []');
  await detail.getByLabel('State').selectOption('loading'); await expect(preview.getByText('Loading rows…')).toBeVisible(); await expect(code).toContainText('"loading": true');
});
