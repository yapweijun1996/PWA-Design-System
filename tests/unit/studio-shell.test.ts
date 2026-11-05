import { describe, expect, it } from 'vitest';
import { resolveRoute, routes } from '../../apps/studio/src/app/routes.js';

describe('Studio routes', () => {
  it('provides the ten distinct requested sections', () => {
    expect(routes).toHaveLength(10);
    expect(new Set(routes.map(route => route.id)).size).toBe(10);
    for (const route of routes) expect(resolveRoute(`#${route.id}`)).toBe(route.id);
  });
  it('preserves earlier links and rejects unknown fragments', () => {
    expect(resolveRoute('')).toBe('overview');
    expect(resolveRoute('#tokens')).toBe('design-tokens');
    expect(resolveRoute('#appearance')).toBe('settings');
    expect(resolveRoute('#unknown')).toBeNull();
    expect(resolveRoute('#%')).toBeNull();
  });
});
