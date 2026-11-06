// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorkspace } from '../../apps/studio/src/components/workspace';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); localStorage.clear(); });
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
  it('rejects invalid identity and clamps untrusted saved pane dimensions', () => {
    expect(() => createWorkspace({ id: '../bad', label: 'Bad' })).toThrow(); localStorage.setItem('pwa-ds-workspace-safe', '{"explorer":999999,"inspector":-20}'); const ws = createWorkspace({ id: 'safe', label: 'Safe' }); expect(ws.element.style.getPropertyValue('--ws-explorer-width')).toBe('260px'); expect(ws.element.style.getPropertyValue('--ws-inspector-width')).toBe('280px'); ws.destroy();
  });
});
