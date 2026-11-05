import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = process.cwd();
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected an element with a bounding box');
  return box;
}

test('foundation families provide native semantics, keyboard behavior and an axe-clean fixture', async ({ page }) => {
  await page.goto('/PWA-Design-System/');
  await page.evaluate(() => { document.body.replaceChildren(); });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
  await page.evaluate(async (path) => {
    const { createButton, createIconButton, createBadge, createCard, createSeparator, createTooltip } = await import(/* @vite-ignore */ path);
    const main = document.createElement('main');
    const heading = document.createElement('h1');
    heading.textContent = 'Foundation components';
    const button = createButton({ label: 'Save', onClick: () => { button.element.textContent = 'Saved'; } });
    const icon = createIconButton({ label: 'Settings', icon: '⚙' });
    const badge = createBadge({ label: 'Ready', variant: 'success' });
    const card = createCard({ label: 'Profile' });
    card.element.textContent = 'Account information';
    const separator = createSeparator();
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'More information';
    const tooltip = createTooltip({ trigger, text: 'Helpful details' });
    main.append(heading, button.element, icon.element, badge.element, card.element, separator.element, tooltip.element);
    document.body.append(main);
  }, `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`);
  const save = page.getByRole('button', { name: 'Save' });
  await save.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('Ready')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('separator')).toHaveCount(1);
  const trigger = page.getByRole('button', { name: 'More information' });
  await trigger.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await trigger.blur();
  await trigger.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.getByRole('tooltip').hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('tooltip stays inside a narrow viewport and follows scroll and resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/PWA-Design-System/');
  await page.evaluate(() => { document.body.replaceChildren(); });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
  await page.evaluate(async (path) => {
    const { createTooltip } = await import(/* @vite-ignore */ path);
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.height = '1600px';
    const trigger = document.createElement('button');
    trigger.textContent = 'Help';
    trigger.style.position = 'absolute';
    trigger.style.right = '0';
    trigger.style.top = '900px';
    document.body.append(createTooltip({ trigger, text: 'Details near the edge of a narrow viewport.' }).element);
    window.scrollTo(0, 500);
  }, `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
  await page.getByRole('button', { name: 'Help' }).focus();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  const before = await boxOf(tip);
  expect(before.x).toBeGreaterThanOrEqual(0);
  expect(before.x + before.width).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollBy(0, 40));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(540);
  await expect.poll(async () => (await boxOf(tip)).y).toBeLessThan(before.y);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    window.scrollTo(0, 600);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
  const anchor = await boxOf(page.getByRole('button', { name: 'Help' }));
  await expect.poll(async () => (await boxOf(tip)).y).toBeCloseTo(anchor.y + anchor.height, 0);
  await page.setViewportSize({ width: 320, height: 500 });
  await expect.poll(async () => { const box = await boxOf(tip); return box.x + box.width; }).toBeLessThanOrEqual(320);
  const after = await boxOf(tip);
  expect(after.y).toBeGreaterThanOrEqual(0);
  expect(after.y + after.height).toBeLessThanOrEqual(500);
});

test('standalone tooltip keeps its full border box and long content inside narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 360 });
  await page.goto('/PWA-Design-System/');
  await page.evaluate(() => {
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(element => { element.remove(); });
    document.body.replaceChildren();
  });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
  const defaultBoxSizing = await page.evaluate(async (path) => {
    const { createTooltip } = await import(/* @vite-ignore */ path);
    const probe = document.createElement('div');
    document.body.append(probe);
    const sizing = getComputedStyle(probe).boxSizing;
    probe.remove();
    const trigger = document.createElement('button');
    trigger.textContent = 'Help';
    const tooltip = createTooltip({ trigger, text: 'Averylongunbrokentooltipmessage'.repeat(15) });
    tooltip.element.style.position = 'fixed';
    tooltip.element.style.right = '0';
    tooltip.element.style.bottom = '0';
    document.body.append(tooltip.element);
    return sizing;
  }, `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`);
  expect(defaultBoxSizing).toBe('content-box');
  await page.getByRole('button', { name: 'Help' }).focus();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  for (const width of [390, 320, 240, 768]) {
    await page.setViewportSize({ width, height: 360 });
    await expect.poll(async () => {
      const box = await boxOf(tip);
      return box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= 360;
    }).toBe(true);
    expect(await tip.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});

test('enabled primary button boundary contrasts against the surface across configured axes', async ({ page }) => {
  await page.goto('/PWA-Design-System/');
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
  const failures = await page.evaluate(async (path) => {
    const { createButton } = await import(/* @vite-ignore */ path);
    const button = createButton({ label: 'Save' }).element;
    const surface = document.createElement('div');
    surface.style.background = 'var(--ds-color-surface)';
    surface.append(button);
    document.body.append(surface);
    const luminance = (color: string) => {
      const parts = color.match(/[\d.]+/g);
      if (!parts || parts.length < 3) throw new Error(`Unexpected color: ${color}`);
      const channels = parts.slice(0, 3).map(Number).map(n => {
        const channel = n / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const failures: string[] = [];
    for (const theme of ['light', 'dark']) for (const palette of ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate']) for (const density of ['comfortable', 'compact']) for (const kit of ['default', 'minimal', 'enterprise']) {
      Object.assign(document.documentElement.dataset, { theme, palette, density, kit });
      const border = luminance(getComputedStyle(button).borderTopColor);
      const background = luminance(getComputedStyle(surface).backgroundColor);
      const ratio = (Math.max(border, background) + .05) / (Math.min(border, background) + .05);
      if (ratio < 3) failures.push(`${theme}/${palette}/${density}/${kit}: ${ratio}`);
    }
    return failures;
  }, `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`);
  expect(failures).toEqual([]);
});

test('Escape dismisses an open tooltip before its containing native dialog', async ({ page }) => {
  await page.goto('/PWA-Design-System/');
  await page.evaluate(() => { document.body.replaceChildren(); });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
  await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
  await page.evaluate(async (path) => {
    const { createTooltip } = await import(/* @vite-ignore */ path);
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', 'Preferences');
    const trigger = document.createElement('button');
    trigger.textContent = 'Details';
    dialog.append(createTooltip({ trigger, text: 'More information' }).element);
    document.body.append(dialog);
    dialog.showModal();
    trigger.focus();
  }, `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`);
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Preferences' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Preferences' })).toBeHidden();
});

for (const modal of [false, true]) {
  test(`tooltip escapes transformed clipping and retains scoped themes${modal ? ' in a modal' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.goto('/PWA-Design-System/');
    await page.evaluate(() => { document.body.replaceChildren(); });
    await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
    await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
    await page.evaluate(async ({ path, modal }) => {
      const { createTooltip } = await import(/* @vite-ignore */ path);
      const host = document.createElement(modal ? 'dialog' : 'div');
      host.id = 'host';
      host.style.cssText = 'position:fixed;left:60px;top:100px;width:220px;height:80px;transform:translateX(1px);overflow:hidden;--ds-color-surface:rgb(20, 50, 80)';
      const trigger = document.createElement('button');
      trigger.textContent = 'Details';
      host.append(createTooltip({ trigger, text: 'Tooltip details' }).element);
      document.body.append(host);
      if (host instanceof HTMLDialogElement) host.showModal();
      trigger.focus();
    }, { path: `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`, modal });
    const trigger = page.getByRole('button', { name: 'Details' });
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    const anchorBox = await boxOf(trigger);
    const tipBox = await boxOf(tooltip);
    expect(tipBox.y).toBeCloseTo(anchorBox.y + anchorBox.height, 0);
    await expect(tooltip).toHaveCSS('background-color', 'rgb(20, 50, 80)');
    await page.locator('#host').evaluate(node => (node as HTMLElement).style.setProperty('--ds-color-surface', 'rgb(80, 40, 20)'));
    await expect(tooltip).toHaveCSS('background-color', 'rgb(80, 40, 20)');
    await trigger.hover();
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await trigger.hover();
    await expect(tooltip).toBeVisible();
  });
}

for (const action of ['close', 'destroy', 'remove-trigger', 'remove-dialog'] as const) {
  test(`tooltip closes and releases global listeners when ${action}`, async ({ page }) => {
    await page.goto('/PWA-Design-System/');
    await page.evaluate(() => { document.body.replaceChildren(); });
    await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/tokens/generated/tokens.css'), 'utf8') });
    await page.addStyleTag({ content: readFileSync(resolve(root, 'packages/core/src/foundation/foundation.css'), 'utf8') });
    await page.evaluate(async ({ path, action }) => {
      const { createDialog, createTooltip } = await import(/* @vite-ignore */ path);
      const active = new Set<EventListenerOrEventListenerObject>();
      const windowListeners = new Map<string, Set<EventListenerOrEventListenerObject>>([['resize', new Set()], ['scroll', new Set()]]);
      const add = document.addEventListener.bind(document);
      const remove = document.removeEventListener.bind(document);
      const addWindow = window.addEventListener.bind(window);
      const removeWindow = window.removeEventListener.bind(window);
      document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === 'keydown') active.add(listener);
        add(type, listener, options);
      }) as typeof document.addEventListener;
      document.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        if (type === 'keydown') active.delete(listener);
        remove(type, listener, options);
      }) as typeof document.removeEventListener;
      window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        windowListeners.get(type)?.add(listener);
        addWindow(type, listener, options);
      }) as typeof window.addEventListener;
      window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        windowListeners.get(type)?.delete(listener);
        removeWindow(type, listener, options);
      }) as typeof window.removeEventListener;
      const dialog = createDialog({ title: 'Preferences', description: 'Settings' });
      const trigger = document.createElement('button');
      trigger.textContent = 'Tooltip trigger';
      const tooltip = createTooltip({ trigger, text: 'Help text' });
      dialog.element.append(tooltip.element);
      document.body.append(dialog.element);
      dialog.open();
      trigger.focus();
      Object.assign(window, {
        exerciseTooltipCleanup: () => {
          if (action === 'close') dialog.close();
          else if (action === 'destroy') dialog.destroy();
          else if (action === 'remove-trigger') trigger.remove();
          else dialog.element.remove();
        },
        activeTooltipListeners: () => active.size + [...windowListeners.values()].reduce((total, listeners) => total + listeners.size, 0)
      });
    }, { path: `/PWA-Design-System/@fs${resolve(root, 'packages/core/src/index.ts')}`, action });
    const trigger = page.getByRole('button', { name: 'Tooltip trigger' });
    await trigger.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    const run = () => (window as unknown as { exerciseTooltipCleanup(): void }).exerciseTooltipCleanup();
    const active = () => (window as unknown as { activeTooltipListeners(): number }).activeTooltipListeners();
    expect(await page.evaluate(active)).toBe(3);
    await page.evaluate(run);
    await expect(page.getByRole('tooltip')).toBeHidden();
    await expect.poll(() => page.evaluate(active)).toBe(0);
  });
}
