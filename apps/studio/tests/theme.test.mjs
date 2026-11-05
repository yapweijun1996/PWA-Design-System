import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const startup = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');

function start(saved, dark = false, blocked = false) {
  const dataset = {};
  runInNewContext(startup, {
    document: { documentElement: { dataset } },
    localStorage: { getItem: () => { if (blocked) throw new Error('unavailable'); return saved; } },
    matchMedia: () => ({ matches: dark })
  });
  return dataset;
}

describe('pre-paint theme initialization', () => {
  it('defaults to light independently of the system', () => {
    expect(start(null, true)).toEqual({ themePreference: 'light', theme: 'light' });
  });
  it('restores dark', () => {
    expect(start('dark')).toEqual({ themePreference: 'dark', theme: 'dark' });
  });
  it('resolves an explicit system preference', () => {
    expect(start('system', true)).toEqual({ themePreference: 'system', theme: 'dark' });
    expect(start('system', false)).toEqual({ themePreference: 'system', theme: 'light' });
  });
  it('ignores invalid values', () => {
    expect(start('invalid')).toEqual({ themePreference: 'light', theme: 'light' });
  });
  it('defaults safely when storage is unavailable', () => {
    expect(start(null, true, true)).toEqual({ themePreference: 'light', theme: 'light' });
  });
});
