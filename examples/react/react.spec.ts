import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('controlled core adapters update, retain focus and manage the dialog', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const name = page.getByRole('textbox', { name: 'Name' }); await expect(name).toHaveValue('Alex');
  await name.focus(); await page.keyboard.press('End'); await page.keyboard.type('andra');
  await expect(page.getByTestId('name-preview')).toHaveText('Alexandra'); await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await page.getByRole('checkbox', { name: 'Receive updates' }).check(); await expect(page.getByTestId('updates-preview')).toHaveText('on');
  await page.getByRole('tab', { name: 'Details' }).click(); await expect(page.getByRole('tabpanel', { name: 'Details' })).toHaveText('Details panel');
  const opener = page.getByRole('button', { name: 'Open dialog' }); await opener.click();
  const modal = page.getByRole('dialog', { name: 'Example dialog' }); await expect(modal).toBeVisible(); await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0); await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('example remains usable without page overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.getByRole('heading', { name: 'React adapter example' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('checkbox', { name: 'Receive updates' }).check(); await expect(page.getByTestId('updates-preview')).toHaveText('on');
});

test('rejected state, composition, form reset and open menu updates remain correct', async ({ page }) => {
  await page.goto('/regression.html');
  const rejected = page.getByRole('textbox', { name: 'Rejected input' }); await rejected.fill('changed'); await expect(rejected).toHaveValue('fixed');
  const check = page.getByRole('checkbox', { name: 'Rejected check' }); await check.click(); await expect(check).not.toBeChecked();
  await page.getByRole('tab', { name: 'Second tab' }).click(); await expect(page.getByRole('tab', { name: 'First tab' })).toHaveAttribute('aria-selected', 'true');
  const ime = page.getByRole('textbox', { name: 'IME input' });
  await ime.evaluate((element) => {
    Object.assign(window, { originalIme: element });
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (element as HTMLInputElement).value = 'A中';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '中', inputType: 'insertCompositionText', isComposing: true }));
  });
  await expect(ime).toHaveValue('A中'); expect(await ime.evaluate(element => (window as unknown as { originalIme: Element }).originalIme === element && element.isConnected)).toBe(true);
  await ime.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
  const reset = page.getByRole('textbox', { name: 'Reset input' }); await reset.fill('draft');
  await reset.evaluate(element => { Object.assign(window, { originalReset: element }); const form = (element as HTMLInputElement).form; if (form) HTMLFormElement.prototype.reset.call(form); });
  await page.evaluate(() => (window as unknown as { resizeUncontrolled(): void }).resizeUncontrolled());
  await expect(reset).toHaveValue(''); expect(await reset.evaluate(element => (window as unknown as { originalReset: Element }).originalReset === element)).toBe(true);
  const trigger = page.getByRole('button', { name: 'Actions' }); await trigger.click();
  await expect(page.getByRole('menuitem', { name: 'First item' })).toBeFocused();
  await page.evaluate(() => (window as unknown as { disableSecond(): void }).disableSecond());
  await expect(trigger).toHaveAttribute('aria-expanded', 'true'); await expect(page.getByRole('menuitem', { name: 'First item' })).toBeFocused();
  await expect(page.getByText('Tooltip rejected')).toBeVisible();
  expect((await new AxeBuilder({ page }).include('#tooltip-boundary').analyze()).violations).toEqual([]);
});


test('controlled dialog reopens when its owner rejects dismissal', async ({ page }) => {
  await page.goto('/regression.html?dialog');
  const dialog = page.getByRole('dialog', { name: 'Rejected dialog' });
  await expect(dialog).toBeVisible(); await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { dialogCloseCalls: number }).dialogCloseCalls)).toBe(1);
  await page.evaluate(() => (window as unknown as { resizeUncontrolled(): void }).resizeUncontrolled()); await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape'); await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { dialogCloseCalls: number }).dialogCloseCalls)).toBe(2);
});
