import { expect, test } from '@playwright/test';

test('pane drag, keyboard and non-drag controls resize actual columns and survive route remount', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('./#components');
  const workspace = page.locator('.ws-workspace'), explorer = page.locator('.ws-explorer'), inspector = page.locator('.ws-inspector');
  await expect(workspace).toHaveAttribute('data-mode', 'wide');
  const left = page.getByRole('separator', { name: 'Resize Explorer', exact: true }), right = page.getByRole('separator', { name: 'Resize Properties', exact: true });
  await left.focus(); await page.keyboard.press('Home'); await expect.poll(() => explorer.evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(220);
  await page.keyboard.press('End'); await expect.poll(() => explorer.evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(260);
  await right.focus(); await page.keyboard.press('Home'); const box = await right.boundingBox(); if (!box) throw new Error('Missing right splitter');
  await page.mouse.move(box.x + box.width / 2, box.y + 20); await page.mouse.down(); await page.mouse.move(box.x - 30, box.y + 20); await page.mouse.up(); await expect.poll(() => inspector.evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(316);
  await workspace.getByText('Pane sizes', { exact: true }).click(); await page.getByLabel('Explorer width', { exact: true }).fill('230');
  const pendingBox = await left.boundingBox(); if (!pendingBox) throw new Error('Missing pending-edit splitter'); await page.mouse.move(pendingBox.x + pendingBox.width / 2, pendingBox.y + 20); await page.mouse.down(); await page.mouse.move(pendingBox.x + pendingBox.width / 2 + 2, pendingBox.y + 20); await page.mouse.up(); await expect.poll(() => explorer.evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(232);
  await page.getByLabel('Explorer width', { exact: true }).fill('230'); await page.getByLabel('Explorer width', { exact: true }).press('Tab'); await expect.poll(() => explorer.evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(230);
  await page.getByRole('button', { name: 'Increase Explorer width', exact: true }).click(); await expect.poll(() => explorer.evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(238); await expect(left).toHaveAttribute('aria-valuenow', '238');
  await page.locator('.pg-catalog').getByRole('button', { name: 'Badge', exact: true }).click(); await expect(workspace.getByText('Pane sizes', { exact: true })).toBeVisible();
  await page.evaluate(() => location.hash = 'overview'); await expect(page.getByRole('heading', { name: 'A shared foundation for better interfaces.', exact: true })).toBeVisible(); await page.evaluate(() => location.hash = 'components'); await expect(page.locator('.ws-workspace')).toHaveAttribute('data-mode', 'wide'); await expect.poll(() => page.locator('.ws-explorer').evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(238);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('resizing away from a focused layout control reveals a usable panel and cancels active pointer capture', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('./#components'); await page.getByText('Pane sizes', { exact: true }).click(); await page.getByLabel('Explorer width', { exact: true }).focus();
  await page.setViewportSize({ width: 390, height: 844 }); await expect(page.locator('.ws-workspace')).toHaveAttribute('data-mode', 'phone');
  expect(await page.evaluate(() => { const active = document.activeElement; return active instanceof HTMLElement && active !== document.body && !active.closest('[hidden]'); })).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 }); const left = page.getByRole('separator', { name: 'Resize Explorer', exact: true }); const box = await left.boundingBox(); if (!box) throw new Error('Missing left splitter');
  await page.mouse.move(box.x + box.width / 2, box.y + 20); await page.mouse.down(); await expect(page.locator('.ws-workspace')).toHaveAttribute('data-resizing', 'true'); await page.setViewportSize({ width: 390, height: 844 }); await expect(page.locator('.ws-workspace')).not.toHaveAttribute('data-resizing', 'true'); await page.mouse.up();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
