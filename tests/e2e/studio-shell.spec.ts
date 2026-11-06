import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('mobile shell and representative routes pass whole-page accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, heading] of [['overview', 'A shared foundation for better interfaces.'], ['accessibility-lab', 'Accessibility Lab'], ['documentation', 'Documentation']] as const) {
    await page.goto(`/PWA-Design-System/#${route}`);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Studio theme', exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

for (const width of [768, 1440]) {
  test(`Studio sidebar navigation works at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/PWA-Design-System/#overview');
    const nav = page.getByRole('navigation', { name: 'Studio navigation', exact: true });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(10);
    await nav.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.studio-topbar') as HTMLElement).position)).toBe('sticky');
    expect(errors).toEqual([]);
  });
}

test('Theme select keeps a 44px target and works with the keyboard at mobile and desktop widths', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/PWA-Design-System/#settings');
    const theme = page.getByRole('combobox', { name: 'Studio theme' });
    const box = await theme.boundingBox();
    if (!box) throw new Error('Theme select has no geometry');
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    if (width === 390) expect(await theme.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    await theme.focus(); await expect(theme).toBeFocused();
    await page.keyboard.press('d');
    await expect(theme).toHaveValue('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await theme.selectOption('light');
  }
});

test('hash links, back navigation, old links and unknown pages resolve under the Pages subpath', async ({ page }) => {
  await page.goto('/PWA-Design-System/#settings');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Studio navigation', exact: true }).getByRole('link', { name: 'Foundations', exact: true }).click();
  await expect(page).toHaveURL(/#foundations$/);
  await expect(page.getByRole('heading', { name: 'Foundations', exact: true })).toBeVisible();
  await page.goBack(); await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page.goto('/PWA-Design-System/#appearance'); await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page.goto('/PWA-Design-System/#missing'); await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Return to overview →' }).click(); await expect(page).toHaveURL(/#overview$/);
});

test('desktop sidebar collapses accessibly without changing tablet or mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto('/PWA-Design-System/#overview');
  const sidebar = page.locator('#desktop-sidebar');
  const toggle = page.getByRole('button', { name: 'Collapse sidebar' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  const expand = page.getByRole('button', { name: 'Expand sidebar' });
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  expect(await sidebar.evaluate(element => element.getBoundingClientRect().width)).toBe(76);
  await page.getByRole('navigation', { name: 'Studio navigation', exact: true }).getByRole('link', { name: 'Foundations' }).click();
  await expect(page.getByRole('heading', { name: 'Foundations', exact: true })).toBeVisible();
  await expand.click(); await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true');
  expect(await sidebar.evaluate(element => element.getBoundingClientRect().width)).toBe(250);
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await page.setViewportSize({ width: 768, height: 800 });
  expect(await sidebar.evaluate(element => element.getBoundingClientRect().width)).toBe(210);
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sidebar).toBeHidden();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  expect(await sidebar.evaluate(element => element.getBoundingClientRect().width)).toBe(76);
});

test('mobile drawer traps focus, scrolls and restores focus on close, Escape and backdrop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/PWA-Design-System/#overview');
  const open = page.getByRole('button', { name: 'Open navigation' });
  const drawer = page.getByRole('dialog', { name: 'Navigation' });
  const close = page.getByRole('button', { name: 'Close navigation' });
  const scrollRange = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  expect(scrollRange).toBeGreaterThan(0);
  for (const fraction of [0, .5, 1]) {
    await page.evaluate(y => window.scrollTo(0, y), scrollRange * fraction);
    expect(await page.locator('.studio-topbar').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  }
  await expect(open).toBeVisible(); await open.click(); await expect(drawer).toBeVisible(); await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.keyboard.press('Tab');
  await expect(drawer.getByRole('link', { name: 'Overview' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(drawer.getByRole('link', { name: 'Settings' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  const nav = drawer.getByRole('navigation', { name: 'Mobile navigation' });
  const scrollable = await nav.evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight }));
  expect(scrollable.scroll).toBeGreaterThan(scrollable.client);
  for (const fraction of [0, .5, 1]) {
    await nav.evaluate((element, amount) => { element.scrollTop = (element.scrollHeight - element.clientHeight) * amount; }, fraction);
    await expect(close).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await expect(nav.getByRole('link', { name: 'Settings' })).toBeInViewport();
  await page.keyboard.press('Escape'); await expect(drawer).toBeHidden(); await expect(open).toBeFocused();
  await open.click(); await close.click(); await expect(drawer).toBeHidden(); await expect(open).toBeFocused();
  await open.click(); await page.mouse.click(380, 240); await expect(drawer).toBeHidden(); await expect(open).toBeFocused();
  await open.click(); await nav.getByRole('link', { name: 'Settings' }).click();
  await expect(drawer).toBeHidden(); await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeFocused();
  const geometry = await page.evaluate(() => {
    const header = document.querySelector('.studio-topbar'); const heading = document.querySelector('main h1');
    if (!header || !heading) throw new Error('Expected route heading and header');
    return { headerBottom: header.getBoundingClientRect().bottom, headingTop: heading.getBoundingClientRect().top, scrollY };
  });
  expect(geometry.scrollY).toBe(0);
  expect(geometry.headingTop).toBeGreaterThanOrEqual(geometry.headerBottom);
  await open.click(); await nav.getByRole('link', { name: 'Settings' }).click();
  await expect(drawer).toBeHidden(); await expect(open).toBeFocused();
});

test('theme survives reload and storage failure is announced', async ({ page }) => {
  await page.goto('/PWA-Design-System/#settings');
  const theme = page.getByRole('combobox', { name: 'Studio theme' });
  await theme.selectOption('dark'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload(); await expect(theme).toHaveValue('dark'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' }); await theme.selectOption('system'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } }); });
  await page.reload(); await theme.selectOption('dark');
  await expect(page.locator('#preference-status')).toContainText('storage is unavailable');
});

test('skip and route navigation focus a compact heading without outlining the workspace', async ({ page }) => {
  await page.goto('./#overview');
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const componentsLink = page.getByRole('navigation', { name: 'Studio navigation', exact: true }).getByRole('link', { name: 'Components', exact: true });
  await componentsLink.focus(); await page.keyboard.press('Enter');
  const heading = page.getByRole('heading', { name: 'Components', exact: true });
  await expect(heading).toBeFocused();
  expect(await heading.evaluate(element => element.matches(':focus-visible') && Number.parseFloat(getComputedStyle(element).outlineWidth) > 0)).toBe(true);
  await expect(page.locator('#main')).not.toBeFocused();
  const full = await page.locator('#main').boundingBox(), focus = await page.getByRole('heading', { name: 'Components', exact: true }).boundingBox();
  expect((focus?.width ?? 9999)).toBeLessThan(full?.width ?? 0);
});


test('system chrome follows resolved theme and committed surfaces without broad preview restyling', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('pwa-ds-theme', 'dark'); localStorage.setItem('pwa-ds-token-overrides-v1', JSON.stringify({ schema: 'pwa-design-system/token-overrides', version: 1, overrides: { global: {}, light: { 'color.surface': '#fafafa' }, dark: { 'color.surface': '#111827' } } })); });
  await page.goto('./#settings');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'black');
  await page.getByRole('combobox', { name: 'Studio theme', exact: true }).selectOption('light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fafafa');
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'default');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
});

test('long documentation scroll reveals contextual top action and preserves keyboard/reduced-motion navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#documentation');
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
  const header = page.locator('.studio-topbar'), top = page.getByRole('button', { name: 'Back to top', exact: true });
  await page.evaluate(() => window.scrollTo(0, innerHeight + 100)); await expect(top).toBeVisible(); await expect(header).toHaveAttribute('data-scroll-hidden', 'true');
  await page.getByRole('combobox', { name: 'Studio theme', exact: true }).focus(); await expect(header).not.toHaveAttribute('data-scroll-hidden', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(() => window.scrollTo(0, 0)); await page.evaluate(() => window.scrollTo(0, innerHeight + 100)); await expect(header).not.toHaveAttribute('data-scroll-hidden', 'true');
  await top.click(); await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeFocused(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0); await expect(top).toBeHidden();
  await page.evaluate(() => location.hash = 'components'); await expect(page.getByRole('heading', { name: 'Components', exact: true })).toBeVisible(); await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await expect(header).not.toHaveAttribute('data-scroll-hidden', 'true');
});
