import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { generateBreakpoints } from '../../scripts/breakpoints.mjs';

describe('build-time breakpoint sources', () => {
  it('accepts the current literal media conditions', async () => {
    await expect(generateBreakpoints(true)).resolves.toBeUndefined();
  });
  it('rejects stale CSS and inconsistent source dimensions', async () => {
    const stale = async (path, encoding) => {
      const text = await readFile(path, encoding);
      return path.endsWith('/apps/studio/src/features/playground/playground.css') ? text.replace('max-width: 768px', 'max-width: 769px') : text;
    };
    await expect(generateBreakpoints(true, { read: stale })).rejects.toThrow(/stale/);
    const invalid = async (path, encoding) => {
      const text = await readFile(path, encoding);
      if (!path.endsWith('/packages/tokens/primitives.json')) return text;
      const values = JSON.parse(text); values['breakpoint.tablet'].$value = '100px'; return JSON.stringify(values);
    };
    await expect(generateBreakpoints(true, { read: invalid })).rejects.toThrow(/increase/);
  });
  it('generates changed media conditions from the JSON source', async () => {
    const modified = async (path, encoding) => {
      const text = await readFile(path, encoding);
      if (!path.endsWith('/packages/tokens/primitives.json')) return text;
      const values = JSON.parse(text); values['breakpoint.tablet'].$value = '800px'; return JSON.stringify(values);
    };
    const written = new Map(); await generateBreakpoints(false, { read: modified, write: async (path, text) => { written.set(path, text); } });
    const entry = [...written.entries()].find(([path]) => path.endsWith('/apps/studio/src/features/playground/playground.css'));
    expect(entry?.[1]).toContain('@media (max-width: 800px)');
  });

});
