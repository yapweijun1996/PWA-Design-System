import { expect, type Page, type Locator } from '@playwright/test';

export async function tokenCanvas(page: Page, view: 'Tokens' | 'Preview' | 'Info' = 'Tokens'): Promise<void> {
  const panel = page.getByRole('button', { name: 'Workspace', exact: true });
  if (await panel.isVisible()) await panel.click();
  await page.getByRole('tab', { name: view, exact: true }).click();
}

export async function tokenField(page: Page, key: string): Promise<Locator> {
  const input = page.getByLabel(`${key} override`, { exact: true });
  if (!(await input.count())) {
    await tokenCanvas(page);
    await page.getByRole('button', { name: key, exact: true }).click();
  } else if (!(await input.isVisible())) {
    const panel = page.getByRole('button', { name: 'Token details', exact: true });
    if (await panel.isVisible()) await panel.click();
  }
  await expect(input).toBeVisible();
  return input;
}
