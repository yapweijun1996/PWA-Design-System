// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import primitiveText from '../../packages/tokens/primitives.json?raw';
import { createWorkspace } from '../../apps/studio/src/components/workspace';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.doUnmock('../../packages/tokens/primitives.json?raw'); localStorage.clear(); });
function viewport(width: number): void { Object.defineProperty(window, 'innerWidth', { configurable: true, value: width }); window.dispatchEvent(new Event('resize')); }
describe('Studio workspace', () => {
  it('resizes approved pane bounds by keyboard and retains bounded layout preferences', () => {
    viewport(1440); const ws = createWorkspace({ id: 'test', label: 'Test workspace' }); document.body.append(ws.element);
    const splitter = ws.element.querySelector<HTMLElement>('[aria-label="Resize Explorer"]'); if (!splitter) throw new Error('Missing splitter');
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); expect(splitter.getAttribute('aria-valuenow')).toBe('260');
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); expect(splitter.getAttribute('aria-valuenow')).toBe('260');
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })); expect(splitter.getAttribute('aria-valuenow')).toBe('220');
    ws.destroy(); const restored = createWorkspace({ id: 'test', label: 'Restored' }); expect(restored.element.style.getPropertyValue('--ws-explorer-width')).toBe('220px'); restored.destroy();
  });
  it('reveals the focused inspector on narrowing and preserves field identity and value', () => {
    viewport(1440); const ws = createWorkspace({ id: 'focus', label: 'Focus workspace' }); const input = document.createElement('input'); input.value = 'Retained'; ws.inspector.append(input); document.body.append(ws.element); input.focus(); viewport(390);
    expect(ws.inspector.hidden).toBe(false); expect(ws.canvas.hidden).toBe(true); expect(document.activeElement).toBe(input); expect(input.value).toBe('Retained');
    ws.showPanel('explorer'); expect(ws.explorer.hidden).toBe(false); ws.explorer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); expect(ws.canvas.hidden).toBe(false); expect(document.activeElement?.textContent).toBe('Explorer');
    ws.destroy(); viewport(1440); expect(document.body.children).toHaveLength(0);
  });
  it('provides synchronized non-drag size controls and tolerates unavailable persistence', () => {
    viewport(1440); const ws = createWorkspace({ id: 'controls', label: 'Controls' }); document.body.append(ws.element); ws.toolbar.replaceChildren(document.createElement('button')); expect(ws.element.querySelector('.ws-sizes')).not.toBeNull(); const input = ws.element.querySelector<HTMLInputElement>('#controls-explorer-width'); if (!input) throw new Error('Width input missing');
    input.value = '999'; input.dispatchEvent(new Event('change')); expect(input.value).toBe('260'); expect(ws.element.querySelector('[aria-label="Resize Explorer"]')?.getAttribute('aria-valuenow')).toBe('260');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); }); ws.element.querySelector<HTMLButtonElement>('[aria-label="Decrease Explorer width"]')?.click(); expect(input.value).toBe('252');
    input.focus(); viewport(390); expect(ws.canvas.hidden).toBe(false); expect(document.activeElement).toBe(ws.canvas); ws.destroy();
  });
  it('stops a pointer resize when the viewport switches away from wide layout', () => {
    viewport(1440); const ws = createWorkspace({ id: 'drag', label: 'Drag' }); document.body.append(ws.element); const handle = ws.element.querySelector<HTMLElement>('[aria-label="Resize Explorer"]'); if (!handle) throw new Error('Handle missing');
    handle.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { button: 0, clientX: 100, bubbles: true }), { pointerId: 7 })); window.dispatchEvent(Object.assign(new MouseEvent('pointermove', { clientX: 120 }), { pointerId: 7 })); expect(handle.getAttribute('aria-valuenow')).toBe('260');
    viewport(390); expect(ws.element.dataset.resizing).toBeUndefined(); window.dispatchEvent(Object.assign(new MouseEvent('pointermove', { clientX: 80 }), { pointerId: 7 })); expect(handle.getAttribute('aria-valuenow')).toBe('260'); ws.destroy();
  });
  it('derives responsive decisions from changed authoritative breakpoint values', async () => {
    const fixture = JSON.parse(primitiveText); fixture['breakpoint.mobile'].$value = '800px'; fixture['breakpoint.tablet'].$value = '900px'; fixture['breakpoint.preview'].$value = '1000px'; fixture['breakpoint.desktop'].$value = '1600px';
    vi.resetModules(); vi.doMock('../../packages/tokens/primitives.json?raw', () => ({ default: JSON.stringify(fixture) })); const changed = await import('../../apps/studio/src/components/workspace');
    viewport(790); const ws = changed.createWorkspace({ id: 'source', label: 'Source' }); document.body.append(ws.element); expect(ws.element.dataset.mode).toBe('phone'); viewport(1440); expect(ws.element.dataset.mode).toBe('compact'); viewport(1700); expect(ws.element.dataset.mode).toBe('wide'); ws.destroy();
  });
  it('rejects invalid identity and clamps untrusted saved pane dimensions', () => {
    expect(() => createWorkspace({ id: '../bad', label: 'Bad' })).toThrow(); localStorage.setItem('pwa-ds-workspace-safe', '{"explorer":999999,"inspector":-20}'); const ws = createWorkspace({ id: 'safe', label: 'Safe' }); expect(ws.element.style.getPropertyValue('--ws-explorer-width')).toBe('260px'); expect(ws.element.style.getPropertyValue('--ws-inspector-width')).toBe('280px'); ws.destroy();
  });
});
