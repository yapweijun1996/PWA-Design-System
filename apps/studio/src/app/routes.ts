export const routes = [
  { id: 'overview', label: 'Overview' },
  { id: 'foundations', label: 'Foundations' },
  { id: 'design-tokens', label: 'Design Tokens' },
  { id: 'components', label: 'Components' },
  { id: 'layout-playground', label: 'Layout Playground' },
  { id: 'theme-builder', label: 'Theme Builder' },
  { id: 'accessibility-lab', label: 'Accessibility Lab' },
  { id: 'ai-agent-rules', label: 'AI Agent Rules' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'settings', label: 'Settings' }
] as const;

export type RouteId = typeof routes[number]['id'];

/** Unknown fragments remain unknown instead of silently routing to another page. */
export function resolveRoute(hash: string): RouteId | null {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  const alias = value === 'tokens' ? 'design-tokens' : value === 'appearance' ? 'settings' : value;
  if (!alias) return 'overview';
  return routes.find(route => route.id === alias)?.id ?? null;
}
