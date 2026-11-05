import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokenDir = join(root, 'packages/tokens');
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
    case 'dimension': return typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?(?:px|rem)$/.test(value);
    case 'duration': return typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?ms$/.test(value);
    case 'number': return Number.isInteger(value) && value >= 0 && value <= 10000;
    case 'fontFamily': return typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9 -]*(?:,\s*[a-zA-Z][a-zA-Z0-9 -]*)*$/.test(value);
    case 'shadow': return typeof value === 'string' && (value === 'none' || /^0 (?:0|[1-9]\d*)px (?:0|[1-9]\d*)px #[0-9a-fA-F]{8}$/.test(value));
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
  let css = '/* Generated from packages/tokens JSON. Do not edit. */\n' + cssBlock(':root', cssValues(overrideDefinitions(semantics, themes.light, palettes.blue.light, density.comfortable, kits.default), base, semantics));
  const dark = combinations['dark/blue/comfortable/default'];
  css += cssBlock('html[data-theme="dark"]', cssValues(overrideDefinitions(semantics, themes.dark, palettes.blue.dark), dark, { ...themes.dark, ...palettes.blue.dark }));
  for (const palette of axes.palettes) {
    css += cssBlock(`html[data-palette="${palette}"]`, cssValues(overrideDefinitions(semantics, themes.light, palettes[palette].light), combinations[`light/${palette}/comfortable/default`], palettes[palette].light));
    css += cssBlock(`html[data-theme="dark"][data-palette="${palette}"]`, cssValues(overrideDefinitions(semantics, themes.dark, palettes[palette].dark), combinations[`dark/${palette}/comfortable/default`], palettes[palette].dark));
  }
  for (const den of axes.density) css += cssBlock(`html[data-density="${den}"]`, cssValues(overrideDefinitions(semantics, density[den]), combinations[`light/blue/${den}/default`], density[den]));
  for (const kit of axes.kits) css += cssBlock(`html[data-kit="${kit}"]`, cssValues(overrideDefinitions(semantics, kits[kit]), combinations[`light/blue/comfortable/${kit}`], kits[kit]));
  const data = { version: 1, axes, default: base, combinations };
  return { 'tokens.css': css, 'tokens.json': JSON.stringify(data, null, 2) + '\n', 'tokens.ts': `// Generated from packages/tokens JSON. Do not edit.\nexport const tokens = ${JSON.stringify(data, null, 2)} as const;\nexport default tokens;\n` };
}
export async function readSources(dir = tokenDir) {
  async function read(path) {
    const text = await readFile(join(dir, path), 'utf8');
    if (Buffer.byteLength(text) > 1024 * 1024) throw new Error(`Token source too large: ${path}`);
    return JSON.parse(text);
  }
  const result = { primitives: await read('primitives.json'), semantics: await read('semantics.json') };
  for (const group of ['themes', 'palettes', 'density', 'kits']) {
    result[group] = {};
    for (const name of axes[group]) result[group][name] = await read(`${group}/${name}.json`);
  }
  return result;
}
export async function generate(check = false) {
  const artifacts = compile(await readSources());
  let stale = false;
  for (const [name, content] of Object.entries(artifacts)) {
    const path = join(tokenDir, 'generated', name);
    if (check) {
      let actual; try { actual = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (actual !== content) { console.error(`Stale or missing generated artifact: ${path}`); stale = true; }
    } else await writeFile(path, content);
  }
  if (stale) throw new Error('Generated tokens are stale. Run node scripts/tokens.mjs');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== '--check')) { console.error('Usage: node scripts/tokens.mjs [--check]'); process.exitCode = 1; }
  else generate(args[0] === '--check').then(() => console.log(args.length ? 'Token artifacts are current.' : 'Generated token artifacts.')).catch(error => { console.error(error.message); process.exitCode = 1; });
}
