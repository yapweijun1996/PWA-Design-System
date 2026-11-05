// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountThemeBuilder } from '../../apps/studio/src/features/theme/index';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); document.body.replaceChildren(); document.documentElement.removeAttribute('data-palette'); document.documentElement.removeAttribute('data-theme-preference'); });
describe('theme builder', () => {
  it('synchronizes the shell selector, rejects invalid inputs and releases its controls', async () => {
    const shell = document.createElement('select'); shell.id = 'theme-select';
    shell.innerHTML = '<option>light</option><option>dark</option><option>system</option>';
    document.body.append(shell); document.body.insertAdjacentHTML('beforeend', '<p id="preference-status"></p><main></main>');
    shell.addEventListener('change', () => { document.documentElement.dataset.themePreference = shell.value; });
    document.documentElement.dataset.themePreference = 'light';
    const root = document.querySelector('main'); if (!root) throw new Error('Missing root');
    const destroy = mountThemeBuilder(root);
    const theme = root.querySelector<HTMLSelectElement>('[name="theme-builder-theme"]');
    const palette = root.querySelector<HTMLSelectElement>('[name="theme-builder-palette"]');
    if (!theme || !palette) throw new Error('Missing controls');
    theme.value = 'dark'; theme.dispatchEvent(new Event('change')); expect(shell.value).toBe('dark');
    document.documentElement.dataset.themePreference = 'system'; await Promise.resolve(); expect(theme.value).toBe('system');
    palette.value = 'rose'; palette.dispatchEvent(new Event('change')); expect(localStorage.getItem('pwa-ds-palette')).toBe('rose');
    palette.value = 'not-an-option'; palette.dispatchEvent(new Event('change')); expect(document.documentElement.dataset.palette).toBe('rose');
    destroy(); palette.value = 'teal'; palette.dispatchEvent(new Event('change')); expect(document.documentElement.dataset.palette).toBe('rose');
    expect(root.childElementCount).toBe(0);
  });
  it('reports failed persistence while retaining the current-page appearance', () => {
    document.body.innerHTML = '<select id="theme-select"></select><main></main>';
    const root = document.querySelector('main'); if (!root) throw new Error('Missing root');
    const destroy = mountThemeBuilder(root);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const density = root.querySelector<HTMLSelectElement>('[name="theme-builder-density"]'); if (!density) throw new Error('Missing control');
    density.value = 'compact'; density.dispatchEvent(new Event('change'));
    expect(document.documentElement.dataset.density).toBe('compact'); expect(root.textContent).toContain('browser storage is unavailable');
    destroy(); document.documentElement.removeAttribute('data-density');
  });
});
