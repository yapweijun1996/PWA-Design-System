/** Construct a portable contract from the canonical component registry and rule data. */
export function createDesignContract(registry, rules, core, tokens, axes, iconRegistry, iconPackage) {
  return {
    schema: 'pwa-design-system/agent-design-contract', version: 1, project: 'PWA-Design-System',
    packages: {
      core: { name: core.name, version: core.version, private: core.private },
      tokens: { name: tokens.name, version: tokens.version, private: tokens.private }
    },
    tokens: { source: 'packages/tokens/', cssExport: '@pwa-design-system/tokens/tokens.css', axes },
    ...(iconRegistry && iconPackage ? { icons: { source: 'packages/icons/approved-icons.json', package: iconPackage.name, version: iconPackage.version, approved: iconRegistry.icons } } : {}),
    components: registry.components.map(component => ({
      family: component.family, factory: component.factory, entry: component.entry, optionType: component.optionType,
      keyboard: component.keyboard, states: component.states, apiNotes: component.apiNotes,
      properties: component.properties.map(({ name, type, required, defaultValue }) => ({ name, type, required, defaultValue }))
    })),
    rules: rules.rules
  };
}
/** Compare data independent of object key order; arrays preserve their documented order. */
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
