import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('contrast calculator validates colors and documents its limits', async ({ page }) => {
  await page.goto('./#accessibility-lab');
  const lab = page.locator('.accessibility-lab');
  await expect(lab.getByRole('heading', { name: 'Accessibility Lab' })).toBeVisible();
  const foreground = lab.getByLabel('Foreground color');
  await expect(lab.getByRole('status')).toContainText('21.00:1');
  await foreground.fill('#777777');
  await expect(lab.getByRole('status')).toContainText('Normal text: Below 4.5:1');
  await expect(lab.getByRole('status')).toContainText('Large text: Meets 3:1');
  await foreground.fill('#fff');
  await expect(foreground).toHaveAttribute('aria-invalid', 'true');
  await expect(lab.getByRole('status')).toContainText('valid colors');
  await expect(lab.locator('.accessibility-lab__preview')).toBeHidden();
  await foreground.fill('#000000');
  await expect(foreground).not.toHaveAttribute('aria-invalid', 'true');
  await foreground.focus(); await expect(foreground).toBeFocused();
  const results = await new AxeBuilder({ page }).include('.accessibility-lab').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await expect(lab).toContainText('NOT VERIFIED');
});

test('documentation is readable by automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#documentation');
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).include('.studio-documentation').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

for (const width of [390, 768, 1440]) {
  test(`lab and documentation navigate without document overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('./#documentation');
    await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Open Accessibility Lab' }).click();
    await expect(page.getByRole('heading', { name: 'Accessibility Lab', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('.studio-documentation')).toContainText('NOT VERIFIED');
    expect(errors).toEqual([]);
  });
}
