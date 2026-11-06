import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { visualEnvironment } from './environment.mjs';

const smoke = process.env.VISUAL_SMOKE === '1';
const capture = process.env.VISUAL_CAPTURE === '1';
test.beforeAll(async () => {
  if (smoke) return;
  if (process.argv.includes('--update-snapshots') && !capture) throw new Error('Baseline updates require VISUAL_CAPTURE=1 and manual review.');
  const actual = await visualEnvironment();
  if (!capture) {
    const baseline = JSON.parse(await readFile(new URL('./baselines/environment.json', import.meta.url), 'utf8'));
    expect(actual, 'Visual environment differs from the reviewed baseline; recapture and review.').toEqual(baseline);
  }
});

async function open(page: Page, route: string, theme: string, density: string): Promise<void> {
  await page.addInitScript(({ theme, density }) => { localStorage.setItem('pwa-ds-theme', theme); localStorage.setItem('pwa-ds-density', density); }, { theme, density });
  await page.goto(`./#${route}`);
  await page.evaluate(() => document.fonts.ready);
}
async function snapshot(page: Page, name: string, fullPage = true): Promise<void> {
  if (smoke) { await expect(page.locator('main')).toBeVisible(); return; }
  if (!fullPage) await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage });
}

for (const scenario of [
  { name: 'theme-mobile-light-comfortable', width: 390, height: 844, theme: 'light', density: 'comfortable' },
  { name: 'theme-tablet-dark-compact', width: 768, height: 900, theme: 'dark', density: 'compact' },
  { name: 'theme-desktop-light-compact', width: 1440, height: 900, theme: 'light', density: 'compact' }
]) {
  test(scenario.name, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await open(page, 'theme-builder', scenario.theme, scenario.density);
    await expect(page.getByRole('heading', { name: 'Theme Builder' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await snapshot(page, scenario.name);
  });
}

for (const scenario of [
  { name: 'button-disabled-light', component: 'Button', theme: 'light', density: 'comfortable' },
  { name: 'menu-open-dark', component: 'Menu', theme: 'dark', density: 'compact' },
  { name: 'dialog-open-light', component: 'Dialog', theme: 'light', density: 'comfortable' }
]) {
  test(scenario.name, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, 'components', scenario.theme, scenario.density);
    const catalog = page.getByRole('region', { name: 'Component catalog' });
    await catalog.getByRole('button', { name: scenario.component, exact: true }).click();
    const detail = page.getByRole('region', { name: 'Component playground' });
    if (scenario.component === 'Button') {
      await detail.getByLabel('State', { exact: true }).selectOption('disabled');
      await expect(detail.locator('.pg-preview button')).toBeDisabled();
    } else if (scenario.component === 'Menu') {
      await detail.locator('.pg-preview').getByRole('button', { name: 'Actions' }).click();
      await expect(page.getByRole('menu')).toBeVisible();
    } else {
      await detail.locator('.pg-preview').getByRole('button', { name: 'Open dialog' }).click();
      await expect(page.getByRole('dialog', { name: 'Example dialog' })).toBeVisible();
    }
    await snapshot(page, scenario.name);
  });
}

for (const scenario of [
  { name: 'token-editor-desktop-light', width: 1440, height: 900, theme: 'light', density: 'comfortable', view: 'editor' },
  { name: 'token-editor-tablet-dark', width: 768, height: 900, theme: 'dark', density: 'compact', view: 'editor' },
  { name: 'token-editor-mobile-light', width: 390, height: 844, theme: 'light', density: 'comfortable', view: 'editor' },
  { name: 'token-editor-mobile-preview', width: 390, height: 844, theme: 'light', density: 'comfortable', view: 'preview' },
  { name: 'token-editor-desktop-draft', width: 1440, height: 900, theme: 'light', density: 'comfortable', view: 'draft' },
  { name: 'token-editor-narrow-light', width: 320, height: 844, theme: 'light', density: 'comfortable', view: 'editor' }
]) {
  test(scenario.name, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await open(page, 'design-tokens', scenario.theme, scenario.density);
    await expect(page.getByRole('heading', { name: 'Design tokens', level: 1 })).toBeVisible();
    const editor = page.locator('.token-editor');
    if (scenario.view === 'preview') {
      await editor.getByRole('button', { name: /^preview$/i }).click();
      await expect(page.getByLabel('Token preview')).toBeVisible();
    } else if (scenario.view === 'draft') {
      await page.getByLabel('color.surface override').fill('#fafafa');
      await editor.getByLabel(/search tokens/i).fill('color.surface');
      await expect(page.getByLabel('color.surface override')).toHaveValue('#fafafa');
      await editor.getByText(/review changes\s*\(1\)/i).click();
    } else {
      await expect(page.getByLabel('color.surface override')).toBeVisible();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await snapshot(page, scenario.name, false);
  });
}

for (const scenario of [
  { name: 'components-desktop-light', width: 1440, height: 900, theme: 'light', density: 'comfortable', picker: false },
  { name: 'components-tablet-dark', width: 768, height: 1024, theme: 'dark', density: 'compact', picker: false },
  { name: 'components-mobile-picker-closed', width: 390, height: 844, theme: 'light', density: 'comfortable', picker: false },
  { name: 'components-mobile-picker-open', width: 390, height: 844, theme: 'light', density: 'comfortable', picker: true }
]) {
  test(scenario.name, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await open(page, 'components', scenario.theme, scenario.density);
    await expect(page.getByRole('heading', { name: 'Button', level: 2, exact: true })).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Explorer: Button', exact: true });
    if (scenario.picker) {
      await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('searchbox', { name: 'Search components' })).toBeFocused();
    } else if (scenario.width <= 768) await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await snapshot(page, scenario.name, false);
  });
}

test('components-mobile-properties', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'components', 'light', 'comfortable');
  await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Preview properties' })).toBeVisible();
  await expect(page.getByLabel('Label or message')).toHaveValue('Save');
  await expect(page.locator('.pg-stage')).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await snapshot(page, 'components-mobile-properties', false);
});
