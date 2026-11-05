import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { axes } from '../../../packages/tokens/src/engine.mjs';

const startup = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
function start(saved = {}, dark = false, blocked = false) {
  const dataset = {};
  runInNewContext(startup, {
    document: { documentElement: { dataset } },
    localStorage: { getItem: key => { if (blocked) throw new Error('unavailable'); return saved[key] ?? null; } },
    matchMedia: () => ({ matches: dark })
  });
  return dataset;
}
function acceptedChoices(code = startup) {
  const captured = [];
  // Instrument the actual membership checks, so removed values cannot remain
  // silently accepted even if they no longer appear in the authoritative axes.
  const instrument = `const originalIncludes = Array.prototype.includes;
    Array.prototype.includes = function(value) {
      captured.push([...this]);
      return originalIncludes.call(this, value);
    };\n`;
  runInNewContext(instrument + code, {
    captured,
    document: { documentElement: { dataset: {} } },
    localStorage: { getItem: () => '__unknown__' },
    matchMedia: () => ({ matches: false })
  });
  return captured.map(values => Array.from(values));
}
const defaults = { themePreference: 'light', theme: 'light', palette: 'blue', density: 'comfortable', kit: 'default' };
describe('pre-paint appearance initialization', () => {
  it('defaults to light independently of the system and safely handles unavailable storage', () => {
    expect(start({}, true)).toEqual(defaults);
    expect(start({}, true, true)).toEqual(defaults);
  });
  it('resolves an explicit system preference and rejects corrupted values independently', () => {
    expect(start({ 'pwa-ds-theme': 'system' }, true)).toEqual({ ...defaults, themePreference: 'system', theme: 'dark' });
    expect(start({ 'pwa-ds-theme': 'dark', 'pwa-ds-palette': 'bad', 'pwa-ds-density': 'compact', 'pwa-ds-kit': '__proto__' })).toEqual({ ...defaults, themePreference: 'dark', theme: 'dark', density: 'compact' });
  });
  it('accepts every authoritative token-axis value before paint', () => {
    for (const theme of axes.themes) for (const palette of axes.palettes) for (const density of axes.density) for (const kit of axes.kits) {
      const actual = start({ 'pwa-ds-theme': theme, 'pwa-ds-palette': palette, 'pwa-ds-density': density, 'pwa-ds-kit': kit });
      expect(actual).toEqual({ themePreference: theme, theme, palette, density, kit });
    }
  });
  it('accepts exactly the authoritative values, including system only for theme preference', () => {
    const expected = [[...axes.themes, 'system'], axes.palettes, axes.density, axes.kits];
    const actual = acceptedChoices();
    expect(actual).toHaveLength(expected.length);
    for (let index = 0; index < expected.length; index++) {
      expect(actual[index].sort()).toEqual([...expected[index]].sort());
    }
  });
  it('detects an obsolete accepted value even when it is absent from the token engine', () => {
    const changed = startup.replace("'indigo',", "'indigo', 'obsolete-palette',");
    expect(changed).not.toBe(startup);
    expect(acceptedChoices(changed)[1].sort()).not.toEqual([...axes.palettes].sort());
  });
});
