import '../../../packages/tokens/generated/tokens.css';
import './styles.css';
import { resolveRoute, routes, type RouteId } from './app/routes.js';
import { initializeTokenOverrides } from './features/tokens/index.js';
import { initializePwa } from './features/pwa/index.js';
import { isDraftUnsafe, reportUnsafeDraft } from './features/pwa/guard.js';

type Theme = 'light' | 'dark' | 'system';
type Cleanup = () => void;
function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Studio shell is missing ${selector}`);
  return element;
}
const root = document.documentElement;
const main = requiredElement<HTMLElement>('#main');
const title = requiredElement<HTMLElement>('#current-page');
const announcement = requiredElement<HTMLElement>('#route-announcement');
const select = requiredElement<HTMLSelectElement>('#theme-select');
const status = requiredElement<HTMLElement>('#preference-status');
const drawer = requiredElement<HTMLDialogElement>('#mobile-navigation');
const openNavigation = requiredElement<HTMLButtonElement>('#open-navigation');
const closeNavigation = requiredElement<HTMLButtonElement>('#close-navigation');
const sidebarToggle = requiredElement<HTMLButtonElement>('#toggle-sidebar');
const shell = requiredElement<HTMLElement>('.studio-layout');
const media = window.matchMedia('(prefers-color-scheme: dark)');
const mobile = window.matchMedia('(max-width: 699px)');

// Keep the override observer alive for the document lifetime, including bfcache restores.
initializeTokenOverrides();
initializePwa();

function focusPageHeading(): void {
  const target = main.querySelector<HTMLElement>('h1') ?? main.querySelector<HTMLElement>('.studio-loading, p') ?? main;
  target.tabIndex = -1; target.classList.add('studio-route-focus'); target.focus({ preventScroll: true });
}

// Editing routes keep stable navigation; only the long-form reader uses smart hiding.
const topbar = requiredElement<HTMLElement>('.studio-topbar');
const backToTop = requiredElement<HTMLButtonElement>('#scroll-to-top');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let previousScroll = window.scrollY;
function updateBackToTop(): void {
  const active = document.activeElement;
  const interacting = active instanceof HTMLElement && main.contains(active)
    && (active.tabIndex >= 0 || active.isContentEditable || active.matches('input, textarea, select'));
  backToTop.hidden = window.scrollY < window.innerHeight || interacting;
}
function resetScrollTools(): void { delete topbar.dataset.scrollHidden; updateBackToTop(); previousScroll = window.scrollY; }
window.addEventListener('scroll', () => {
  const current = window.scrollY, movement = current - previousScroll;
  updateBackToTop();
  if (main.dataset.workspace !== 'documentation' || document.querySelector('#pwa-update:not([hidden]), #pwa-connectivity:not([hidden])') || drawer.open || reducedMotion.matches || topbar.contains(document.activeElement) || current < topbar.offsetHeight * 2) delete topbar.dataset.scrollHidden;
  else if (Math.abs(movement) >= 12) { if (movement > 0) topbar.dataset.scrollHidden = 'true'; else delete topbar.dataset.scrollHidden; }
  if (Math.abs(movement) >= 12) previousScroll = current;
}, { passive: true });
window.addEventListener('resize', resetScrollTools);
main.addEventListener('focusin', updateBackToTop);
main.addEventListener('focusout', () => queueMicrotask(updateBackToTop));
reducedMotion.addEventListener('change', resetScrollTools);
topbar.addEventListener('focusin', () => { delete topbar.dataset.scrollHidden; });
backToTop.addEventListener('click', () => { focusPageHeading(); window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); });

function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}
function applyTheme(preference: Theme): void {
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
  if (select) select.value = preference;
}
const initial = root.dataset.themePreference;
applyTheme(isTheme(initial) ? initial : 'light');
select.addEventListener('change', () => {
  if (!isTheme(select.value)) return;
  applyTheme(select.value);
  try {
    localStorage.setItem('pwa-ds-theme', select.value);
    status.textContent = `${select.value} theme selected.`;
  } catch {
    status.textContent = 'Theme changed for this page, but browser storage is unavailable.';
  }
});
media.addEventListener('change', () => {
  if (root.dataset.themePreference === 'system') applyTheme('system');
});

for (const nav of document.querySelectorAll<HTMLElement>('[data-studio-nav]')) {
  const label = document.createElement('p'); label.className = 'studio-nav-heading'; label.textContent = 'WORKSPACE'; nav.append(label);
  const list = document.createElement('div'); list.className = 'studio-nav-list';
  routes.forEach((route, index) => {
    const link = document.createElement('a'); link.className = 'studio-nav-link'; link.href = `#${route.id}`; link.dataset.route = route.id; link.title = route.label;
    const number = document.createElement('span'); number.className = 'studio-nav-number'; number.setAttribute('aria-hidden', 'true'); number.textContent = String(index + 1).padStart(2, '0');
    const text = document.createElement('span'); text.textContent = route.label;
    link.append(number, text); list.append(link);
  });
  nav.append(list);
}

sidebarToggle.addEventListener('click', () => {
  const collapsed = shell.dataset.sidebar !== 'collapsed';
  shell.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.textContent = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
});

let restoreDrawerFocus = true;
openNavigation.addEventListener('click', () => {
  if (!drawer.open) { restoreDrawerFocus = true; drawer.showModal(); document.body.dataset.drawerOpen = 'true'; closeNavigation.focus(); }
});
closeNavigation.addEventListener('click', () => drawer.close());
drawer.addEventListener('click', event => {
  if (event.target === drawer) drawer.close();
  else if (event.target instanceof Element) {
    const link = event.target.closest<HTMLAnchorElement>('a[data-route]');
    if (link) { restoreDrawerFocus = link.hash === location.hash; drawer.close(); }
  }
});
drawer.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable: HTMLElement[] = [closeNavigation, ...drawer.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(element => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const current = document.activeElement instanceof HTMLElement ? focusable.indexOf(document.activeElement) : -1;
  const next = current < 0 ? (event.shiftKey ? focusable.length - 1 : 0)
    : (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
  event.preventDefault();
  focusable[next].focus();
});
drawer.addEventListener('close', () => {
  delete document.body.dataset.drawerOpen;
  if (restoreDrawerFocus && mobile.matches) openNavigation.focus();
  else if (restoreDrawerFocus) focusPageHeading();
});
mobile.addEventListener('change', () => { if (!mobile.matches && drawer.open) drawer.close(); });
document.querySelector<HTMLAnchorElement>('.studio-skip')?.addEventListener('click', event => {
  event.preventDefault(); focusPageHeading(); main.scrollIntoView({ block: 'start' });
});

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag); element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function pageHeading(container: HTMLElement, eyebrow: string, heading: string, description: string): void {
  const header = node('header', 'studio-page-heading');
  header.append(node('p', 'studio-eyebrow', eyebrow), node('h1', 'studio-page-title', heading), node('p', 'studio-page-description', description));
  container.append(header);
}
function link(label: string, hash: RouteId, className = 'studio-card-link'): HTMLAnchorElement {
  const element = node('a', className, label); element.href = `#${hash}`; return element;
}
function renderOverview(container: HTMLElement): void {
  pageHeading(container, 'DESIGN SYSTEM STUDIO', 'A shared foundation for better interfaces.', 'Explore the building blocks, inspect design tokens, and shape consistent experiences.');
  const stats = node('div', 'studio-section-label'); stats.append(node('h2', 'studio-section-title', 'Your workspace'), node('span', 'studio-section-meta', 'EXPLORE / 03')); container.append(stats);
  const grid = node('div', 'studio-card-grid');
  const cards: { number: string; title: string; text: string; label: string; route: RouteId }[] = [
    { number: '01 / LIBRARY', title: 'Components', text: 'Explore reusable interface patterns and inspect their behavior.', label: 'Explore components →', route: 'components' },
    { number: '02 / FOUNDATION', title: 'Design tokens', text: 'Inspect the shared values behind colors, type, spacing, and more.', label: 'Explore tokens →', route: 'design-tokens' },
    { number: '03 / PLAYGROUND', title: 'Layouts', text: 'Explore how interface patterns adapt across screen sizes.', label: 'Explore layouts →', route: 'layout-playground' }
  ];
  for (const card of cards) {
    const item = node('article', 'studio-card'); item.append(node('p', 'studio-card-index', card.number), node('h3', 'studio-card-title', card.title), node('p', 'studio-card-text', card.text), link(card.label, card.route)); grid.append(item);
  }
  container.append(grid);
  const note = node('div', 'studio-notice'); note.append(node('strong', '', 'Built to evolve'), node('p', '', 'This workspace is under active development. Sections that are not available yet are marked as pending.')); container.append(note);
}
function renderFoundations(container: HTMLElement): void {
  pageHeading(container, 'FOUNDATIONS', 'Foundations', 'A consistent interface starts with shared decisions.');
  const grid = node('div', 'studio-card-grid');
  for (const [heading, text] of [['Color', 'Semantic roles connect color decisions to their purpose.'], ['Typography', 'A type scale supports hierarchy and readable content.'], ['Spacing', 'Shared spacing creates rhythm across screens.']]) {
    const card = node('article', 'studio-card'); card.append(node('h2', 'studio-card-title', heading), node('p', 'studio-card-text', text)); grid.append(card);
  }
  container.append(grid, link('Inspect design tokens →', 'design-tokens', 'studio-inline-link'));
}
function renderSettings(container: HTMLElement): void {
  pageHeading(container, 'PREFERENCES', 'Settings', 'Choose the appearance for this browser.');
  const card = node('div', 'studio-settings-card');
  card.append(node('h2', 'studio-card-title', 'Appearance'), node('p', 'studio-card-text', 'Use the Theme control in the top bar to choose Light, Dark, or System. System follows your device setting.'));
  container.append(card);
}
function renderPending(container: HTMLElement, page: string): void {
  pageHeading(container, 'WORKSPACE', page, 'This section is not available yet.');
  const note = node('div', 'studio-notice'); note.append(node('strong', '', 'Coming in a future milestone'), node('p', '', 'Explore the available sections while this workspace is being built.')); container.append(note);
}

let cleanup: Cleanup | undefined;
let routeVersion = 0;
async function renderRoute(focus = false): Promise<void> {
  const version = ++routeVersion;
  cleanup?.(); cleanup = undefined;
  const current = resolveRoute(location.hash);
  const route = routes.find(item => item.id === current);
  const name = route?.label ?? 'Page not found';
  main.dataset.workspace = current ?? 'unknown'; shell.dataset.workspace = current ?? 'unknown';
  const finishFocus = (): void => { if (focus) focusPageHeading(); };
  title.textContent = name; document.title = `${name} · PWA Design System Studio`;
  for (const item of document.querySelectorAll<HTMLAnchorElement>('[data-studio-nav] a[data-route]')) {
    if (item.dataset.route === current) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  }
  const page = node('div', 'studio-page'); main.replaceChildren(page);
  window.scrollTo({ top: 0, behavior: 'instant' }); resetScrollTools();
  announcement.textContent = name;
  if (!current) {
    pageHeading(page, 'WORKSPACE', 'Page not found', 'The requested Studio section does not exist.');
    page.append(link('Return to overview →', 'overview', 'studio-inline-link')); finishFocus(); return;
  }
  if (current === 'overview') { renderOverview(page); finishFocus(); return; }
  if (current === 'foundations') { renderFoundations(page); finishFocus(); return; }
  if (current === 'settings') { renderSettings(page); finishFocus(); return; }
  const loaders: Partial<Record<RouteId, () => Promise<(root: HTMLElement) => Cleanup>>> = {
    'design-tokens': async () => (await import('./features/tokens/index.js')).mountTokenEditor,
    'components': async () => (await import('./features/playground/index.js')).mountPlayground,
    'layout-playground': async () => (await import('./features/layout/index.js')).mountLayoutPlayground,
    'theme-builder': async () => (await import('./features/theme/index.js')).mountThemeBuilder,
    'accessibility-lab': async () => (await import('./features/accessibility/index.js')).mountAccessibilityLab,
    'documentation': async () => (await import('./features/documentation/index.js')).mountDocumentation,
    'ai-agent-rules': async () => (await import('./features/agent/index.js')).mountAgentRules
  };
  const load = loaders[current];
  if (!load) { renderPending(page, name); finishFocus(); return; }
  page.append(node('p', 'studio-loading', `Loading ${name}…`));
  try {
    const mount = await load();
    if (version !== routeVersion) return;
    page.replaceChildren(); cleanup = mount(page); finishFocus();
  } catch {
    if (version !== routeVersion) return;
    page.replaceChildren(); pageHeading(page, 'WORKSPACE', name, 'This section could not be loaded. Refresh the page to try again.'); finishFocus();
  }
}
let currentHash = location.hash;
window.addEventListener('beforeunload', event => {
  if (isDraftUnsafe()) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('hashchange', () => {
  if (isDraftUnsafe()) {
    history.replaceState(history.state, '', `${location.pathname}${location.search}${currentHash}`);
    reportUnsafeDraft();
    focusPageHeading();
    return;
  }
  currentHash = location.hash;
  if (drawer.open) { restoreDrawerFocus = false; drawer.close(); }
  void renderRoute(true);
});
void renderRoute();
