import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { compile, readSources } from '../../scripts/tokens.mjs';

let sources;
beforeAll(async () => { sources = await readSources(); });
const copy = () => structuredClone(sources);
function ratio(a, b) {
  const luminance = color => {
    const channels = color.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe('token compiler', () => {
  it('produces deterministic, current generated artifacts for all 96 combinations', async () => {
    const first = compile(sources), second = compile(copy());
    expect(first).toEqual(second);
    for (const [name, value] of Object.entries(first)) expect(await readFile(new URL(`../../packages/tokens/generated/${name}`, import.meta.url), 'utf8')).toBe(value);
    expect(Object.keys(JSON.parse(first['tokens.json']).combinations)).toHaveLength(96);
  });
  it('enforces typed resolution and rejects missing references and cycles', () => {
    const missing = copy(); missing.semantics['color.text'].$value = '{primitive.color.missing}';
    expect(() => compile(missing)).toThrow(/Missing reference/);
    const cycle = copy(); cycle.semantics['color.text'].$value = '{semantic.color.background}'; cycle.semantics['color.background'].$value = '{semantic.color.text}';
    expect(() => compile(cycle)).toThrow(/Circular alias/);
    const mismatch = copy(); mismatch.semantics['color.text'].$value = '{primitive.space.1}';
    expect(() => compile(mismatch)).toThrow(/Type mismatch/);
    const inverted = copy(); inverted.primitives['color.white'].$value = '{semantic.color.text}';
    expect(() => compile(inverted)).toThrow(/Primitive cannot reference semantic/);
  });
  it('rejects collisions, dangerous keys, malformed values and unapproved overrides', () => {
    const collision = copy(); collision.semantics['color.surface.alt'] = { $type: 'color', $value: '#ffffff' };
    expect(() => compile(collision)).toThrow(/CSS name collision/);
    const unsafe = copy(); Object.defineProperty(unsafe.primitives, '__proto__', { value: {}, enumerable: true });
    expect(() => compile(unsafe)).toThrow(/forbidden key/);
    const injection = copy(); injection.primitives['color.white'].$value = '#ffffff; background:url(https://example.com)';
    expect(() => compile(injection)).toThrow(/Invalid value/);
    const override = copy(); override.palettes.blue.light['color.background'] = '#ffffff';
    expect(() => compile(override)).toThrow(/Invalid override/);
    const missing = copy(); delete missing.palettes.blue.light['color.focus'];
    expect(() => compile(missing)).toThrow(/Incomplete palette/);
  });
  it('preserves semantic aliases as CSS references across axis overrides', () => {
    const input = copy(); input.semantics['color.alias'] = { $type: 'color', $value: '{semantic.color.primary}' };
    const result = compile(input);
    expect(result['tokens.css']).toContain('--ds-color-alias: var(--ds-color-primary);');
    const variants = JSON.parse(result['tokens.json']).combinations;
    expect(variants['light/emerald/compact/minimal']['color.alias']).toBe(variants['light/emerald/compact/minimal']['color.primary']);
    expect(variants['light/rose/compact/minimal']['color.alias']).not.toBe(variants['light/emerald/compact/minimal']['color.alias']);
  });
  it('checks representative text, focus and control contrasts in every supported combination', () => {
    const variants = JSON.parse(compile(sources)['tokens.json']).combinations;
    const pairs = [['color.text', 'color.background', 4.5], ['color.text', 'color.surface', 4.5], ['color.text-muted', 'color.surface', 4.5], ['color.link', 'color.surface', 4.5], ['color.on-primary', 'color.primary', 4.5], ['color.focus', 'color.surface', 3], ['color.border-control', 'color.surface', 3]];
    for (const [name, v] of Object.entries(variants)) for (const [a, b, threshold] of pairs) expect(ratio(v[a], v[b]), `${name}: ${a} on ${b}`).toBeGreaterThanOrEqual(threshold);
  });
});
