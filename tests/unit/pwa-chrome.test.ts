// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeSystemChrome } from '../../apps/studio/src/features/pwa/chrome';
import { emptyProject, projectJSON, validateProject } from '../../packages/tokens/src/engine.mjs';
import { sources } from '../../apps/studio/src/features/tokens/sources';

beforeEach(() => { vi.resetModules(); localStorage.clear(); document.head.replaceChildren(); document.documentElement.removeAttribute('style'); Object.assign(document.documentElement.dataset, { theme: 'dark', palette: 'blue', density: 'comfortable', kit: 'default' }); for (const name of ['theme-color', 'apple-mobile-web-app-status-bar-style']) { const meta = document.createElement('meta'); meta.name = name; document.head.append(meta); } });
afterEach(() => { document.head.replaceChildren(); document.documentElement.removeAttribute('style'); vi.restoreAllMocks(); });
describe('PWA system chrome', () => {
  it('uses the selected semantic surface before paint, including validated saved overrides', async () => {
    const project = emptyProject(); project.overrides.dark['color.surface'] = '#111827'; localStorage.setItem('pwa-ds-token-overrides-v1', projectJSON(project));
    await import('../../apps/studio/src/features/tokens/prepaint');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#111827'); expect(document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content')).toBe('black');
  });
  it('keeps malformed saved configuration out of both first-frame styles and system metadata', async () => {
    const bad = '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"color.surface":"#ffffff; background:url(https://example.invalid)"},"light":{},"dark":{}}}'; localStorage.setItem('pwa-ds-token-overrides-v1', bad);
    await import('../../apps/studio/src/features/tokens/prepaint'); const expected = validateProject(sources, emptyProject())['dark/blue/comfortable/default']['color.surface'];
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(expected); expect(document.getElementById('pwa-ds-prepaint-overrides')).toBeNull(); expect(localStorage.getItem('pwa-ds-token-overrides-v1')).toBe(bad);
  });
  it('updates supported chrome when resolved root tokens change and disconnects cleanly', async () => {
    document.documentElement.style.setProperty('--ds-color-surface', '#111827'); const destroy = initializeSystemChrome(); expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#111827');
    document.documentElement.dataset.theme = 'light'; document.documentElement.style.setProperty('--ds-color-surface', '#fafafa'); await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#fafafa'); expect(document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content')).toBe('default');
    destroy(); document.documentElement.style.setProperty('--ds-color-surface', '#ffffff'); await new Promise(resolve => setTimeout(resolve, 0)); expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#fafafa');
  });
});
