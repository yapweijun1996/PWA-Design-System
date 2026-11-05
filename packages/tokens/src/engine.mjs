export const axes = Object.freeze({ themes: ['light', 'dark'], palettes: ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate'], density: ['comfortable', 'compact'], kits: ['default', 'minimal', 'enterprise'] });
const keyPattern = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/;
const refPattern = /^\{(primitive|semantic)\.([a-z0-9]+(?:[-.][a-z0-9]+)*)\}$/;
const dangerous = new Set(['__proto__', 'prototype', 'constructor']);
const types = new Set(['color', 'dimension', 'duration', 'number', 'fontFamily', 'shadow', 'easing']);
function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be an object`);
  for (const k of Object.keys(value)) if (dangerous.has(k) || k.split(/[.-]/).some(part => dangerous.has(part))) throw new Error(`${label} contains forbidden key`);
}
function keys(value, expected, label) {
  object(value, label);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) throw new Error(`${label} must have exactly: ${expected.join(', ')}`);
}
function validLiteral(type, value) {
  switch (type) {
    case 'color': return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
    case 'dimension': { const match = typeof value === 'string' ? value.match(/^(0|[1-9]\d*)(?:\.\d+)?(px|rem)$/) : null; return Boolean(match && Number.parseFloat(value) <= (match[2] === 'rem' ? 128 : 4096)); }
    case 'duration': return typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?ms$/.test(value) && Number.parseFloat(value) <= 10000;
    case 'number': return Number.isInteger(value) && value >= 0 && value <= 10000;
    case 'fontFamily': return typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9 -]*(?:,\s*[a-zA-Z][a-zA-Z0-9 -]*)*$/.test(value);
    case 'shadow': { if (value === 'none') return true; const match = typeof value === 'string' ? value.match(/^0 (0|[1-9]\d*)px (0|[1-9]\d*)px #[0-9a-fA-F]{8}$/) : null; return Boolean(match && Number(match[1]) <= 512 && Number(match[2]) <= 512); }
    case 'easing': return ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(value);
    default: return false;
  }
}
function validateDefinitions(defs, label) {
  object(defs, label);
  if (!Object.keys(defs).length) throw new Error(`${label} cannot be empty`);
  for (const [key, def] of Object.entries(defs)) {
    if (!keyPattern.test(key) || key.length > 100) throw new Error(`Invalid token key ${key}`);
    keys(def, ['$type', '$value'], `${label}.${key}`);
    if (!types.has(def.$type)) throw new Error(`Invalid type for ${key}`);
    if (label === 'primitives' && typeof def.$value === 'string' && def.$value.startsWith('{semantic.')) throw new Error(`Primitive cannot reference semantic token: ${key}`);
    if (!(typeof def.$value === 'string' && refPattern.test(def.$value)) && !validLiteral(def.$type, def.$value)) throw new Error(`Invalid value for ${key}`);
  }
}
function validateOverrides(overrides, semantics, label, permitted) {
  object(overrides, label);
  for (const [key, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(semantics, key) || !permitted.has(key)) throw new Error(`Invalid override ${label}.${key}`);
    if (!(typeof value === 'string' && refPattern.test(value)) && !validLiteral(semantics[key].$type, value)) throw new Error(`Invalid override value ${label}.${key}`);
  }
}
function resolved(primitive, semantic) {
  const memo = new Map(), active = new Set();
  function visit(scope, key) {
    const id = `${scope}.${key}`, source = scope === 'primitive' ? primitive : semantic;
    if (memo.has(id)) return memo.get(id);
    if (active.has(id)) throw new Error(`Circular alias: ${id}`);
    if (!Object.hasOwn(source, key)) throw new Error(`Missing reference: ${id}`);
    const def = source[key]; active.add(id);
    let result = def.$value;
    const match = typeof result === 'string' ? result.match(refPattern) : null;
    if (match) {
      const target = match[1] === 'primitive' ? primitive : semantic;
      if (!Object.hasOwn(target, match[2])) throw new Error(`Missing reference: ${match[1]}.${match[2]}`);
      if (target[match[2]].$type !== def.$type) throw new Error(`Type mismatch at ${id}`);
      result = visit(match[1], match[2]);
    }
    if (!validLiteral(def.$type, result)) throw new Error(`Invalid resolved value: ${id}`);
    active.delete(id); memo.set(id, result); return result;
  }
  for (const k of Object.keys(primitive)) visit('primitive', k);
  return Object.fromEntries(Object.keys(semantic).sort().map(k => [k, visit('semantic', k)]));
}
function overrideDefinitions(base, ...sets) {
  const out = Object.fromEntries(Object.entries(base).map(([key, value]) => [key, { ...value }]));
  for (const set of sets) for (const [key, value] of Object.entries(set)) out[key].$value = value;
  return out;
}
const paletteKeys = new Set(['color.primary', 'color.primary-hover', 'color.link', 'color.focus']);
const densityKeys = new Set(['size.control.medium', 'spacing.md']);
const kitKeys = new Set(['radius.control', 'radius.card', 'shadow.card']);
function cssBlock(selector, tokens) {
  return `${selector} {\n${Object.entries(tokens).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => `  --ds-${key.replaceAll('.', '-')}: ${value};`).join('\n')}\n}\n`;
}
function cssValues(definitions, values, subset) {
  return Object.fromEntries(Object.keys(subset).sort().map(key => {
    const value = definitions[key].$value;
    const alias = typeof value === 'string' ? value.match(refPattern) : null;
    return [key, alias && alias[1] === 'semantic' ? `var(--ds-${alias[2].replaceAll('.', '-')})` : values[key]];
  }));
}
export function compile(sources) {
  keys(sources, ['primitives', 'semantics', 'themes', 'palettes', 'density', 'kits'], 'sources');
  const { primitives, semantics, themes, palettes, density, kits } = sources;
  validateDefinitions(primitives, 'primitives'); validateDefinitions(semantics, 'semantics');
  keys(themes, axes.themes, 'themes'); keys(palettes, axes.palettes, 'palettes'); keys(density, axes.density, 'density'); keys(kits, axes.kits, 'kits');
  const cssNames = new Set();
  for (const key of Object.keys(semantics)) {
    const cssName = key.replaceAll('.', '-');
    if (cssNames.has(cssName)) throw new Error(`CSS name collision: ${key}`);
    cssNames.add(cssName);
  }
  for (const [name, overrides] of Object.entries(themes)) validateOverrides(overrides, semantics, `theme.${name}`, new Set(Object.keys(semantics).filter(k => k.startsWith('color.'))));
  for (const [name, value] of Object.entries(palettes)) {
    keys(value, axes.themes, `palette.${name}`);
    for (const [theme, overrides] of Object.entries(value)) {
      validateOverrides(overrides, semantics, `palette.${name}.${theme}`, paletteKeys);
      if (Object.keys(overrides).length !== paletteKeys.size) throw new Error(`Incomplete palette ${name}.${theme}`);
    }
  }
  for (const [name, overrides] of Object.entries(density)) {
    validateOverrides(overrides, semantics, `density.${name}`, densityKeys);
    if (Object.keys(overrides).length !== densityKeys.size) throw new Error(`Incomplete density ${name}`);
  }
  for (const [name, overrides] of Object.entries(kits)) {
    validateOverrides(overrides, semantics, `kit.${name}`, kitKeys);
    if (Object.keys(overrides).length !== kitKeys.size) throw new Error(`Incomplete kit ${name}`);
  }
  // Resolve every combination before emitting, including alias graphs modified by overrides.
  const combinations = {};
  for (const theme of axes.themes) for (const palette of axes.palettes) for (const den of axes.density) for (const kit of axes.kits) {
    combinations[`${theme}/${palette}/${den}/${kit}`] = resolved(primitives, overrideDefinitions(semantics, themes[theme], palettes[palette][theme], density[den], kits[kit]));
  }
  resolved(primitives, semantics);
  const base = combinations['light/blue/comfortable/default'];
  let css = `/* Generated from packages/tokens JSON. Do not edit. */\n${cssBlock(':root', cssValues(overrideDefinitions(semantics, themes.light, palettes.blue.light, density.comfortable, kits.default), base, semantics))}`;
  const dark = combinations['dark/blue/comfortable/default'];
  css += cssBlock('html[data-theme="dark"]', cssValues(overrideDefinitions(semantics, themes.dark, palettes.blue.dark), dark, { ...themes.dark, ...palettes.blue.dark }));
  for (const palette of axes.palettes) {
    css += cssBlock(`html[data-palette="${palette}"]`, cssValues(overrideDefinitions(semantics, themes.light, palettes[palette].light), combinations[`light/${palette}/comfortable/default`], palettes[palette].light));
    css += cssBlock(`html[data-theme="dark"][data-palette="${palette}"]`, cssValues(overrideDefinitions(semantics, themes.dark, palettes[palette].dark), combinations[`dark/${palette}/comfortable/default`], palettes[palette].dark));
  }
  for (const den of axes.density) css += cssBlock(`html[data-density="${den}"]`, cssValues(overrideDefinitions(semantics, density[den]), combinations[`light/blue/${den}/default`], density[den]));
  for (const kit of axes.kits) css += cssBlock(`html[data-kit="${kit}"]`, cssValues(overrideDefinitions(semantics, kits[kit]), combinations[`light/blue/comfortable/${kit}`], kits[kit]));
  const data = { version: 1, axes, default: base, combinations };
  return { 'tokens.css': css, 'tokens.json': `${JSON.stringify(data, null, 2)}\n`, 'tokens.ts': `// Generated from packages/tokens JSON. Do not edit.\nexport const tokens = ${JSON.stringify(data, null, 2)} as const;\nexport default tokens;\n` };
}

/** Project overrides are data, separate from the authoritative repository tokens. */
export const projectSchema = 'pwa-design-system/token-overrides';
export const projectMaxBytes = 65536;
export function emptyProject() { return { schema: projectSchema, version: 1, overrides: { global: {}, light: {}, dark: {} } }; }
export function validateProject(sources, project) {
  keys(project, ['schema', 'version', 'overrides'], 'project');
  if (project.schema !== projectSchema || project.version !== 1) throw new Error('Unsupported token configuration schema or version');
  keys(project.overrides, ['global', 'light', 'dark'], 'project.overrides');
  for (const [scope, overrides] of Object.entries(project.overrides)) {
    if (Object.keys(overrides).length > Object.keys(sources.semantics).length) throw new Error('Too many token overrides');
    validateOverrides(overrides, sources.semantics, `project.${scope}`, new Set(Object.keys(sources.semantics)));
    for (const value of Object.values(overrides)) if (typeof value === 'string' && value.length > 128) throw new Error('Token value is too long');
  }
  compile(sources);
  const combinations = {};
  for (const theme of axes.themes) for (const palette of axes.palettes) for (const density of axes.density) for (const kit of axes.kits) {
    combinations[`${theme}/${palette}/${density}/${kit}`] = resolved(sources.primitives, overrideDefinitions(sources.semantics, sources.themes[theme], sources.palettes[palette][theme], sources.density[density], sources.kits[kit], project.overrides.global, project.overrides[theme]));
  }
  return combinations;
}
// Scan the JSON grammar before parsing so duplicate (including escaped) keys,
// excessive nesting and overly large structures are rejected instead of merged.
function scanJSON(text) {
  let i = 0, nodes = 0;
  function whitespace() { while (i < text.length && [32, 9, 10, 13].includes(text.charCodeAt(i))) i++; }
  function string() {
    if (text[i] !== '"') throw new Error('Expected JSON string');
    const start = i++;
    while (i < text.length) {
      const char = text[i++];
      if (char === '\\') { if (i >= text.length) throw new Error('Invalid JSON string'); i++; }
      else if (char === '"') { try { return JSON.parse(text.slice(start, i)); } catch { throw new Error('Invalid JSON string'); } }
      else if (char.charCodeAt(0) < 32) throw new Error('Invalid JSON string');
    }
    throw new Error('Unterminated JSON string');
  }
  function value(depth) {
    if (++nodes > 1024 || depth > 8) throw new Error('JSON structure exceeds limits');
    whitespace();
    if (text[i] === '{') {
      i++; whitespace(); const seen = new Set();
      if (text[i] === '}') { i++; return; }
      while (true) {
        whitespace(); const key = string();
        if (seen.has(key)) throw new Error(`Duplicate JSON key: ${key}`);
        if (dangerous.has(key)) throw new Error('Forbidden JSON key');
        seen.add(key); whitespace(); if (text[i++] !== ':') throw new Error('Invalid JSON object');
        value(depth + 1); whitespace();
        if (text[i] === '}') { i++; return; }
        if (text[i++] !== ',') throw new Error('Invalid JSON object');
      }
    }
    if (text[i] === '[') {
      i++; whitespace(); if (text[i] === ']') { i++; return; }
      while (true) { value(depth + 1); whitespace(); if (text[i] === ']') { i++; return; } if (text[i++] !== ',') throw new Error('Invalid JSON array'); }
    }
    if (text[i] === '"') { string(); return; }
    const match = text.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
    if (!match) throw new Error('Invalid JSON value');
    i += match[0].length;
  }
  value(0); whitespace(); if (i !== text.length) throw new Error('Unexpected JSON content');
}
export function parseProject(sources, text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > projectMaxBytes) throw new Error('Token configuration exceeds 64 KiB');
  scanJSON(text);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Token configuration is not valid JSON'); }
  const combinations = validateProject(sources, data);
  return { project: data, combinations };
}
export function projectJSON(project) {
  const overrides = Object.fromEntries(['global', 'light', 'dark'].map(scope => [scope, Object.fromEntries(Object.entries(project.overrides[scope]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))]));
  return `${JSON.stringify({ schema: projectSchema, version: 1, overrides }, null, 2)}\n`;
}
export function projectCSS(combinations) {
  const attribute = (key, value, fallback) => `:is([data-${key}="${value}"]${value === fallback ? `,:not([data-${key}])` : ''})`;
  let css = '/* Generated project token overrides. Load after the design system tokens. */\n';
  for (const theme of axes.themes) for (const palette of axes.palettes) for (const density of axes.density) for (const kit of axes.kits) {
    const selector = `:root${attribute('theme', theme, 'light')}${attribute('palette', palette, 'blue')}${attribute('density', density, 'comfortable')}${attribute('kit', kit, 'default')}`;
    css += cssBlock(selector, combinations[`${theme}/${palette}/${density}/${kit}`]);
  }
  return css;
}
