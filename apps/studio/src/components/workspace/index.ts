import primitiveText from '../../../../../packages/tokens/primitives.json?raw';
import './workspace.css';

export type WorkspacePanel = 'explorer' | 'canvas' | 'inspector';
export interface WorkspaceOptions { id: string; label: string; labels?: Partial<Record<WorkspacePanel, string>> }
export interface Workspace { element: HTMLElement; toolbar: HTMLElement; explorer: HTMLElement; canvas: HTMLElement; inspector: HTMLElement; showPanel(panel: WorkspacePanel, focus?: boolean): void; destroy(): void }
const primitives = JSON.parse(primitiveText) as Record<string, { $value: string }>;
const mobile = Number.parseInt(primitives['breakpoint.mobile'].$value, 10);
const desktop = Number.parseInt(primitives['breakpoint.desktop'].$value, 10);
const limits = { explorer: [220, 260], inspector: [280, 320] } as const;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] { const value = document.createElement(tag); value.className = className; value.textContent = text; return value; }

/** Studio-only pane layout. Component data and document scrolling remain consumer-owned. */
export function createWorkspace(options: WorkspaceOptions): Workspace {
  if (!/^[a-z][a-z0-9-]*$/.test(options.id) || !options.label.trim()) throw new TypeError('Workspace requires a stable ID and label');
  const controller = new AbortController(), { signal } = controller;
  const element = node('div', 'ws-workspace'); element.setAttribute('role', 'group'); element.setAttribute('aria-label', options.label);
  const toolbar = node('div', 'ws-toolbar'); toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', `${options.label} actions`);
  const nav = node('div', 'ws-panel-nav'); nav.setAttribute('role', 'group'); nav.setAttribute('aria-label', 'Workspace panels');
  const layout = node('div', 'ws-layout');
  const labels = { explorer: 'Explorer', canvas: 'Preview', inspector: 'Properties', ...options.labels };
  const panes = { explorer: node('section', 'ws-pane ws-explorer'), canvas: node('section', 'ws-pane ws-canvas'), inspector: node('section', 'ws-pane ws-inspector') };
  const buttons = {} as Record<WorkspacePanel, HTMLButtonElement>;
  let mode: 'wide' | 'compact' | 'phone' = 'phone', activePanel: WorkspacePanel = 'canvas', explorerOpen = false;
  const widths = { explorer: 240, inspector: 300 };
  let dragging: { side: 'explorer' | 'inspector'; start: number; width: number; pointer: number } | undefined;
  const handles = {} as Record<'explorer' | 'inspector', HTMLElement>;
  const storageKey = `pwa-ds-workspace-${options.id}`;
  try { const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null'); if (saved && typeof saved === 'object') for (const side of ['explorer', 'inspector'] as const) { const value = (saved as Record<string, unknown>)[side]; if (typeof value === 'number' && Number.isFinite(value)) widths[side] = clamp(value, limits[side][0], limits[side][1]); } } catch { /* Layout preferences are optional. */ }
  const save = (): void => { try { localStorage.setItem(storageKey, JSON.stringify(widths)); } catch { /* Editing remains available without storage. */ } };
  function applyWidths(): void {
    for (const side of ['explorer', 'inspector'] as const) { element.style.setProperty(`--ws-${side}-width`, `${widths[side]}px`); handles[side]?.setAttribute('aria-valuenow', String(widths[side])); handles[side]?.setAttribute('aria-valuetext', `${widths[side]} pixels`); }
  }
  function focusPane(panel: WorkspacePanel): void { const target = (panel === 'explorer' ? panes[panel].querySelector<HTMLElement>('input, select, button') : null) ?? panes[panel].querySelector<HTMLElement>('h2, h3, [tabindex="0"], input, button, select') ?? panes[panel]; if (!target.hasAttribute('tabindex') && /^H[23]$/.test(target.tagName)) target.tabIndex = -1; target.focus({ preventScroll: true }); }
  function sync(): void {
    const active = document.activeElement;
    const next = innerWidth < mobile ? 'phone' : innerWidth > desktop && (element.getBoundingClientRect().width || innerWidth - 300) >= limits.explorer[1] + limits.inspector[1] + 320 + 24 ? 'wide' : 'compact';
    if (next !== mode && next === 'phone') for (const panel of ['explorer', 'canvas', 'inspector'] as const) if (panes[panel].contains(active)) { activePanel = panel; explorerOpen = panel === 'explorer'; }
    if (next !== mode && next === 'compact' && panes.explorer.contains(active)) explorerOpen = true;
    mode = next; element.dataset.mode = mode;
    nav.hidden = mode === 'wide';
    if (nav.hidden && nav.contains(active)) focusPane('canvas');
    panes.explorer.hidden = mode === 'phone' ? activePanel !== 'explorer' : mode === 'compact' && !explorerOpen;
    panes.canvas.hidden = mode === 'phone' && activePanel !== 'canvas'; panes.inspector.hidden = mode === 'phone' && activePanel !== 'inspector';
    for (const panel of ['explorer', 'canvas', 'inspector'] as const) { buttons[panel].hidden = mode === 'compact' && panel !== 'explorer'; buttons[panel].setAttribute('aria-pressed', String(mode === 'phone' ? activePanel === panel : panel === 'explorer' && explorerOpen)); }
    buttons.explorer.setAttribute('aria-expanded', String(!panes.explorer.hidden));
    for (const side of ['explorer', 'inspector'] as const) handles[side].hidden = mode !== 'wide';
    if (active instanceof HTMLElement && active !== document.body && active.closest('[hidden]') && element.contains(active)) focusPane(activePanel === 'explorer' ? 'canvas' : activePanel);
  }
  function showPanel(panel: WorkspacePanel, focus = false): void { activePanel = panel; explorerOpen = panel === 'explorer'; sync(); if (focus) focusPane(panel); }
  for (const panel of ['explorer', 'canvas', 'inspector'] as const) {
    const pane = panes[panel]; pane.id = `${options.id}-${panel}`; pane.tabIndex = -1; pane.setAttribute('aria-label', labels[panel]);
    const button = node('button', 'ws-panel-button', labels[panel]); button.type = 'button'; button.setAttribute('aria-controls', pane.id); buttons[panel] = button; nav.append(button);
    button.addEventListener('click', () => { if (panel === 'explorer' && mode === 'compact' && explorerOpen) { explorerOpen = false; activePanel = 'canvas'; sync(); } else showPanel(panel, panel === 'explorer'); }, { signal });
  }
  for (const side of ['explorer', 'inspector'] as const) {
    const handle = node('div', 'ws-splitter'); handles[side] = handle; handle.tabIndex = 0; handle.setAttribute('role', 'separator'); handle.setAttribute('aria-orientation', 'vertical'); handle.setAttribute('aria-label', `Resize ${labels[side]}`); handle.setAttribute('aria-controls', panes[side].id); handle.setAttribute('aria-valuemin', String(limits[side][0])); handle.setAttribute('aria-valuemax', String(limits[side][1]));
    handle.addEventListener('keydown', event => { let value = widths[side]; if (event.key === 'Home') value = limits[side][0]; else if (event.key === 'End') value = limits[side][1]; else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') value += (event.key === 'ArrowRight' ? 8 : -8) * (side === 'explorer' ? 1 : -1); else return; event.preventDefault(); widths[side] = clamp(value, limits[side][0], limits[side][1]); applyWidths(); save(); }, { signal });
    handle.addEventListener('pointerdown', event => { if (event.button !== 0 || mode !== 'wide') return; event.preventDefault(); dragging = { side, start: event.clientX, width: widths[side], pointer: event.pointerId }; handle.focus(); handle.setPointerCapture?.(event.pointerId); element.dataset.resizing = 'true'; }, { signal });
  }
  window.addEventListener('pointermove', event => { if (!dragging || dragging.pointer !== event.pointerId) return; widths[dragging.side] = clamp(dragging.width + (event.clientX - dragging.start) * (dragging.side === 'explorer' ? 1 : -1), limits[dragging.side][0], limits[dragging.side][1]); applyWidths(); }, { signal });
  const stopDrag = (): void => { if (dragging) { dragging = undefined; delete element.dataset.resizing; save(); } };
  window.addEventListener('pointerup', stopDrag, { signal }); window.addEventListener('pointercancel', stopDrag, { signal });
  panes.explorer.addEventListener('keydown', event => { if (event.key === 'Escape' && mode !== 'wide') { event.preventDefault(); activePanel = 'canvas'; explorerOpen = false; sync(); buttons.explorer.focus(); } }, { signal });
  layout.append(panes.explorer, handles.explorer, panes.canvas, handles.inspector, panes.inspector); element.append(toolbar, nav, layout);
  window.addEventListener('resize', sync, { signal });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(sync) : undefined; observer?.observe(element);
  applyWidths(); sync();
  return { element, toolbar, ...panes, showPanel, destroy: () => { stopDrag(); observer?.disconnect(); controller.abort(); element.remove(); } };
}
