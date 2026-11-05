import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { getIcon, isApprovedIcon, approvedIcons } from '../../packages/icons/generated/index.js';
import { generateIcons, validateIconRegistry } from '../../scripts/icons.mjs';

const registry = JSON.parse(await readFile(new URL('../../packages/icons/approved-icons.json', import.meta.url), 'utf8'));
describe('approved text glyph registry', () => {
  it('resolves exactly the registry names and rejects unknown or inherited properties', async () => {
    await expect(generateIcons(true)).resolves.toEqual(registry);
    expect(Object.keys(approvedIcons)).toEqual(registry.icons.map(icon => icon.name));
    for (const { name, glyph } of registry.icons) { expect(isApprovedIcon(name)).toBe(true); expect(getIcon(name)).toBe(glyph); }
    for (const name of ['missing', '__proto__', 'constructor', '', null, 1]) { expect(isApprovedIcon(name)).toBe(false); expect(() => getIcon(name)).toThrow(/Unknown/); }
  });
  it('rejects invalid, duplicate, unsorted and unsafe entries', () => {
    expect(() => validateIconRegistry(registry)).not.toThrow();
    expect(() => validateIconRegistry({ version: 1, icons: [] })).toThrow();
    expect(() => validateIconRegistry({ ...registry, icons: [...registry.icons, registry.icons[0]] })).toThrow(/Duplicate/);
    expect(() => validateIconRegistry({ ...registry, icons: [...registry.icons].reverse() })).toThrow(/sorted/);
    for (const item of [{ name: 'constructor', glyph: '×', description: 'x' }, { name: 'valid', glyph: '<', description: 'x' }, { name: 'valid', glyph: 'xx', description: 'x' }, { name: 'valid', glyph: 'x', description: '\n' }]) expect(() => validateIconRegistry({ version: 1, icons: [item] })).toThrow();
  });
});
