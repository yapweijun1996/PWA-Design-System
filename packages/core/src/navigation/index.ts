import type { Component } from '../types.js';

let nextId = 0;
const id = (name: string): string => { let value: string; do { value = `ds-${name}-${++nextId}`; } while (document.getElementById(value)); return value; };
function requireLabel(value: string, name: string): void { if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be non-empty`); }

/** Tab labels and plain-text panel contents. The first tab is selected by default. */
export interface TabsOptions { label: string; tabs: ReadonlyArray<{ label: string; content: string }>; selectedIndex?: number; onChange?(index: number): void }
export interface Tabs extends Component<HTMLDivElement> { select(index: number): void }
/** Horizontal, automatically activated tabs with roving focus and Arrow/Home/End navigation. */
export function createTabs(options: TabsOptions): Tabs {
  requireLabel(options.label, 'Tab list label');
  if (options.onChange !== undefined && typeof options.onChange !== 'function') throw new TypeError('onChange must be a function');
  if (!options.tabs.length) throw new RangeError('Tabs require at least one tab');
  for (const tab of options.tabs) requireLabel(tab.label, 'Tab label');
  let selected = options.selectedIndex ?? 0;
  if (!Number.isInteger(selected) || selected < 0 || selected >= options.tabs.length) throw new RangeError('Invalid selected tab');
  const element = document.createElement('div'); element.className = 'ds-tabs';
  const controller = new AbortController();
  const list = document.createElement('div'); list.setAttribute('role', 'tablist'); list.setAttribute('aria-label', options.label);
  const buttons: HTMLButtonElement[] = []; const panels: HTMLDivElement[] = [];
  for (const tab of options.tabs) {
    const tabId = id('tab'), panelId = id('panel');
    const button = document.createElement('button'); button.type = 'button'; button.id = tabId; button.textContent = tab.label;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', panelId);
    const panel = document.createElement('div'); panel.id = panelId; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tabId); panel.tabIndex = 0; panel.textContent = tab.content;
    buttons.push(button); panels.push(panel); list.append(button);
  }
  const select = (index: number): void => {
    if (!Number.isInteger(index) || index < 0 || index >= buttons.length) throw new RangeError('Invalid selected tab');
    selected = index;
    buttons.forEach((button, i) => { button.tabIndex = i === selected ? 0 : -1; button.setAttribute('aria-selected', String(i === selected)); panels[i].hidden = i !== selected; });
  };
  const userSelect = (index: number): void => {
    const changed = index !== selected;
    select(index);
    if (changed) options.onChange?.(index);
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => userSelect(index), { signal: controller.signal });
    button.addEventListener('keydown', event => {
      let target = index;
      if (event.key === 'ArrowRight') target = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') target = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = buttons.length - 1;
      else return;
      event.preventDefault(); userSelect(target); buttons[target].focus();
    }, { signal: controller.signal });
  });
  element.append(list, ...panels); select(selected);
  return { element, select, destroy: () => controller.abort() };
}

export interface BreadcrumbItem { label: string; href?: string }
/** Breadcrumb links are HTTP(S) or relative; the final item represents the current page. */
export function createBreadcrumb(items: ReadonlyArray<BreadcrumbItem>, label = 'Breadcrumb'): Component<HTMLElement> {
  requireLabel(label, 'Breadcrumb label');
  if (!items.length) throw new RangeError('Breadcrumb requires at least one item');
  for (const item of items) requireLabel(item.label, 'Breadcrumb item label');
  const element = document.createElement('nav'); element.className = 'ds-breadcrumb'; element.setAttribute('aria-label', label);
  const list = document.createElement('ol');
  items.forEach((item, index) => {
    const li = document.createElement('li');
    if (index === items.length - 1) { const current = document.createElement('span'); current.textContent = item.label; current.setAttribute('aria-current', 'page'); li.append(current); }
    else {
      if (!item.href) throw new Error('Non-current breadcrumb items require an href');
      const href = new URL(item.href, document.baseURI);
      if (href.protocol !== 'http:' && href.protocol !== 'https:') throw new Error('Unsupported breadcrumb URL');
      const link = document.createElement('a'); link.href = href.href; link.textContent = item.label; li.append(link);
    }
    list.append(li);
  });
  element.append(list); return { element, destroy() {} };
}

export interface MenuItem { label: string; disabled?: boolean; onSelect(): void }
export interface MenuOptions { label: string; items: ReadonlyArray<MenuItem> }
/** Button menu supports Arrow keys, Home/End, Escape and Tab. Disabled items remain focusable. */
export function createMenu(options: MenuOptions): Component<HTMLDivElement> {
  requireLabel(options.label, 'Menu label');
  if (!options.items.length) throw new RangeError('Menu requires at least one item');
  for (const item of options.items) requireLabel(item.label, 'Menu item label');
  const element = document.createElement('div'); element.className = 'ds-menu';
  const controller = new AbortController();
  const trigger = document.createElement('button'); trigger.type = 'button'; trigger.textContent = options.label; trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div'); menu.id = id('menu'); menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', options.label); menu.hidden = true; trigger.setAttribute('aria-controls', menu.id);
  if (typeof menu.showPopover !== 'function' || typeof menu.hidePopover !== 'function') throw new Error('Menu requires browser support for the Popover API');
  menu.setAttribute('popover', 'manual');
  const items = options.items.map(item => {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'menuitem'); button.tabIndex = -1; button.textContent = item.label;
    if (item.disabled) button.setAttribute('aria-disabled', 'true');
    button.addEventListener('click', () => { if (!item.disabled) { close(true); item.onSelect(); } }, { signal: controller.signal }); menu.append(button); return button;
  });
  const enabled = (): HTMLButtonElement[] => items;
  let ownerDialog: HTMLDialogElement | null = null;
  const observer = new MutationObserver(() => { if (!element.isConnected || !trigger.isConnected) close(false); });
  const position = (): void => {
    if (menu.hidden) return;
    const anchor = trigger.getBoundingClientRect();
    const margin = (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 2;
    menu.style.minWidth = `${Math.min(anchor.width, Math.max(0, window.innerWidth - margin * 2))}px`;
    const bounds = menu.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - bounds.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - bounds.height - margin);
    const above = anchor.top - bounds.height;
    const preferred = anchor.bottom + bounds.height <= window.innerHeight - margin || above < margin ? anchor.bottom : above;
    menu.style.left = `${Math.min(Math.max(anchor.left, margin), maxLeft)}px`;
    menu.style.top = `${Math.min(Math.max(preferred, margin), maxTop)}px`;
  };
  const onDialogClose = (): void => close(false);
  const close = (restore: boolean): void => {
    if (!menu.hidden) { menu.hidePopover(); menu.hidden = true; }
    trigger.setAttribute('aria-expanded', 'false');
    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position, true);
    ownerDialog?.removeEventListener('close', onDialogClose);
    ownerDialog = null;
    observer.disconnect();
    if (restore && trigger.isConnected) trigger.focus();
  };
  const open = (last = false): void => {
    const available = enabled();
    if (!available.length || !menu.hidden) return;
    menu.hidden = false; menu.showPopover(); trigger.setAttribute('aria-expanded', 'true');
    ownerDialog = trigger.closest('dialog'); ownerDialog?.addEventListener('close', onDialogClose);
    observer.observe(document, { childList: true, subtree: true });
    position(); window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
    (last ? available[available.length - 1] : available[0]).focus();
  };
  trigger.addEventListener('click', () => { if (menu.hidden) open(); else close(false); }, { signal: controller.signal });
  trigger.addEventListener('keydown', event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(event.key === 'ArrowUp'); } }, { signal: controller.signal });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (event.key === 'Tab') { close(true); return; }
    const available = enabled(), current = available.indexOf(document.activeElement as HTMLButtonElement);
    let index = current;
    if (event.key === 'ArrowDown') index = (current + 1) % available.length;
    else if (event.key === 'ArrowUp') index = (current - 1 + available.length) % available.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = available.length - 1;
    else return;
    event.preventDefault(); available[index]?.focus();
  }, { signal: controller.signal });
  element.addEventListener('focusout', event => { if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) close(false); }, { signal: controller.signal });
  document.addEventListener('pointerdown', event => { if (!menu.hidden && event.target instanceof Node && !element.contains(event.target)) close(false); }, { signal: controller.signal });
  element.append(trigger, menu); return { element, destroy() { if (!menu.hidden) close(element.contains(document.activeElement)); controller.abort(); } };
}

export interface PaginationOptions { page: number; totalPages: number; onChange(page: number): void; label?: string }
export interface Pagination extends Component<HTMLElement> { setPage(page: number): void }
/** Previous/next controls. Pages are one-based; a change calls onChange. */
export function createPagination(options: PaginationOptions): Pagination {
  requireLabel(options.label ?? 'Pagination', 'Pagination label');
  if (!Number.isInteger(options.totalPages) || options.totalPages < 1) throw new RangeError('totalPages must be positive');
  const element = document.createElement('nav'); element.className = 'ds-pagination'; element.setAttribute('aria-label', options.label ?? 'Pagination');
  const controller = new AbortController();
  const previous = document.createElement('button'), next = document.createElement('button'), status = document.createElement('span');
  previous.type = next.type = 'button'; previous.textContent = 'Previous'; next.textContent = 'Next'; status.setAttribute('aria-live', 'polite');
  let page = options.page;
  const setPage = (value: number): void => { if (!Number.isInteger(value) || value < 1 || value > options.totalPages) throw new RangeError('Invalid page'); page = value; status.textContent = `Page ${page} of ${options.totalPages}`; previous.disabled = page === 1; next.disabled = page === options.totalPages; };
  previous.addEventListener('click', () => { setPage(page - 1); options.onChange(page); }, { signal: controller.signal });
  next.addEventListener('click', () => { setPage(page + 1); options.onChange(page); }, { signal: controller.signal });
  element.append(previous, status, next); setPage(page); return { element, setPage, destroy: () => controller.abort() };
}
