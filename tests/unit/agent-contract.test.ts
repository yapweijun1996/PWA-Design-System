// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import schemaText from '../../packages/agent-contract/design-system.schema.json?raw';
import generatedText from '../../packages/agent-contract/generated-validator.mjs?raw';
import validator from '../../packages/agent-contract/generated-validator.mjs';
import { parseAgentContract } from '../../packages/agent-contract/validation.mjs';
import { currentContract, createArtifacts, verifyContractFile } from '../../apps/studio/src/features/agent/model';
import { mountAgentRules } from '../../apps/studio/src/features/agent/index';
import { commitProject, getCommitted } from '../../apps/studio/src/features/tokens/model';

const contract = currentContract();
const text = JSON.stringify(contract);
describe('agent contract validation and export', () => {
  it('round-trips a current contract and allows object-key reordering', () => {
    expect(verifyContractFile(text)).toEqual(contract);
    const reordered = Object.fromEntries(Object.entries(contract).reverse()); expect(verifyContractFile(JSON.stringify(reordered))).toEqual(contract);
  });
  it('rejects malformed, oversized, duplicate, dangerous and non-schema JSON', () => {
    for (const input of ['{', '[]', '{"schema":"x","schema":"y"}', '{"__proto__":{"polluted":true}}', '{"\\u005f_proto__":{}}', ' '.repeat(131073)]) expect(() => verifyContractFile(input)).toThrow();
    const extra = { ...contract, surprise: true }; expect(() => verifyContractFile(JSON.stringify(extra))).toThrow(/schema/);
    expect(Object.prototype).not.toHaveProperty('polluted');
  });
  it('rejects a changed or incomplete registry even when its shape is valid', () => {
    const changed = structuredClone(contract); changed.components[0].factory = 'createDifferent';
    expect(() => verifyContractFile(JSON.stringify(changed))).toThrow(/current component registry/);
    const incomplete = structuredClone(contract); incomplete.components.pop(); expect(() => verifyContractFile(JSON.stringify(incomplete))).toThrow(/schema/);
    const modifiedReference = structuredClone(contract); modifiedReference.components[0].factory = 'createDifferent';
    expect(() => parseAgentContract(text, modifiedReference)).toThrow(/current component registry/);
  });
  it('matches reference Ajv for Unicode and malformed boundary inputs without runtime compilation', () => {
    const schema = JSON.parse(schemaText); const reference = new Ajv({ strict: true, allErrors: true, ownProperties: true }).compile(schema);
    for (const value of ['😀'.repeat(256), '😀'.repeat(257), '\ud800'.repeat(256), '\udc00'.repeat(257), 'a'.repeat(256), 'a'.repeat(257), '', 'bad\ntext']) {
      const data = structuredClone(contract); data.components[0].apiNotes = value;
      expect(validator(data), `length ${value.length}`).toBe(reference(data));
    }
    for (const data of [null, [], {}, { ...contract, components: 'invalid' }, { ...contract, extra: true }]) expect(validator(data)).toBe(reference(data));
    expect(generatedText).not.toMatch(/\b(?:require\s*\(|eval\s*\(|new\s+Function\b)/); expect(generatedText).toContain('Copyright (c) 2015-2021 Evgeny Poberezkin');
    expect(() => execFileSync(process.execPath, ['scripts/build-agent-validator.mjs', '--check'])).not.toThrow();
  });
  it('generates validated, usable export artifacts', () => {
    const artifacts = createArtifacts(); expect(verifyContractFile(artifacts['design-system.json'])).toEqual(contract);
    expect(artifacts['tokens.css']).toContain('--ds-color-surface:'); expect(artifacts['tokens.css']).toContain('[data-kit="enterprise"]');
    expect(artifacts['AGENTS.md']).toContain('Reuse approved core components'); expect(artifacts['COMPONENT-API.md']).toContain('## button');
    expect(artifacts['INTEGRATION.md']).toContain('private'); expect(artifacts['INTEGRATION.md']).toContain('npm run build:core');
  });
  it('builds the exported vanilla guide from locally packed packages', () => {
    const repo = process.cwd();
    const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'design-system-guide-')));
    try {
      if (!existsSync(join(repo, 'packages/core/dist/index.js'))) execFileSync('npm', ['run', 'build:core'], { cwd: repo, stdio: 'pipe' });
      for (const path of ['./packages/core', './packages/tokens']) execFileSync('npm', ['pack', '--pack-destination', temporary, path], { cwd: repo, stdio: 'pipe' });
      const app = join(temporary, 'consumer'); mkdirSync(join(app, 'src'), { recursive: true }); mkdirSync(join(app, 'public'));
      writeFileSync(join(app, 'package.json'), '{"private":true,"type":"module"}');
      const names = [
        `pwa-design-system-core-${contract.packages.core.version}.tgz`,
        `pwa-design-system-tokens-${contract.packages.tokens.version}.tgz`
      ];
      execFileSync('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', ...names.map(name => join(temporary, name))], { cwd: app, stdio: 'pipe' });
      const guide = createArtifacts()['INTEGRATION.md'];
      const blocks = Object.fromEntries([...guide.matchAll(/```(html|js|ts)\n([\s\S]*?)```/g)].map(match => [match[1], match[2]]));
      expect(Object.keys(blocks).sort()).toEqual(['html', 'js', 'ts']);
      let change: () => void = () => {};
      const media = { matches: true, addEventListener(_event: string, listener: () => void) { change = listener; } };
      const doc = { documentElement: { dataset: {} as Record<string, string> } };
      runInNewContext(blocks.js, { document: doc, window: { matchMedia: () => media } });
      expect(doc.documentElement.dataset).toEqual({ theme: 'dark', palette: 'indigo', density: 'comfortable', kit: 'default' });
      media.matches = false; change(); expect(doc.documentElement.dataset.theme).toBe('light');
      writeFileSync(join(app, 'index.html'), blocks.html);
      writeFileSync(join(app, 'public/appearance.js'), blocks.js);
      writeFileSync(join(app, 'src/main.ts'), blocks.ts);
      execFileSync(process.execPath, [resolve(repo, 'node_modules/typescript/bin/tsc'), '--noEmit', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler', 'src/main.ts'], { cwd: app, stdio: 'pipe' });
      execFileSync(process.execPath, [resolve(repo, 'node_modules/vite/bin/vite.js'), 'build', app], { cwd: app, stdio: 'pipe' });
      const html = readFileSync(join(app, 'dist/index.html'), 'utf8');
      expect(html.indexOf('appearance.js')).toBeLessThan(html.indexOf('rel="stylesheet"'));
      expect(readFileSync(join(app, 'dist/appearance.js'), 'utf8')).toContain("root.dataset.theme = preference === 'system'");
      writeFileSync(join(app, 'src/project-tokens.css'), createArtifacts()['tokens.css']);
      writeFileSync(join(app, 'src/main.ts'), blocks.ts.replace("// If exported from Studio, import './project-tokens.css' here, after base tokens.", "import './project-tokens.css';"));
      execFileSync(process.execPath, [resolve(repo, 'node_modules/vite/bin/vite.js'), 'build', app], { cwd: app, stdio: 'pipe' });
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  }, 30000);
  it('exports the committed token project without changing it', () => {
    const before = getCommitted(); const changed = structuredClone(before); changed.overrides.global['spacing.md'] = '2rem';
    try {
      commitProject(changed); const artifacts = createArtifacts();
      expect(artifacts['tokens.css']).toContain('--ds-spacing-md: 2rem;'); expect(getCommitted()).toEqual(changed);
    } finally { commitProject(before); localStorage.removeItem('pwa-ds-token-overrides-v1'); }
  });
  it('verifies files locally and announces success or failure without applying them', async () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountAgentRules(root);
    const input = root.querySelector<HTMLInputElement>('#agent-contract-file'); if (!input) throw new Error('File input missing');
    const output = root.querySelectorAll('[role=status]')[1];
    Object.defineProperty(input, 'files', { configurable: true, value: [{ size: text.length, text: async () => text }] }); input.dispatchEvent(new Event('change')); await Promise.resolve(); await Promise.resolve();
    expect(output.textContent).toMatch(/matches/);
    Object.defineProperty(input, 'files', { configurable: true, value: [{ size: 10, text: async () => '{"__proto__":{}}' }] }); input.dispatchEvent(new Event('change')); await Promise.resolve(); await Promise.resolve();
    expect(output.textContent).toMatch(/failed/i); expect(Object.prototype).not.toHaveProperty('polluted'); destroy(); root.remove();
  });
  it('does not let a stale asynchronous file read replace a newer result', async () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountAgentRules(root);
    const input = root.querySelector<HTMLInputElement>('#agent-contract-file'); if (!input) throw new Error('File input missing');
    let release: (value: string) => void = () => {}; const pending = new Promise<string>(resolve => { release = resolve; });
    Object.defineProperty(input, 'files', { configurable: true, value: [{ size: 20, text: () => pending }] }); input.dispatchEvent(new Event('change'));
    Object.defineProperty(input, 'files', { configurable: true, value: [{ size: text.length, text: async () => text }] }); input.dispatchEvent(new Event('change')); await Promise.resolve(); await Promise.resolve();
    release('{"__proto__":{}}'); await Promise.resolve(); await Promise.resolve(); expect(root.querySelectorAll('[role=status]')[1].textContent).toMatch(/matches/); destroy(); root.remove();
  });
});
