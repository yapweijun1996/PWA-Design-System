import { describe, expect, it } from 'vitest';
import { emptyProject, validateProject } from '../../packages/tokens/src/engine.mjs';
import { inspectReferences, referenceGraph } from '../../apps/studio/src/features/tokens/editor-utils';
import { sources } from '../../apps/studio/src/features/tokens/sources';
const light = { theme: 'light' as const, palette: 'blue', density: 'comfortable', kit: 'default' };
describe('token reference inspection', () => {
  it('distinguishes direct and transitive effects for each inherited theme scope', () => {
    const draft = emptyProject(); draft.overrides.global['color.link'] = '{semantic.color.primary}'; draft.overrides.light['color.focus'] = '{semantic.color.link}';
    const graph = referenceGraph(draft, light), primary = inspectReferences(graph, 'semantic.color.primary');
    expect(primary.direct).toEqual(['semantic.color.link']); expect(primary.indirect).toEqual(['semantic.color.focus']);
    expect(inspectReferences(graph, 'semantic.color.focus').chain).toEqual(['semantic.color.focus', 'semantic.color.link', 'semantic.color.primary', 'primitive.color.blue.base']);
    const dark = inspectReferences(referenceGraph(draft, { ...light, theme: 'dark' }), 'semantic.color.primary');
    expect(dark.direct).toEqual(['semantic.color.link']); expect(dark.indirect).toEqual([]);
    draft.overrides.light['color.link'] = '#123456';
    expect(inspectReferences(referenceGraph(draft, light), 'semantic.color.primary').direct).toEqual([]);
    expect(inspectReferences(referenceGraph(draft, light), 'semantic.color.link').chain).toEqual(['semantic.color.link']);
  });
  it('tracks palette, density and kit declarations without resolving their values', () => {
    const draft = emptyProject(); const appearance = { ...light, palette: 'emerald', density: 'compact', kit: 'minimal' };
    const graph = referenceGraph(draft, appearance), resolved = validateProject(sources, draft)['light/emerald/compact/minimal'];
    expect(inspectReferences(graph, 'semantic.color.primary').chain.at(-1)).toBe('primitive.color.emerald.base');
    expect(graph.edges.get('semantic.spacing.md')).toBe(sources.density.compact['spacing.md'].toString().slice(1, -1));
    expect(graph.edges.get('semantic.radius.card')).toBe(sources.kits.minimal['radius.card'].toString().slice(1, -1));
    expect(resolved['color.primary']).toBe(sources.primitives['color.emerald.base'].$value);
  });
  it('matches the authoritative resolver at primitive leaves in all 96 appearance combinations', () => {
    const draft = emptyProject(); draft.overrides.global['color.link'] = '{semantic.color.primary}'; draft.overrides.light['color.focus'] = '{semantic.color.link}'; draft.overrides.dark['color.primary'] = '{semantic.color.success}';
    const combinations = validateProject(sources, draft); expect(Object.keys(combinations)).toHaveLength(96); let compared = 0;
    for (const [name, resolved] of Object.entries(combinations)) {
      const [theme, palette, density, kit] = name.split('/'); if (theme !== 'light' && theme !== 'dark') throw new Error('Unexpected theme');
      const graph = referenceGraph(draft, { theme, palette, density, kit });
      for (const key of Object.keys(sources.semantics)) {
        const inspection = inspectReferences(graph, `semantic.${key}`); expect(inspection.issue).toBe(''); const leaf = inspection.chain.at(-1);
        if (!leaf?.startsWith('primitive.')) continue;
        const primitive = sources.primitives[leaf.slice('primitive.'.length)]; expect(primitive).toBeDefined();
        expect(resolved[key], `${name}: ${inspection.chain.join(' → ')}`).toBe(primitive.$value); compared++;
      }
    }
    expect(compared).toBeGreaterThan(960);
  });
  it('terminates on invalid cycles and missing references without reporting the root as its own dependent', () => {
    const draft = emptyProject(); draft.overrides.light['color.primary'] = '{semantic.color.link}'; draft.overrides.light['color.link'] = '{semantic.color.primary}';
    const circular = inspectReferences(referenceGraph(draft, light), 'semantic.color.primary');
    expect(circular.issue).toBe('Circular reference: semantic.color.primary'); expect(circular.chain).toHaveLength(3); expect(circular.direct).toEqual(['semantic.color.link']); expect(circular.indirect).toEqual([]);
    draft.overrides.light['color.link'] = '{primitive.color.missing}';
    expect(inspectReferences(referenceGraph(draft, light), 'semantic.color.primary').issue).toBe('Missing declaration: primitive.color.missing');
  });
});
