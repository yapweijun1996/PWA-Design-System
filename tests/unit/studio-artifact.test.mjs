import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateStudioArtifact } from '../../scripts/check-studio-artifact.mjs';

const base = '/PWA-Design-System/';
const good = `<script src="${base}theme-init.js"></script><script src="${base}token-prepaint.js"></script><link rel="stylesheet" href="${base}app.css">`;
let sandbox;
let root;

beforeEach(async () => {
  sandbox = await mkdtemp(join(tmpdir(), 'studio-artifact-test-'));
  root = join(sandbox, 'site'); await mkdir(root);
  await Promise.all(['theme-init.js', 'token-prepaint.js', 'app.css'].map(file => writeFile(join(root, file), 'content')));
  await writeFile(join(root, 'index.html'), good);
});
afterEach(async () => { await rm(sandbox, { recursive: true, force: true }); });

describe('production artifact validation', () => {
  it('accepts existing subpath resources in prepaint order', async () => {
    await expect(validateStudioArtifact(root)).resolves.toEqual({ resources: 3 });
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
});
