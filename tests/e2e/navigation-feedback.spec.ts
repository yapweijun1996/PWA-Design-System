import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const navPath = `/PWA-Design-System/@fs${process.cwd()}/packages/core/src/navigation/index.ts`;
const feedbackPath = `/PWA-Design-System/@fs${process.cwd()}/packages/core/src/feedback/index.ts`;
const navigationCss = `/PWA-Design-System/@fs${process.cwd()}/packages/core/src/navigation/navigation.css`;
async function useStandaloneStyles(page: import('@playwright/test').Page) {
  await page.evaluate(() => { document.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(node => { node.remove(); }); document.body.replaceChildren(); });
  await page.addStyleTag({ content: readFileSync(resolve('packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve('packages/core/src/navigation/navigation.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve('packages/core/src/feedback/feedback.css'), 'utf8') });
  const boxSizing = await page.evaluate(() => {
    const probe = document.createElement('div'); document.body.append(probe);
    const value = getComputedStyle(probe).boxSizing; probe.remove(); return value;
  });
  expect(boxSizing).toBe('content-box');
}
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.addStyleTag({ url: navigationCss });
  await page.evaluate(async ({ navPath, feedbackPath }) => {
    const nav = await import(/* @vite-ignore */ navPath);
    const feedback = await import(/* @vite-ignore */ feedbackPath);
    document.body.replaceChildren();
    const before = document.createElement('button'); before.textContent = 'Before'; document.body.append(before);
    const changes: number[] = []; const changesOutput = document.createElement('output'); changesOutput.id = 'tab-changes'; changesOutput.value = '[]';
    const tabs = nav.createTabs({ label: 'Views', tabs: [{ label: 'First', content: 'First panel' }, { label: 'Second', content: 'Second panel' }], onChange: (index: number) => { changes.push(index); changesOutput.value = JSON.stringify(changes); } }); document.body.append(tabs.element, changesOutput); Object.assign(window, { fixtureTabs: tabs });
    const breadcrumb = nav.createBreadcrumb([{ label: 'Home', href: 'https://example.test/' }, { label: 'Current' }]); document.body.append(breadcrumb.element);
    const counter = document.createElement('output'); counter.id = 'counter'; counter.value = '0';
    const menu = nav.createMenu({ label: 'Actions', items: [{ label: 'Disabled', disabled: true, onSelect: () => { counter.value = 'disabled'; } }, { label: 'Run', onSelect: () => { counter.value = 'run'; } }] }); document.body.append(menu.element);
    const after = document.createElement('button'); after.textContent = 'After'; document.body.append(after, counter);
    const pagination = nav.createPagination({ page: 1, totalPages: 2, onChange: (page: number) => { counter.value = String(page); } }); document.body.append(pagination.element);
    const dialog = feedback.createDialog({ title: 'Dialog title', description: 'Dialog description' }); document.body.append(dialog.element); Object.assign(window, { fixtureDialog: dialog });
    const open = document.createElement('button'); open.textContent = 'Open dialog'; open.addEventListener('click', () => dialog.open(open)); document.body.append(open);
    const alert = feedback.createAlert({ message: 'Static message' }); const urgent = feedback.createAlert({ message: 'Urgent message', assertive: true }); document.body.append(alert.element, urgent.element);
    const toast = feedback.createToast({ message: 'Saved' }); document.body.append(toast.element);
  }, { navPath, feedbackPath });
});

test('tabs maintain relationships, selection and wrapping keyboard focus', async ({ page }) => {
  const first = page.getByRole('tab', { name: 'First' }), second = page.getByRole('tab', { name: 'Second' });
  await first.focus(); await page.keyboard.press('ArrowLeft'); await expect(second).toBeFocused(); await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Second' })).toHaveText('Second panel'); await page.keyboard.press('Home'); await expect(first).toBeFocused();
});
test('tabs notify only actual user selection changes', async ({ page }) => {
  const first = page.getByRole('tab', { name: 'First' }), second = page.getByRole('tab', { name: 'Second' });
  await first.click(); await expect(page.locator('#tab-changes')).toHaveText('[]');
  await second.click(); await second.click(); await expect(page.locator('#tab-changes')).toHaveText('[1]');
  await page.evaluate(() => (window as unknown as { fixtureTabs: { select(index: number): void } }).fixtureTabs.select(0));
  await expect(page.locator('#tab-changes')).toHaveText('[1]');
  await first.focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#tab-changes')).toHaveText('[1,1]');
});
test('breadcrumb exposes the current page and real links', async ({ page }) => {
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByText('Current')).toHaveAttribute('aria-current', 'page'); await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', 'https://example.test/');
});
test('menu blocks disabled activation, wraps, escapes and tabs away', async ({ page, browserName }) => {
  const trigger = page.getByRole('button', { name: 'Actions' }), disabled = page.getByRole('menuitem', { name: 'Disabled' }), run = page.getByRole('menuitem', { name: 'Run' });
  // Probe native macOS WebKit behavior: without full keyboard navigation, Option-Tab visits buttons.
  let nativeTabSkipsButtons = false;
  if (browserName === 'webkit' && process.platform === 'darwin') {
    await page.evaluate(() => { const probe = document.createElement('div'); probe.id = 'tab-probe'; for (const id of ['tab-probe-a', 'tab-probe-b']) { const button = document.createElement('button'); button.id = id; button.textContent = id; probe.append(button); } document.body.append(probe); });
    await page.locator('#tab-probe-a').focus(); await page.keyboard.press('Tab');
    nativeTabSkipsButtons = !(await page.locator('#tab-probe-b').evaluate(element => element === document.activeElement));
    await page.locator('#tab-probe').evaluate(element => element.remove());
  }
  const tab = nativeTabSkipsButtons ? 'Alt+Tab' : 'Tab';
  const shiftTab = nativeTabSkipsButtons ? 'Alt+Shift+Tab' : 'Shift+Tab';
  await trigger.focus(); await page.keyboard.press('ArrowDown'); await expect(disabled).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('#counter')).toHaveText('0');
  await page.keyboard.press('ArrowUp'); await expect(run).toBeFocused(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press(tab); await expect(page.getByRole('button', { name: 'After' })).toBeFocused(); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press(shiftTab); await expect(page.getByRole('link', { name: 'Home' })).toBeFocused(); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab'); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click(); await page.evaluate(() => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
test('selected tab boundary contrasts against surrounding surfaces across themes and palettes', async ({ page }) => {
  const results = await page.evaluate(() => {
    const color = (value: string): number[] => {
      const values = value.startsWith('#') ? value.slice(1).match(/../g)?.map(v => parseInt(v, 16)) : value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (values?.length !== 3) throw new Error(`Unexpected color: ${value}`);
      return values;
    };
    const luminance = (value: string): number => { const v = color(value).map(x => x / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return v[0] * .2126 + v[1] * .7152 + v[2] * .0722; };
    const contrast = (a: string, b: string): number => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const result = []; const root = document.documentElement; const tab = document.querySelector<HTMLElement>('[role=tab][aria-selected=true]');
    if (!tab) throw new Error('Selected tab was not found');
    for (const theme of ['light', 'dark']) for (const palette of ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate']) {
      root.dataset.theme = theme; root.dataset.palette = palette;
      const styles = getComputedStyle(root), border = getComputedStyle(tab).borderTopColor;
      for (const surface of ['--ds-color-background', '--ds-color-surface', '--ds-color-surface-alt']) result.push({ theme, palette, surface, ratio: contrast(border, styles.getPropertyValue(surface).trim()) });
    }
    return result;
  });
  for (const result of results) expect(result.ratio, `${result.theme}/${result.palette}/${result.surface}`).toBeGreaterThanOrEqual(3);
});
test('pagination buttons update the current page and boundaries', async ({ page }) => {
  const prev = page.getByRole('button', { name: 'Previous' }), next = page.getByRole('button', { name: 'Next' }); await expect(prev).toBeDisabled(); await next.focus(); await page.keyboard.press('Enter'); await expect(page.getByText('Page 2 of 2')).toBeVisible(); await expect(next).toBeDisabled();
});
test('native dialog closes with Escape and restores focus', async ({ page }) => {
  const open = page.getByRole('button', { name: 'Open dialog' }); await open.click(); const dialog = page.getByRole('dialog', { name: 'Dialog title' }); await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(open).toBeFocused(); await open.click(); await dialog.getByRole('button', { name: 'Close' }).click(); await expect(open).toBeFocused();
  await open.click(); await page.evaluate(() => (window as unknown as { fixtureDialog: { destroy(): void } }).fixtureDialog.destroy()); await expect(dialog).not.toBeVisible(); await expect(open).toBeFocused();
});
test('alerts distinguish static content from assertive content', async ({ page }) => {
  await expect(page.getByText('Static message')).not.toHaveAttribute('role', 'alert'); await expect(page.getByRole('alert')).toHaveText('Urgent message');
});
test('toast exposes a status and can be dismissed from keyboard', async ({ page }) => {
  const toast = page.locator('.ds-toast'); await expect(toast.getByRole('status')).toHaveText('Saved'); const dismiss = toast.getByRole('button', { name: 'Dismiss' }); await dismiss.focus(); await page.keyboard.press('Enter'); await expect(toast).toHaveCount(0);
});
test('delayed toast mounting populates its live region after attachment', async ({ page }) => {
  const before = await page.evaluate(async path => {
    const { createToast } = await import(/* @vite-ignore */ path); const toast = createToast({ message: 'Delayed' });
    await Promise.resolve(); const initial = toast.element.querySelector('[role=status]').textContent;
    document.body.append(toast.element); return initial;
  }, feedbackPath);
  expect(before).toBe(''); await expect(page.getByRole('status').filter({ hasText: 'Delayed' })).toBeVisible();
});


test('navigation and feedback pass scoped axe checks in default, open menu and modal states', async ({ page }) => {
  const feedbackCss = `/PWA-Design-System/@fs${process.cwd()}/packages/core/src/feedback/feedback.css`;
  await page.addStyleTag({ url: feedbackCss });
  await expect(page.locator('.ds-toast [role=status]')).toHaveText('Saved');
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  const resting = await new AxeBuilder({ page }).include('.ds-tabs').include('.ds-breadcrumb').include('.ds-menu').include('.ds-pagination').include('.ds-alert').include('.ds-toast').withTags(tags).analyze();
  expect(resting.violations, 'resting component states').toEqual([]);

  await page.getByRole('button', { name: 'Actions' }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  const menu = await new AxeBuilder({ page }).include('.ds-menu').withTags(tags).analyze();
  expect(menu.violations, 'open action menu').toEqual([]);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Open dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Dialog title' });
  await expect(dialog).toBeVisible();
  const modal = await new AxeBuilder({ page }).include('.ds-dialog').withTags(tags).analyze();
  expect(modal.violations, 'open modal only; background is inert').toEqual([]);
});

test('standalone dialog stays within a narrow viewport without a global reset', async ({ page }) => {
  await page.setViewportSize({ width: 240, height: 400 });
  await useStandaloneStyles(page);
  await page.evaluate(async path => {
    const { createDialog } = await import(/* @vite-ignore */ path);
    const dialog = createDialog({ title: 'A very long title without supercalifragilisticexpialidocious wrapping issues', description: `A long description ${'x'.repeat(180)}` });
    document.body.append(dialog.element); dialog.open();
  }, feedbackPath);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const geometry = await dialog.evaluate(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(geometry.left).toBeGreaterThanOrEqual(0); expect(geometry.right).toBeLessThanOrEqual(240);
  expect(geometry.width).toBeLessThanOrEqual(216); expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
});

for (const modal of [false, true]) {
  test(`standalone menu remains in viewport inside a transformed clipped ${modal ? 'dialog' : 'container'}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 320 });
    await useStandaloneStyles(page);
    await page.evaluate(async ({ path, modal }) => {
      const { createMenu } = await import(/* @vite-ignore */ path);
      const host = document.createElement(modal ? 'dialog' : 'div');
      host.id = 'standalone-host'; host.style.cssText = 'position:fixed;left:190px;top:190px;width:100px;height:70px;transform:translateX(1px);overflow:hidden;--ds-color-surface:rgb(20, 50, 80)';
      const menu = createMenu({ label: 'Actions', items: [{ label: `Long menu choice ${'x'.repeat(80)}`, onSelect() {} }, { label: 'Second', onSelect() {} }] });
      host.append(menu.element); document.body.append(host);
      if (host instanceof HTMLDialogElement) host.showModal();
    }, { path: navPath, modal });
    const trigger = page.getByRole('button', { name: 'Actions' });
    await trigger.focus(); await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu'); await expect(menu).toBeVisible();
    const selected = page.getByRole('menuitem').first(); await expect(selected).toBeFocused();
    const rect = await menu.evaluate(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
    expect(rect.left).toBeGreaterThanOrEqual(0); expect(rect.right).toBeLessThanOrEqual(320);
    expect(rect.top).toBeGreaterThanOrEqual(0); expect(rect.bottom).toBeLessThanOrEqual(320);
    expect(rect.scrollWidth).toBeLessThanOrEqual(rect.clientWidth);
    await expect(menu).toHaveCSS('background-color', 'rgb(20, 50, 80)');
    await page.locator('#standalone-host').evaluate(element => (element as HTMLElement).style.setProperty('--ds-color-surface', 'rgb(80, 40, 20)'));
    await expect(menu).toHaveCSS('background-color', 'rgb(80, 40, 20)');
    await page.setViewportSize({ width: 240, height: 320 });
    await expect.poll(() => menu.evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(240);
    await page.keyboard.press('Escape'); await expect(menu).toBeHidden(); await expect(trigger).toBeFocused();
    if (modal) {
      await page.keyboard.press('Escape'); await expect(page.locator('#standalone-host')).toBeHidden();
      await page.locator('#standalone-host').evaluate(element => (element as HTMLDialogElement).showModal());
      await trigger.focus();
      await page.keyboard.press('ArrowDown'); await expect(menu).toBeVisible();
      await page.locator('#standalone-host').evaluate(element => (element as HTMLDialogElement).close());
      await expect(menu).toBeHidden(); await expect(page.locator('#standalone-host [aria-haspopup="menu"]')).toHaveAttribute('aria-expanded', 'false');
    }
  });
}

test('destroy closes an open menu and removes its interactions', async ({ page }) => {
  await useStandaloneStyles(page);
  await page.evaluate(async path => {
    const { createMenu } = await import(/* @vite-ignore */ path);
    const menu = createMenu({ label: 'Disposable actions', items: [{ label: 'Run', onSelect() {} }] });
    document.body.append(menu.element); Object.assign(window, { disposableMenu: menu });
  }, navPath);
  const trigger = page.getByRole('button', { name: 'Disposable actions' });
  await trigger.focus(); await page.keyboard.press('ArrowDown'); await expect(page.getByRole('menu')).toBeVisible();
  await page.evaluate(() => (window as unknown as { disposableMenu: { destroy(): void } }).disposableMenu.destroy());
  await expect(page.getByRole('menu')).toBeHidden(); await expect(trigger).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.getByRole('menu')).toBeHidden();
});
