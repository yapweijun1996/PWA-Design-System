import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokenDir = join(root, 'packages/tokens');
import { axes, compile } from '../packages/tokens/src/engine.mjs';
export { axes, compile } from '../packages/tokens/src/engine.mjs';
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
