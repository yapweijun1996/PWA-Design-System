import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = 'packages/agent-contract/component-contracts.json';
const groups = {
  foundation: { unit: 'tests/unit/foundation.test.ts', browser: 'tests/e2e/foundation.spec.ts' },
  forms: { unit: 'tests/unit/forms.test.ts', browser: 'tests/e2e/forms.spec.ts' },
  navigation: { unit: 'tests/unit/navigation-feedback.test.ts', browser: 'tests/e2e/navigation-feedback.spec.ts' },
  feedback: { unit: 'tests/unit/navigation-feedback.test.ts', browser: 'tests/e2e/navigation-feedback.spec.ts' }
};
// Identity and source paths are fixed here so an imported contract cannot redirect file reads.
const required = [
  ['button', 'createButton', 'foundation/button', 'ButtonOptions', 'button'],
  ['icon-button', 'createIconButton', 'foundation/icon-button', 'IconButtonOptions', 'icon-button'],
  ['badge', 'createBadge', 'foundation/badge', 'BadgeOptions', 'badge'],
  ['card', 'createCard', 'foundation/card', 'CardOptions', 'card'],
  ['separator', 'createSeparator', 'foundation/separator', 'SeparatorOptions', 'separator'],
  ['tooltip', 'createTooltip', 'foundation/tooltip', 'TooltipOptions', 'tooltip'],
  ['input', 'createInput', 'forms/input', 'InputOptions', 'input'],
  ['textarea', 'createTextarea', 'forms/textarea', 'TextareaOptions', 'textarea'],
  ['checkbox', 'createCheckbox', 'forms/checkbox', 'CheckboxOptions', 'checkbox'],
  ['radio-group', 'createRadioGroup', 'forms/radio-group', 'RadioGroupOptions', 'radio-group'],
  ['switch', 'createSwitch', 'forms/switch', 'SwitchOptions', 'switch'],
  ['select', 'createSelect', 'forms/select', 'SelectOptions', 'select'],
  ['form-field', 'createFormField', 'forms/form-field', 'FormFieldOptions', 'form-field'],
  ['tabs', 'createTabs', 'navigation/index', 'TabsOptions', 'navigation'],
  ['breadcrumb', 'createBreadcrumb', 'navigation/index', 'BreadcrumbItem[]', 'navigation'],
  ['menu', 'createMenu', 'navigation/index', 'MenuOptions', 'navigation'],
  ['pagination', 'createPagination', 'navigation/index', 'PaginationOptions', 'navigation'],
  ['dialog', 'createDialog', 'feedback/index', 'DialogOptions', 'feedback'],
  ['alert', 'createAlert', 'feedback/index', 'AlertOptions', 'feedback'],
  ['toast', 'createToast', 'feedback/index', 'ToastOptions', 'feedback']
];
const allowed = new Map(required.map(([family, factory, source, optionType, subpath]) => {
  const group = source.split('/')[0];
  return [family, { factory, source: `packages/core/src/${source}.ts`, optionType, entry: `@pwa-design-system/core/${subpath}`, unitTest: groups[group].unit, browserTest: groups[group].browser, module: `./${source}.js`, subpath, dist: `./dist/${source}.js`, types: `./dist/${source}.d.ts` }];
}));
const componentKeys = ['family', 'factory', 'source', 'entry', 'optionType', 'keyboard', 'states', 'unitTest', 'browserTest'];
function object(value, label, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort(), keys = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(keys)) throw new Error(`${label} has invalid keys`);
}
function text(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 256 || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) throw new Error(`${label} must be bounded non-empty text`);
}
function textList(value, label) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw new Error(`${label} must contain 1 to 12 items`);
  value.forEach((item, i) => { text(item, `${label}[${i}]`); });
  if (new Set(value).size !== value.length) throw new Error(`${label} contains duplicates`);
}
function parse(code, file) {
  const result = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (result.parseDiagnostics.length) throw new Error(`Invalid TypeScript in ${file}`);
  return result;
}
function exported(node) { return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false; }
function declaresFactory(tree, name) { return tree.statements.some(node => ts.isFunctionDeclaration(node) && node.name?.text === name && exported(node)); }
function declaresType(tree, name) { return tree.statements.some(node => (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.name.text === name && exported(node)); }
function reexports(tree, name, module) {
  return tree.statements.some(node => ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === module && (!node.exportClause || (ts.isNamedExports(node.exportClause) && node.exportClause.elements.some(element => !element.isTypeOnly && element.name.text === name))));
}
function calls(tree, name) {
  let found = false;
  const visit = node => {
    if (ts.isCallExpression(node) && ((ts.isIdentifier(node.expression) && node.expression.text === name) || (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === name))) found = true;
    if (!found) ts.forEachChild(node, visit);
  };
  visit(tree); return found;
}
async function defaultRead(path) { return readFile(join(root, path), 'utf8'); }
/** Validate data and inspect source/export/test-call presence. This does not prove test execution or behavioral correctness. */
export async function validateContracts(data, { read = defaultRead } = {}) {
  object(data, 'Contract', ['version', 'components']);
  if (data.version !== 1) throw new Error('Unsupported contract version');
  if (!Array.isArray(data.components) || data.components.length !== required.length) throw new Error(`Expected ${required.length} component families`);
  const seen = new Set();
  for (const component of data.components) {
    object(component, 'Component', componentKeys);
    for (const key of ['family', 'factory', 'source', 'entry', 'optionType', 'unitTest', 'browserTest']) text(component[key], key);
    textList(component.keyboard, 'keyboard'); textList(component.states, 'states');
    if (seen.has(component.family)) throw new Error(`Duplicate family: ${component.family}`);
    seen.add(component.family);
    const expected = allowed.get(component.family);
    if (!expected) throw new Error(`Unknown family: ${component.family}`);
    for (const key of ['factory', 'source', 'entry', 'optionType', 'unitTest', 'browserTest']) if (component[key] !== expected[key]) throw new Error(`Invalid ${key} for ${component.family}`);
  }
  for (const [family] of allowed) if (!seen.has(family)) throw new Error(`Missing family: ${family}`);
  const readChecked = async path => { try { return await read(path); } catch (error) { throw new Error(`Missing or unreadable file: ${path}`, { cause: error }); } };
  const packageJson = JSON.parse(await readChecked('packages/core/package.json'));
  if (packageJson.name !== '@pwa-design-system/core' || packageJson.exports?.['.']?.import !== './dist/index.js' || packageJson.exports?.['.']?.types !== './dist/index.d.ts') throw new Error('Invalid core root export');
  const index = parse(await readChecked('packages/core/src/index.ts'), 'packages/core/src/index.ts');
  const trees = new Map();
  async function tree(path) { if (!trees.has(path)) trees.set(path, parse(await readChecked(path), path)); return trees.get(path); }
  for (const component of data.components) {
    const expected = allowed.get(component.family);
    const src = await tree(expected.source);
    if (!declaresFactory(src, expected.factory)) throw new Error(`Missing exported factory ${expected.factory} in ${expected.source}`);
    if (!declaresType(src, expected.optionType.replace(/\[\]$/, ''))) throw new Error(`Missing exported option type ${expected.optionType} in ${expected.source}`);
    if (!reexports(index, expected.factory, expected.module)) throw new Error(`Missing root re-export: ${expected.factory}`);
    const entry = packageJson.exports?.[`./${expected.subpath}`];
    if (entry?.import !== expected.dist || entry?.types !== expected.types) throw new Error(`Invalid package entry: ${expected.subpath}`);
    for (const key of ['unitTest', 'browserTest']) if (!calls(await tree(expected[key]), expected.factory)) throw new Error(`Missing ${key} factory call for ${component.family}`);
  }
  return { families: seen.size };
}
export async function readContract() {
  const content = await readFile(join(root, contractPath));
  if (content.length > 128 * 1024) throw new Error('Component contract exceeds 128 KiB');
  return JSON.parse(content.toString('utf8'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) { console.error('Usage: node scripts/check-component-contracts.mjs'); process.exitCode = 1; }
  else readContract().then(data => validateContracts(data)).then(result => console.log(`Validated ${result.families} family identities, exports and test-call references; behavior and test execution require separate verification.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
