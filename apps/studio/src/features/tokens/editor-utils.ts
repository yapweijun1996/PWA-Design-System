import type { ProjectTokens, TokenValue } from '../../../../../packages/tokens/src/engine.mjs';
import { sources } from './sources';
export type Scope = 'global' | 'light' | 'dark';
export type PreviewTheme = 'light' | 'dark';
export interface DraftChange { scope: Scope; key: string; before: TokenValue | undefined; after: TokenValue | undefined }
export const scopeNames: Record<Scope, string> = { global: 'All themes', light: 'Light only', dark: 'Dark only' };
export function draftChanges(before: ProjectTokens, after: ProjectTokens): DraftChange[] {
  const changes: DraftChange[] = [];
  for (const scope of ['global', 'light', 'dark'] as const) {
    const keys = new Set([...Object.keys(before.overrides[scope]), ...Object.keys(after.overrides[scope])]);
    for (const key of [...keys].sort()) if (before.overrides[scope][key] !== after.overrides[scope][key]) changes.push({ scope, key, before: before.overrides[scope][key], after: after.overrides[scope][key] });
  }
  return changes;
}
const colorPurposes: Record<string, string> = {
  background: 'Page canvas behind surfaces.', surface: 'Cards, inputs and other primary surfaces.', 'surface-alt': 'Inset and secondary surfaces.',
  text: 'Primary readable text.', 'text-muted': 'Secondary text and supporting descriptions.', 'border-subtle': 'Decorative boundaries between surfaces.',
  'border-control': 'Visible boundaries of interactive controls.', focus: 'Keyboard focus indicators.', primary: 'Primary actions and selected controls.',
  'primary-hover': 'Primary actions while hovered.', 'on-primary': 'Text placed on primary actions.', link: 'Links within content.',
  danger: 'Errors and destructive feedback.', success: 'Successful outcomes and feedback.', warning: 'Warnings and attention cues.'
};
export function tokenPurpose(key: string): string {
  if (key.startsWith('color.')) return colorPurposes[key.slice(6)] ?? 'Shared semantic color.';
  const descriptions: Record<string, string> = { font: 'Typography used by shared text and controls.', spacing: 'Space between and within interface elements.', radius: 'Corner shape of shared surfaces and controls.', shadow: 'Shadow treatment of shared surfaces.', elevation: 'Depth treatment of cards and overlays.', layer: 'Stacking order of shared interface layers.', motion: 'Timing and easing for interface feedback.', size: 'Shared control dimensions.', focus: 'Width or offset of keyboard focus indicators.' };
  return descriptions[key.split('.')[0]] ?? 'Shared semantic design value.';
}
/** Only direct declarations are listed; this is source inspection, not another resolver. */
export function directUses(key: string, draft: ProjectTokens): string[] {
  const alias = `{semantic.${key}}`;
  const result = Object.entries(sources.semantics).filter(([, definition]) => definition.$value === alias).map(([name]) => name);
  for (const scope of ['global', 'light', 'dark'] as const) for (const [name, value] of Object.entries(draft.overrides[scope])) if (value === alias) result.push(`${name} (${scopeNames[scope]} override)`);
  return result;
}

export interface ReferenceAppearance { theme: PreviewTheme; palette: string; density: string; kit: string }
export interface TokenReferenceGraph { edges: Map<string, string>; nodes: Set<string> }
/** Inspect declarations only, never resolve values. Layer order mirrors engine resolveProject. */
export function referenceGraph(draft: ProjectTokens, appearance: ReferenceAppearance): TokenReferenceGraph {
  const { theme, palette, density, kit } = appearance;
  const semantic = Object.fromEntries(Object.entries(sources.semantics).map(([name, token]) => [name, token.$value]));
  Object.assign(semantic, sources.themes[theme], sources.palettes[palette]?.[theme], sources.density[density], sources.kits[kit], draft.overrides.global, draft.overrides[theme]);
  const declarations = [...Object.entries(sources.primitives).map(([key, token]) => [`primitive.${key}`, token.$value] as const), ...Object.entries(semantic).map(([key, value]) => [`semantic.${key}`, value] as const)];
  const nodes = new Set(declarations.map(([key]) => key)), edges = new Map<string, string>();
  for (const [key, value] of declarations) {
    const alias = typeof value === 'string' ? /^\{((?:primitive|semantic)\.[a-z0-9]+(?:[-.][a-z0-9]+)*)\}$/.exec(value) : null;
    if (alias) edges.set(key, alias[1]);
  }
  return { edges, nodes };
}
export interface ReferenceInspection { chain: string[]; direct: string[]; indirect: string[]; issue: string }
export function inspectReferences(graph: TokenReferenceGraph, key: string): ReferenceInspection {
  const chain = [key], seen = new Set(chain); let issue = '';
  while (graph.edges.has(chain[chain.length - 1])) {
    const target = graph.edges.get(chain[chain.length - 1]); if (!target) break;
    chain.push(target);
    if (!graph.nodes.has(target)) { issue = `Missing declaration: ${target}`; break; }
    if (seen.has(target)) { issue = `Circular reference: ${target}`; break; }
    seen.add(target);
  }
  // Breadth-first reverse traversal reports each affected declaration once, even for invalid cyclic drafts.
  const visited = new Set([key]), queue = [key], direct: string[] = [], indirect: string[] = [];
  for (let index = 0; index < queue.length; index++) for (const [dependent, target] of graph.edges) {
    if (target !== queue[index] || visited.has(dependent)) continue;
    visited.add(dependent); queue.push(dependent); (index === 0 ? direct : indirect).push(dependent);
  }
  return { chain, direct: direct.sort(), indirect: indirect.sort(), issue };
}
