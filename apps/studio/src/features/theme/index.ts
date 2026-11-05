import { axes } from '../../../../../packages/tokens/src/engine.mjs';
import './styles.css';

type Axis = 'theme' | 'palette' | 'density' | 'kit';
const values: Record<Axis, readonly string[]> = {
  theme: ['light', 'dark', 'system'], palette: axes.palettes, density: axes.density, kit: axes.kits
};
const titles: Record<Axis, string> = { theme: 'Theme', palette: 'Palette', density: 'Density', kit: 'Visual kit' };

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}
function title(value: string): string { return value[0].toUpperCase() + value.slice(1); }

/** Mount appearance controls; persisted changes remain active after the page is unmounted. */
export function mountThemeBuilder(root: HTMLElement): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  const doc = document.documentElement;
  const shellTheme = document.querySelector<HTMLSelectElement>('#theme-select');
  if (!shellTheme) throw new Error('Studio theme selector is missing');
  const section = node('section'); section.className = 'theme-builder';
  const heading = node('h1', 'Theme Builder');
  const intro = node('p', 'Choose an appearance for this browser. Changes apply to the Studio and its live preview.'); intro.className = 'theme-builder__intro';
  const workspace = node('div'); workspace.className = 'theme-builder__workspace';
  const controls = node('div'); controls.className = 'theme-builder__controls';
  const headingControls = node('h2', 'Appearance');
  const status = node('p'); status.className = 'theme-builder__status'; status.setAttribute('role', 'status');
  controls.append(headingControls);
  const selects = new Map<Axis, HTMLSelectElement>();
  for (const axis of ['theme', 'palette', 'density', 'kit'] as const) {
    const label = node('label'); label.className = 'theme-builder__field';
    label.append(node('span', titles[axis]));
    const select = node('select'); select.name = `theme-builder-${axis}`;
    for (const value of values[axis]) { const option = node('option', title(value)); option.value = value; select.append(option); }
    label.append(select); controls.append(label); selects.set(axis, select);
    select.addEventListener('change', () => {
      const selected = select.value;
      if (!values[axis].includes(selected)) { sync(); status.textContent = 'Invalid appearance value; no change was made.'; return; }
      if (axis === 'theme') {
        shellTheme.value = selected;
        shellTheme.dispatchEvent(new Event('change', { bubbles: true }));
        status.textContent = document.querySelector<HTMLElement>('#preference-status')?.textContent ?? 'Theme changed.';
        return;
      }
      doc.dataset[axis] = selected;
      try { localStorage.setItem(`pwa-ds-${axis}`, selected); status.textContent = `${titles[axis]} saved for this browser.`; }
      catch { status.textContent = `${titles[axis]} changed for this page, but browser storage is unavailable.`; }
    }, { signal });
  }
  controls.append(status);
  const preview = node('section'); preview.className = 'theme-builder__preview'; preview.setAttribute('aria-label', 'Appearance preview');
  const label = node('p', 'LIVE PREVIEW'); label.className = 'theme-builder__eyebrow';
  const card = node('article'); card.className = 'theme-builder__card';
  const badge = node('span', 'Workspace'); badge.className = 'theme-builder__badge';
  const button = node('button', 'Example action'); button.type = 'button'; button.className = 'theme-builder__action';
  const sampleLabel = node('label', 'Example field'); sampleLabel.className = 'theme-builder__sample-field';
  const sampleInput = node('input'); sampleInput.placeholder = 'Type a value'; sampleLabel.append(sampleInput);
  card.append(badge, node('h3', 'Project overview'), node('p', 'Preview text, controls, spacing and surfaces using the current appearance.'), sampleLabel, button);
  preview.append(label, node('h2', 'Live preview'), card);
  const note = node('p', 'Committed token overrides remain active. Edit token values in ');
  const link = node('a', 'Design Tokens'); link.href = '#design-tokens'; note.append(link, '.'); preview.append(note);
  workspace.append(controls, preview); section.append(heading, intro, workspace); root.append(section);
  function sync(): void {
    const current: Record<Axis, string | undefined> = { theme: doc.dataset.themePreference, palette: doc.dataset.palette, density: doc.dataset.density, kit: doc.dataset.kit };
    for (const axis of ['theme', 'palette', 'density', 'kit'] as const) {
      const value = current[axis]; const select = selects.get(axis);
      if (select) select.value = value && values[axis].includes(value) ? value : values[axis][0];
    }
  }
  const observer = new MutationObserver(sync);
  observer.observe(doc, { attributes: true, attributeFilter: ['data-theme-preference', 'data-palette', 'data-density', 'data-kit'] });
  sync();
  return () => { observer.disconnect(); controller.abort(); section.remove(); };
}
