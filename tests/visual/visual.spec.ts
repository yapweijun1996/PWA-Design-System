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
async function snapshot(page: Page, name: string): Promise<void> {
  if (smoke) { await expect(page.locator('main')).toBeVisible(); return; }
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
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
      await detail.getByLabel('State').selectOption('disabled');
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
