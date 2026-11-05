import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/studio');
const base = '/PWA-Design-System/';

async function artifactFiles(root, folder = root) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Artifact must not contain symbolic links');
    if (entry.isDirectory()) files.push(...await artifactFiles(root, path));
    else if (entry.isFile()) files.push(relative(root, path).replaceAll('\\', '/'));
    else throw new Error('Artifact contains unsupported file type');
  }
  return files;
}

async function validatePrecache(root) {
  const worker = await readFile(resolve(root, 'sw.js'), 'utf8');
  const matches = [...worker.matchAll(/^const files = (.+);$/gm)];
  if (matches.length !== 1) throw new Error('Missing or duplicate precache manifest');
  let entries;
  try { entries = JSON.parse(matches[0][1]); } catch { throw new Error('Invalid precache manifest JSON'); }
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('Invalid precache manifest');
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).sort().join(',') !== 'sha256,url' || typeof entry.url !== 'string' || typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid precache entry');
    if (!entry.url.startsWith(base)) throw new Error('Precache path is outside Pages base');
    const name = entry.url.slice(base.length);
    if (!/^[A-Za-z0-9._/-]+$/.test(name) || name.split('/').some(part => !part || part === '.' || part === '..') || name === 'sw.js') throw new Error('Invalid precache path');
    if (seen.has(name)) throw new Error('Duplicate precache path');
    seen.add(name);
    const actual = await realpath(resolve(root, name));
    const local = relative(root, actual);
    if (!local || local.startsWith('..') || isAbsolute(local)) throw new Error('Precache resolves outside build directory');
    const bytes = await readFile(actual);
    if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`Precache digest mismatch: ${name}`);
  }
  const expected = (await artifactFiles(root)).filter(name => name !== 'sw.js');
  if (seen.size !== expected.length || expected.some(name => !seen.has(name))) throw new Error('Precache manifest does not match artifact files');
  return entries.length;
}

/** Validate the built HTML and local resource references, without executing assets. */
export async function validateStudioArtifact(root = defaultRoot) {
  const realRoot = await realpath(root);
  const html = await readFile(resolve(realRoot, 'index.html'), 'utf8');
  const theme = html.indexOf(`<script src="${base}theme-init.js"></script>`);
  const prepaint = html.indexOf(`<script src="${base}token-prepaint.js"></script>`);
  const stylesheet = html.search(/<link\b[^>]*\brel="stylesheet"/i);
  if (theme < 0 || prepaint <= theme || stylesheet <= prepaint) throw new Error('Expected base-relative theme and token bootstrap scripts before the stylesheet');
  const resourceTags = [...html.matchAll(/<(?:script|link)\b[^>]*>/gi)].map(match => match[0]);
  const resources = resourceTags.flatMap(tag => {
    const match = tag.match(/\b(?:src|href)\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    if (!match && /\b(?:src|href)\s*=/i.test(tag)) throw new Error('Resource attribute must be quoted');
    return match ? [match[1] ?? match[2]] : [];
  });
  if (!resources.includes(`${base}theme-init.js`) || !resources.includes(`${base}token-prepaint.js`)) throw new Error('Missing required bootstrap resources');
  for (const resource of resources) {
    if (!resource.startsWith(base)) throw new Error(`Resource is outside the configured Pages base: ${resource}`);
    const path = resolve(realRoot, decodeURIComponent(resource.slice(base.length)));
    const local = relative(realRoot, path);
    if (!local || local.startsWith('..') || isAbsolute(local)) throw new Error('Invalid artifact path');
    const actual = await realpath(path);
    const actualRelative = relative(realRoot, actual);
    if (!actualRelative || actualRelative.startsWith('..') || isAbsolute(actualRelative)) throw new Error('Artifact resolves outside the build directory');
    const info = await stat(actual);
    if (!info.isFile() || info.size === 0) throw new Error(`Missing or empty artifact: ${resource}`);
  }
  const precache = await validatePrecache(realRoot);
  return { resources: resources.length, precache };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  validateStudioArtifact().then(result => console.log(`Validated bootstrap order, ${result.resources} base-relative artifact references and ${result.precache} precache digests.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
