import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('./#ai-agent-rules');
  await expect(page.getByRole('heading', { name: 'AI Agent Rules', level: 1 })).toBeVisible();
});
test('exports five validated artifacts and round-trips the contract', async ({ page }) => {
  const names = ['design-system.json', 'tokens.css', 'AGENTS.md', 'COMPONENT-API.md', 'INTEGRATION.md'];
  const artifacts = new Map<string, string>();
  for (const name of names) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: `Export ${name}` }).click();
    const download = await pending; expect(download.suggestedFilename()).toBe(name); const path = await download.path(); if (!path) throw new Error('Download path missing');
    artifacts.set(name, await readFile(path, 'utf8'));
  }
  const exported = artifacts.get('design-system.json'); if (!exported) throw new Error('Contract missing');
  const parsed = JSON.parse(exported); expect(parsed.components).toHaveLength(20); expect(parsed.rules).toHaveLength(10);
  expect(artifacts.get('tokens.css')).toContain('--ds-color-surface:'); expect(artifacts.get('AGENTS.md')).toContain('Reuse approved core components');
  expect(artifacts.get('COMPONENT-API.md')).toContain('## button'); expect(artifacts.get('INTEGRATION.md')).toContain('private');
  await page.getByLabel('Contract file').setInputFiles({ name: 'design-system.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await expect(page.locator('.agent-status').last()).toContainText('matches the current registry');
});
test('rejects malicious, stale and oversized contract files without executing them', async ({ page }) => {
  const file = page.getByLabel('Contract file');
  await file.setInputFiles({ name: 'danger.json', mimeType: 'application/json', buffer: Buffer.from('{"__proto__":{"polluted":true}}') });
  await expect(page.locator('.agent-status').last()).toContainText('Verification failed');
  expect(await page.evaluate(() => Object.hasOwn(Object.prototype, 'polluted'))).toBe(false);
  const current = JSON.parse(await readFile('packages/agent-contract/design-system.json', 'utf8')); current.components[0].factory = 'createWrong';
  await file.setInputFiles({ name: 'stale.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(current)) });
  await expect(page.locator('.agent-status').last()).toContainText('does not match the current component registry');
  await file.setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(131073, 32) });
  await expect(page.locator('.agent-status').last()).toContainText('exceeds 128 KiB');
});
test('agent page is keyboard accessible and fits mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('Third-party license notice').click();
  await expect(page.getByText('Copyright (c) 2015-2021 Evgeny Poberezkin')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const button = page.getByRole('button', { name: 'Export AGENTS.md' }); await button.focus(); await expect(button).toBeFocused();
  const results = await new AxeBuilder({ page }).include('.agent-page').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(); expect(results.violations).toEqual([]);
});
