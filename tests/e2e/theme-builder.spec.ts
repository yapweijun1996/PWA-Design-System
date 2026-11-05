import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('appearance controls synchronize, persist and keep committed overrides', async ({ page }) => {
  await page.goto('./#design-tokens');
  await page.getByLabel('color.surface override').fill('#fafafa');
  await page.getByRole('button', { name: 'Commit changes' }).click();
  await page.goto('./#theme-builder');
  const builder = page.locator('.theme-builder');
  await expect(builder.getByRole('heading', { name: 'Theme Builder' })).toBeVisible();
  await builder.getByLabel('Palette').selectOption('violet');
  await builder.getByLabel('Density').selectOption('compact');
  await builder.getByLabel('Visual kit').selectOption('enterprise');
  await builder.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
  await expect(page.locator('#theme-select')).toHaveValue('dark');
  await page.locator('#theme-select').selectOption('light');
  await expect(builder.getByRole('combobox', { name: 'Theme', exact: true })).toHaveValue('light');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim())).toBe('#fafafa');
  await page.reload();
  await expect(builder.getByLabel('Palette')).toHaveValue('violet');
  await expect(builder.getByLabel('Density')).toHaveValue('compact');
  await expect(builder.getByLabel('Visual kit')).toHaveValue('enterprise');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface').trim())).toBe('#fafafa');
});

test('all 96 combinations resolve the corresponding token values and representative contrast', async ({ page }) => {
  await page.goto('./#theme-builder');
  await expect(page.getByRole('heading', { name: 'Theme Builder' })).toBeVisible();
  const engine = `/PWA-Design-System/@fs${process.cwd()}/packages/tokens/src/engine.mjs`;
  const source = `/PWA-Design-System/@fs${process.cwd()}/apps/studio/src/features/tokens/sources.ts`;
  const result = await page.evaluate(async ({ engine, source }) => {
    const { axes, emptyProject, validateProject } = await import(/* @vite-ignore */ engine);
    const { sources } = await import(/* @vite-ignore */ source);
    const all = validateProject(sources, emptyProject()) as Record<string, Record<string, string | number>>;
    const problems: string[] = [];
    const probe = document.createElement('span'); document.body.append(probe);
    const previewButton = document.querySelector<HTMLElement>('.theme-builder__action'); if (!previewButton) throw new Error('Missing preview button');
    const luminosity = (hex: string): number => {
      const rgb = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!rgb) throw new Error(`Invalid resolved color: ${hex}`);
      const channels = rgb.slice(1).map(value => Number.parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const ratio = (a: string, b: string): number => { const x = luminosity(a), y = luminosity(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    let count = 0;
    for (const theme of axes.themes) for (const palette of axes.palettes) for (const density of axes.density) for (const kit of axes.kits) {
      const name = `${theme}/${palette}/${density}/${kit}`; const expected = all[name];
      for (const [axis, value] of Object.entries({ theme, palette, density, kit })) {
        const input = document.querySelector<HTMLSelectElement>(`[name="theme-builder-${axis}"]`); if (!input) throw new Error('Missing control');
        input.value = value; input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const style = getComputedStyle(document.documentElement);
      for (const [key, value] of Object.entries(expected)) if (style.getPropertyValue(`--ds-${key.replaceAll('.', '-')}`).trim() !== String(value)) problems.push(`${name}: ${key}`);
      probe.style.color = String(expected['color.primary']);
      if (getComputedStyle(previewButton).backgroundColor !== getComputedStyle(probe).color) problems.push(`${name}: preview primary`);
      for (const [fg, bg, minimum] of [['color.text', 'color.surface', 4.5], ['color.on-primary', 'color.primary', 4.5], ['color.focus', 'color.surface', 3], ['color.border-control', 'color.surface', 3]] as const) {
        if (ratio(String(expected[fg]), String(expected[bg])) < minimum) problems.push(`${name}: ${fg}/${bg}`);
      }
      count++;
    }
    probe.remove(); return { count, problems };
  }, { engine, source });
  expect(result.count).toBe(96); expect(result.problems).toEqual([]);
});

test('System follows the device while preserving its explicit preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./#theme-builder');
  await page.locator('.theme-builder').getByRole('combobox', { name: 'Theme', exact: true }).selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-select')).toHaveValue('system');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('tablet preview retains usable width without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('./#theme-builder');
  const preview = page.locator('.theme-builder__preview');
  await expect(preview).toBeVisible();
  const box = await preview.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('prepaint rejects corrupt settings and restores valid axes before token bootstrap', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa-ds-theme', 'dark'); localStorage.setItem('pwa-ds-palette', 'rose');
    localStorage.setItem('pwa-ds-density', 'invalid'); localStorage.setItem('pwa-ds-kit', 'minimal');
    requestAnimationFrame(() => { (window as unknown as { appearanceAtFirstFrame: string }).appearanceAtFirstFrame = JSON.stringify(document.documentElement.dataset); });
  });
  await page.route('**/src/main.ts*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.goto('./#theme-builder');
  await expect.poll(() => page.evaluate(() => (window as unknown as { appearanceAtFirstFrame?: string }).appearanceAtFirstFrame)).toBeTruthy();
  const data = JSON.parse(await page.evaluate(() => (window as unknown as { appearanceAtFirstFrame: string }).appearanceAtFirstFrame));
  expect(data).toMatchObject({ themePreference: 'dark', theme: 'dark', palette: 'rose', density: 'comfortable', kit: 'minimal' });
});

test('accessible keyboard controls and mobile layout, with truthful storage failure', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#theme-builder');
  const builder = page.locator('.theme-builder');
  const palette = builder.getByLabel('Palette'); await palette.focus(); await expect(palette).toBeFocused();
  await page.keyboard.press('s'); await expect(palette).toHaveValue('slate');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await builder.getByLabel('Density').selectOption('compact');
  await expect(builder.getByRole('status')).toContainText('browser storage is unavailable');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).include('.theme-builder').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await builder.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
  const darkResults = await new AxeBuilder({ page }).include('.theme-builder').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(darkResults.violations).toEqual([]);
});
