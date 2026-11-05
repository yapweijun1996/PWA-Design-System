import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { generate } from './tokens.mjs';
import { readContract, validateContracts } from './check-component-contracts.mjs';
import { buildAgentValidator } from './build-agent-validator.mjs';
import { buildAgentContract } from './build-agent-contract.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const core = 'packages/core/src';
const assetRoots = [core, 'apps/studio/src', 'apps/studio/public', 'packages/icons'];
const assetPattern = /\.(?:svg|png|jpe?g|gif|webp|ico|avif)$/i;
const a11yTests = ['tests/e2e/foundation.spec.ts', 'tests/e2e/forms.spec.ts', 'tests/e2e/navigation-feedback.spec.ts', 'tests/e2e/data-table.spec.ts'];
const namedColors = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '));
// Transparent and currentColor are allowed composition keywords, not palette values.
// Print styling and external content are outside this core-component CSS scan. Any
// future in-scope exception must be an exact path/declaration with a reviewed reason.
const cssExceptions = new Map();

async function filesIn(directory) {
  const list = await readdir(join(root, directory), { withFileTypes: true });
  const result = [];
  for (const entry of list) {
    const path = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in scanned scope: ${path}`);
    if (entry.isDirectory()) result.push(...await filesIn(path));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
const text = path => readFile(join(root, path), 'utf8');

export function checkCss(path, source) {
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(['"])(?:\\.|(?!\1)[^\\])*?\1/g, '""');
  if (stripped.includes('\\')) throw new Error(`CSS escapes require manual review: ${path}`);
  if (/@import\b|\burl\s*\(/i.test(stripped)) throw new Error(`External CSS or image reference requires review: ${path}`);
  const declarations = stripped.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)(?=;|})/gm);
  for (const [, property, raw] of declarations) {
    const value = raw.replace(/--[\w-]+/g, '');
    const functionOrHex = /#[\da-f]+\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk|light-dark)\s*\(/i.test(value);
    const named = (value.toLowerCase().match(/[a-z]+/g) ?? []).find(word => namedColors.has(word));
    const declaration = `${property.trim()}: ${raw.trim()}`;
    const reason = cssExceptions.get(`${path}|${declaration}`);
    if ((functionOrHex || named) && !(typeof reason === 'string' && reason.trim())) throw new Error(`Raw color in ${path}: ${declaration}`);
  }
}

export function checkFactories(files, components) {
  const expected = new Map(components.map(component => [component.factory, component.source]));
  if (!expected.size || expected.size !== components.length) throw new Error('Empty or duplicate component factory registry');
  const seen = new Map();
  for (const [path, source] of files) {
    const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    if (tree.parseDiagnostics.length) throw new Error(`Invalid TypeScript: ${path}`);
    for (const statement of tree.statements) {
      const names = ts.isFunctionDeclaration(statement) && statement.name ? [statement.name.text] : ts.isVariableStatement(statement) ? statement.declarationList.declarations.flatMap(declaration => ts.isIdentifier(declaration.name) ? [declaration.name.text] : []) : [];
      const isExported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
      for (const name of names.filter(name => /^create[A-Z]/.test(name))) {
        if (seen.has(name)) throw new Error(`Duplicate factory ${name}: ${seen.get(name)}, ${path}`);
        seen.set(name, path);
        if (isExported && (!expected.has(name) || expected.get(name) !== path)) throw new Error(`Unregistered factory ${name} in ${path}`);
      }
    }
  }
  for (const [name, path] of expected) if (seen.get(name) !== path) throw new Error(`Missing factory ${name} in ${path}`);
}

export function checkAccessibilityEvidence(path, source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const [label, pattern] of [
    ['axe import', /from\s*['"]@axe-core\/playwright['"]/], ['axe execution', /new\s+AxeBuilder\s*\(/],
    ['axe analysis', /\.analyze\s*\(/], ['violation assertion', /\.violations\s*(?:,\s*[^)]*)?\)\s*\.toEqual\s*\(\s*\[\s*\]\s*\)/],
    ['keyboard interaction', /\.keyboard\.press\s*\(/]
  ]) if (!pattern.test(code)) throw new Error(`Missing ${label} evidence in ${path}`);
}

export function checkAssets(registry, actual) {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry) || Object.keys(registry).sort().join(',') !== 'assets,version' || registry.version !== 1 || !Array.isArray(registry.assets) || registry.assets.length < 1 || registry.assets.length > 100) throw new Error('Invalid or empty static asset registry');
  const approved = new Map();
  for (const item of registry.assets) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).sort().join(',') !== 'path,purpose,sha256' || typeof item.path !== 'string' || !assetRoots.some(base => item.path.startsWith(`${base}/`)) || item.path.includes('..') || !assetPattern.test(item.path) || !/^[a-f0-9]{64}$/.test(item.sha256) || typeof item.purpose !== 'string' || !item.purpose.trim() || item.purpose.length > 160 || approved.has(item.path)) throw new Error('Malformed or duplicate static asset');
    approved.set(item.path, item.sha256);
  }
  for (const [path, digest] of actual) if (!approved.has(path) || approved.get(path) !== digest) throw new Error(`Unapproved or modified static asset: ${path}`);
  for (const path of approved.keys()) if (!actual.has(path)) throw new Error(`Missing approved static asset: ${path}`);
}

export function checkInlineAssets(path, source) {
  if (/<(?:svg|img)\b|createElementNS\s*\(|createElement\s*\(\s*['"]img['"]|data:image\//i.test(source) || (path.endsWith('.css') && /\burl\s*\(/i.test(source))) throw new Error(`Inline or referenced image requires review: ${path}`);
}

export async function checkArtifacts({ tokens = generate, validator = buildAgentValidator, contract = buildAgentContract } = {}) {
  await tokens(true);
  await validator(true);
  await contract(true);
}

export async function checkSsot() {
  const registry = await readContract();
  await validateContracts(registry);
  await checkArtifacts();
  const coreFiles = await filesIn(core);
  const componentCss = coreFiles.filter(path => path.endsWith('.css'));
  if (!componentCss.length) throw new Error('No component CSS found');
  for (const path of componentCss) checkCss(path, await text(path));
  const sourceFiles = coreFiles.filter(path => path.endsWith('.ts') && !path.endsWith('.d.ts'));
  if (!sourceFiles.length) throw new Error('No component source found');
  checkFactories(await Promise.all(sourceFiles.map(async path => [path, await text(path)])), registry.components);
  for (const path of a11yTests) checkAccessibilityEvidence(path, await text(path));
  const assetFiles = (await Promise.all(assetRoots.map(filesIn))).flat().filter(path => assetPattern.test(path));
  const actual = new Map(await Promise.all(assetFiles.map(async path => [path, createHash('sha256').update(await readFile(join(root, path))).digest('hex')])));
  const inventory = await text('packages/icons/static-assets.json');
  if (Buffer.byteLength(inventory) > 64 * 1024) throw new Error('Static asset registry exceeds 64 KiB');
  checkAssets(JSON.parse(inventory), actual);
  const sourcePaths = [...coreFiles, ...await filesIn('apps/studio/src')].filter(path => /\.(?:ts|tsx|js|css)$/.test(path));
  for (const path of sourcePaths) checkInlineAssets(path, await text(path));
  return { families: registry.components.length, css: componentCss.length, assets: actual.size, evidence: a11yTests.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) { console.error('Usage: node scripts/check-ssot.mjs'); process.exitCode = 1; }
  else checkSsot().then(result => console.log(`SSOT checks passed: ${result.families} registered families, ${result.css} core CSS files, ${result.assets} static assets, ${result.evidence} browser evidence files. Behavioral, visual and accessibility conformance require separate verification.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
