import { expect, type Page, type Locator } from '@playwright/test';
import primitives from '../../packages/tokens/primitives.json' with { type: 'json' };

async function waitForWorkspaceMode(page: Page): Promise<void> {
  const phone = (page.viewportSize()?.width ?? 0) < Number.parseInt(primitives['breakpoint.mobile'].$value, 10);
  await expect.poll(async () => (await page.getByRole('group', { name: 'Design token workspace', exact: true }).getAttribute('data-mode')) === 'phone').toBe(phone);
}

export async function tokenCanvas(page: Page, view: 'Tokens' | 'Preview' | 'Info' = 'Tokens'): Promise<void> {
  await waitForWorkspaceMode(page);
  const panel = page.getByRole('button', { name: 'Tokens', exact: true });
  if (await panel.isVisible()) await panel.click();
  await page.getByRole('tab', { name: view, exact: true }).click();
}

export async function tokenField(page: Page, key: string): Promise<Locator> {
  await waitForWorkspaceMode(page);
  const input = page.getByLabel(`${key} override`, { exact: true });
  if (!(await input.count())) {
    await tokenCanvas(page);
    await page.getByRole('button', { name: key, exact: true }).click();
  } else if (!(await input.isVisible())) {
    const panel = page.getByRole('button', { name: 'Details', exact: true });
    if (await panel.isVisible()) await panel.click();
  }
  await expect(input).toBeVisible();
  return input;
}
