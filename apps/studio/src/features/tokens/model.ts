import { axes, emptyProject, parseProject, parseStoredProject, projectJSON, validateProject, type ProjectTokens, type TokenCombinations, type TokenMap } from '../../../../../packages/tokens/src/engine.mjs';
import { sources } from './sources';

const storageKey = 'pwa-ds-token-overrides-v1';
let committed = emptyProject();
let committedValues = validateProject(sources, committed);
let storageNotice = '';
let observer: MutationObserver | undefined;
const originals = new Map<string, { value: string; priority: string }>();
const lastApplied = new Map<string, string>();

export function currentCombination(values: TokenCombinations): TokenMap {
  const data = document.documentElement.dataset;
  const theme = axes.themes.includes(data.theme ?? '') ? data.theme : 'light';
  const palette = axes.palettes.includes(data.palette ?? '') ? data.palette : 'blue';
  const density = axes.density.includes(data.density ?? '') ? data.density : 'comfortable';
  const kit = axes.kits.includes(data.kit ?? '') ? data.kit : 'default';
  return values[`${theme}/${palette}/${density}/${kit}`];
}
export function setTokenMap(target: HTMLElement, values: TokenMap): void {
  for (const [name, value] of Object.entries(values)) target.style.setProperty(`--ds-${name.replaceAll('.', '-')}`, String(value));
}
function clearOwnedRootStyles(): void {
  const style = document.documentElement.style;
  for (const [name, previous] of originals) {
    if (style.getPropertyValue(name) !== lastApplied.get(name)) continue;
    if (previous.value) style.setProperty(name, previous.value, previous.priority); else style.removeProperty(name);
  }
  originals.clear(); lastApplied.clear();
}
function applyCommitted(): void {
  if (!Object.values(committed.overrides).some(overrides => Object.keys(overrides).length)) { clearOwnedRootStyles(); return; }
  const style = document.documentElement.style;
  for (const [key, value] of Object.entries(currentCombination(committedValues))) {
    const name = `--ds-${key.replaceAll('.', '-')}`;
    if (!originals.has(name)) originals.set(name, { value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) });
    style.setProperty(name, String(value)); lastApplied.set(name, String(value));
  }
}
export function initializeTokenOverrides(): () => void {
  if (observer) return () => {};
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const parsed = parseStoredProject(sources, stored);
      if (contrastFailures(parsed.combinations).length) throw new Error('Stored overrides do not meet required contrast');
      committed = parsed.project; committedValues = parsed.combinations;
      if (parsed.removedBreakpoints.length) storageNotice = `Legacy breakpoint overrides are no longer applied: ${parsed.removedBreakpoints.join(', ')}. Other saved overrides remain active; commit to save the migrated configuration.`;
    }
  } catch {
    // The blocking bootstrap may have read a valid configuration before storage
    // became unavailable. Revalidate its data, never its CSS, before reuse.
    const bootstrap = document.getElementById('pwa-ds-prepaint-overrides');
    try {
      const text = bootstrap?.dataset.tokenConfig;
      if (text) {
        const parsed = parseProject(sources, text);
        if (contrastFailures(parsed.combinations).length) throw new Error('Stored overrides do not meet required contrast');
        committed = parsed.project; committedValues = parsed.combinations;
      }
    } catch { /* Keep the existing in-memory configuration. */ }
    storageNotice = bootstrap?.dataset.legacyBreakpoints === 'true'
      ? 'Browser storage is unavailable. Legacy breakpoint overrides are no longer applied; other validated overrides remain active for this page.'
      : 'Saved token overrides could not be loaded; existing tokens remain active.';
  }
  applyCommitted();
  document.getElementById('pwa-ds-prepaint-overrides')?.remove();
  observer = new MutationObserver(() => applyCommitted());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-density', 'data-kit'] });
  return () => { observer?.disconnect(); observer = undefined; clearOwnedRootStyles(); };
}
export function getCommitted(): ProjectTokens { return structuredClone(committed); }
export function getStorageNotice(): string { return storageNotice; }
export function commitProject(project: ProjectTokens): void {
  const values = validateProject(sources, project);
  if (contrastFailures(values).length) throw new Error('Token overrides fail representative contrast checks');
  // Storage must succeed before the applied or in-memory configuration changes.
  localStorage.setItem(storageKey, projectJSON(project));
  committed = structuredClone(project); committedValues = values; storageNotice = ''; applyCommitted();
}
export function contrastFailures(combinations: TokenCombinations): string[] {
  // These pairs are used by current Studio and core styles. Hosts may add
  // other contexts; this is not a WCAG conformance assessment.
  const surfaces = ['color.background', 'color.surface', 'color.surface-alt'];
  const pairs: [string, string, number][] = [
    ...['color.text', 'color.text-muted', 'color.link', 'color.danger'].flatMap(foreground => surfaces.map(background => [foreground, background, 4.5] as [string, string, number])),
    ['color.success', 'color.surface-alt', 4.5],
    ['color.on-primary', 'color.primary', 4.5], ['color.on-primary', 'color.primary-hover', 4.5],
    ...['color.focus', 'color.border-control'].flatMap(foreground => surfaces.map(background => [foreground, background, 3] as [string, string, number]))
  ];
  const lum = (color: string): number => {
    const rgb = color.slice(1).match(/../g);
    if (rgb?.length !== 3) throw new Error('Contrast requires resolved colors');
    const channels = rgb.map(x => Number.parseInt(x, 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const failures = new Set<string>();
  for (const values of Object.values(combinations)) for (const [foreground, background, minimum] of pairs) {
    const a = lum(String(values[foreground])), b = lum(String(values[background]));
    if ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) < minimum) failures.add(`${foreground} / ${background} requires ${minimum}:1`);
  }
  return [...failures];
}
