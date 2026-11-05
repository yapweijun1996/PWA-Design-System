import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/studio');
const base = '/PWA-Design-System/';

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
  return { resources: resources.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  validateStudioArtifact().then(result => console.log(`Validated bootstrap order and ${result.resources} base-relative artifact references.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
