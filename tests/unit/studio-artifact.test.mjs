import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateStudioArtifact } from '../../scripts/check-studio-artifact.mjs';

const base = '/PWA-Design-System/';
const good = `<script src="${base}theme-init.js"></script><script src="${base}token-prepaint.js"></script><link rel="stylesheet" href="${base}app.css">`;
let sandbox;
let root;
const filenames = ['index.html', 'theme-init.js', 'token-prepaint.js', 'app.css', 'lazy.js'];
async function manifest() {
  return Promise.all(filenames.map(async name => ({ url: `${base}${name}`, sha256: createHash('sha256').update(await readFile(join(root, name))).digest('hex') })));
}
async function setManifest(entries) { await writeFile(join(root, 'sw.js'), `const files = ${JSON.stringify(entries)};\n`); }

beforeEach(async () => {
  sandbox = await mkdtemp(join(tmpdir(), 'studio-artifact-test-'));
  root = join(sandbox, 'site'); await mkdir(root);
  await Promise.all(['theme-init.js', 'token-prepaint.js', 'app.css', 'lazy.js'].map(file => writeFile(join(root, file), 'content')));
  await writeFile(join(root, 'index.html'), good);
  await setManifest(await manifest());
});
afterEach(async () => { await rm(sandbox, { recursive: true, force: true }); });

describe('production artifact validation', () => {
  it('accepts existing subpath resources in prepaint order', async () => {
    await expect(validateStudioArtifact(root)).resolves.toEqual({ resources: 3, precache: 5 });
  });
  it('rejects incorrect prepaint order and missing resources', async () => {
    const misplaced = good.replace(`<script src="${base}token-prepaint.js"></script>`, '');
    await writeFile(join(root, 'index.html'), `${misplaced}<script src="${base}token-prepaint.js"></script>`);
    await expect(validateStudioArtifact(root)).rejects.toThrow(/before the stylesheet/);
    await writeFile(join(root, 'index.html'), `${good}<script src="${base}missing.js"></script>`);
    await expect(validateStudioArtifact(root)).rejects.toThrow();
  });
  it('rejects external, root-relative, traversal and symlink escapes', async () => {
    for (const resource of ['https://example.invalid/a.js', '/outside.js', `${base}%2e%2e/outside.js`]) {
      await writeFile(join(root, 'index.html'), `${good}<script src='${resource}'></script>`);
      await expect(validateStudioArtifact(root)).rejects.toThrow();
    }
    await writeFile(join(root, 'index.html'), `${good}<script src=/unquoted.js></script>`);
    await expect(validateStudioArtifact(root)).rejects.toThrow(/quoted/);
    await writeFile(join(sandbox, 'outside.js'), 'outside');
    await symlink(join(sandbox, 'outside.js'), join(root, 'escape.js'));
    await writeFile(join(root, 'index.html'), `${good}<script src="${base}escape.js"></script>`);
    await expect(validateStudioArtifact(root)).rejects.toThrow(/outside/);
  });
  it('rejects missing, stale and extra files in the precache', async () => {
    const entries = await manifest();
    await setManifest(entries.slice(1));
    await expect(validateStudioArtifact(root)).rejects.toThrow(/does not match/);
    await setManifest(entries);
    await rm(join(root, 'lazy.js'));
    await expect(validateStudioArtifact(root)).rejects.toThrow();
    await writeFile(join(root, 'lazy.js'), 'content');
    await writeFile(join(root, 'app.css'), 'modified');
    await expect(validateStudioArtifact(root)).rejects.toThrow(/digest mismatch/);
    await writeFile(join(root, 'app.css'), 'content');
    await writeFile(join(root, 'extra.js'), 'unexpected');
    await expect(validateStudioArtifact(root)).rejects.toThrow(/does not match/);
  });
  it('rejects duplicate and unsafe precache paths', async () => {
    const entries = await manifest();
    await setManifest([...entries, entries[0]]);
    await expect(validateStudioArtifact(root)).rejects.toThrow(/Duplicate/);
    for (const url of [`${base}../outside.js`, `${base}%2e%2e/outside.js`, 'https://example.invalid/a.js']) {
      await setManifest([...entries, { url, sha256: 'a'.repeat(64) }]);
      await expect(validateStudioArtifact(root)).rejects.toThrow(/Precache|precache/);
    }
  });
  it('rejects malformed and duplicate manifests', async () => {
    await writeFile(join(root, 'sw.js'), 'const files = invalid;\n');
    await expect(validateStudioArtifact(root)).rejects.toThrow(/JSON/);
    const entries = await manifest();
    await writeFile(join(root, 'sw.js'), `const files = ${JSON.stringify(entries)};\nconst files = [];\n`);
    await expect(validateStudioArtifact(root)).rejects.toThrow(/duplicate precache manifest/);
  });
});
