import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Generate literal media conditions from build-time token primitives; CSS variables cannot be used in media queries. */
export async function generateBreakpoints(check = false, { read = readFile, write = writeFile } = {}) {
  const values = JSON.parse(await read(resolve(root, 'packages/tokens/primitives.json'), 'utf8'));
  const px = name => {
    const value = values[`breakpoint.${name}`];
    if (value?.$type !== 'dimension' || !/^[1-9]\d{1,3}px$/.test(value.$value)) throw new Error(`Invalid ${name} breakpoint`);
    return Number.parseInt(value.$value, 10);
  };
  const mobile = px('mobile'), tablet = px('tablet'), preview = px('preview'), desktop = px('desktop');
  if (!(mobile < tablet && tablet < preview && preview < desktop)) throw new Error('Breakpoints must increase');
  for (const name of ['mobile', 'tablet', 'desktop']) {
    const value = values[`viewport.${name}`];
    if (value?.$type !== 'dimension' || !/^[1-9]\d{1,3}px$/.test(value.$value)) throw new Error(`Invalid ${name} viewport preset`);
    const width = Number.parseInt(value.$value, 10); if (width < 320 || width > 1600) throw new Error(`Viewport ${name} is outside the playground range`);
  }
  const rules = [
    ['apps/studio/src/styles.css', [
      [/@media \(min-width: [^)]+\)(?= \{\n {2}\.studio-sidebar-toggle)/, `@media (min-width: ${desktop + 1}px)`],
      [/@media \(max-width: [^)]+\)(?= \{ \.studio-layout \{ grid-template-columns:)/, `@media (max-width: ${desktop}px)`],
      [/@media \(max-width: [^)]+\)(?= \{ \.studio-layout \{ display: block;)/, `@media (max-width: ${mobile - 1}px)`]
    ]],
    ['apps/studio/src/features/playground/playground.css', [[/@media \(max-width: [^)]+\)/, `@media (max-width: ${mobile - 1}px)`], [/@media \(min-width: [^)]+\)/, `@media (min-width: ${desktop + 1}px)`]]],
    ['apps/studio/src/features/layout/layout.css', [[/@media \(max-width: [^)]+\)/, `@media (max-width: ${mobile}px)`]]],
    ['apps/studio/src/features/accessibility/styles.css', [[/@media \(max-width: [^)]+\)/, `@media (max-width: ${mobile}px)`]]],
    ['apps/studio/src/features/tokens/styles.css', [[/@media \(min-width: [^)]+\)/, `@media (min-width: ${preview}px)`]]],
    ['apps/studio/src/features/tokens/index.ts', [[/matchMedia\('\(min-width: [^)]+\)'\)/, `matchMedia('(min-width: ${preview}px)')`]]],
    ['apps/studio/src/main.ts', [[/matchMedia\('\(max-width: [^)]+\)'\)/, `matchMedia('(max-width: ${mobile - 1}px)')`]]]
  ];
  let stale = false;
  for (const [relative, replacements] of rules) {
    const path = resolve(root, relative); const input = await read(path, 'utf8'); let output = input;
    for (const [pattern, replacement] of replacements) {
      const matches = [...output.matchAll(new RegExp(pattern.source, 'g'))];
      if (matches.length !== 1) throw new Error(`Expected one breakpoint marker in ${relative}`);
      output = output.replace(pattern, replacement);
    }
    if (input !== output) { if (check) { console.error(`Stale breakpoint media conditions: ${relative}`); stale = true; } else await write(path, output); }
  }
  // The Theme Builder stylesheet is independently maintained; its conditions must still use an approved build-time breakpoint.
  const theme = await read(resolve(root, 'apps/studio/src/features/theme/styles.css'), 'utf8');
  const approved = new Set([mobile, mobile - 1, tablet, preview, desktop, desktop + 1]);
  for (const match of theme.matchAll(/@media\s*\((?:min|max)-width:\s*([^)]+)\)/g)) {
    const value = match[1].trim(); if (!/^\d+px$/.test(value) || !approved.has(Number.parseInt(value, 10))) throw new Error('Theme Builder has an unapproved breakpoint');
  }
  if (stale) throw new Error('Breakpoint media conditions are stale. Run npm run tokens:build');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== '--check')) { console.error('Usage: node scripts/breakpoints.mjs [--check]'); process.exitCode = 1; }
  else generateBreakpoints(args[0] === '--check').then(() => console.log(args.length ? 'Breakpoint media conditions are current.' : 'Generated breakpoint media conditions.')).catch(error => { console.error(error.message); process.exitCode = 1; });
}
