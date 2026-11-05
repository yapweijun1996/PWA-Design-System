import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkAccessibilityEvidence, checkArtifacts, checkAssets, checkCss, checkFactories, checkInlineAssets } from '../../scripts/check-ssot.mjs';

const file = 'packages/core/src/example.css';
const registry = JSON.parse(await readFile(new URL('../../packages/icons/static-assets.json', import.meta.url), 'utf8'));
const assets = new Map(registry.assets.map(item => [item.path, item.sha256]));

describe('SSOT static checks', () => {
  it('permits semantic values and transparent composition, but rejects raw colors and fallback literals', () => {
    expect(() => checkCss(file, '.x { color: var(--ds-color-text); border: 1px solid transparent; }')).not.toThrow();
    for (const value of ['#abc', '#12345678', 'rgb(1 2 3)', 'hsl(0 0% 0%)', 'red', 'color(display-p3 1 0 0)', 'var(--ds-color-text, #000)']) {
      expect(() => checkCss(file, `.x { color: ${value}; }`)).toThrow(/Raw color/);
    }
    expect(() => checkCss(file, '.x { color: r\\65 d; }')).toThrow(/escapes/);
    expect(() => checkCss(file, '.x { background: url(icon.svg); }')).toThrow(/image reference/);
  });
  it('rejects missing, duplicated and unregistered declared factories', () => {
    const components = [{ factory: 'createButton', source: 'button.ts' }];
    const valid = [['button.ts', 'export function createButton() {}']];
    expect(() => checkFactories(valid, components)).not.toThrow();
    expect(() => checkFactories([], components)).toThrow(/Missing factory/);
    expect(() => checkFactories([...valid, ['other.ts', 'export function createButton() {}']], components)).toThrow(/Duplicate factory/);
    expect(() => checkFactories([...valid, ['other.ts', 'export function createDuplicate() {}']], components)).toThrow(/Unregistered factory/);
    expect(() => checkFactories(valid, [])).toThrow(/Empty/);
    expect(() => checkFactories(valid, [...components, ...components])).toThrow(/duplicate/);
  });
  it('requires actual axe, assertions and keyboard calls in each scoped browser evidence file', async () => {
    const source = await readFile(new URL('../e2e/foundation.spec.ts', import.meta.url), 'utf8');
    expect(() => checkAccessibilityEvidence('foundation', source)).not.toThrow();
    expect(() => checkAccessibilityEvidence('foundation', source.replaceAll('.analyze()', '.notAnalyze()'))).toThrow(/axe analysis/);
    expect(() => checkAccessibilityEvidence('foundation', source.replaceAll('.keyboard.press(', '.keyboard.missing('))).toThrow(/keyboard interaction/);
    expect(() => checkAccessibilityEvidence('foundation', source.replaceAll('.violations)', '.passes)'))).toThrow(/violation assertion/);
  });
  it('rejects missing, malformed, duplicate, modified and unapproved static assets', () => {
    expect(() => checkAssets(registry, assets)).not.toThrow();
    expect(() => checkAssets({ version: 1, assets: [] }, new Map())).toThrow(/empty/);
    expect(() => checkAssets({ version: 1, assets: [registry.assets[0], registry.assets[0]] }, assets)).toThrow(/duplicate/);
    expect(() => checkAssets({ version: 1, assets: [{ ...registry.assets[0], path: '../unsafe.svg' }] }, assets)).toThrow(/Malformed/);
    const changed = new Map(assets); changed.set(registry.assets[0].path, '0'.repeat(64));
    expect(() => checkAssets(registry, changed)).toThrow(/modified/);
    const added = new Map(assets); added.set('packages/core/src/new.svg', '0'.repeat(64));
    expect(() => checkAssets(registry, added)).toThrow(/Unapproved/);
    const missing = new Map(assets); missing.delete(registry.assets[0].path);
    expect(() => checkAssets(registry, missing)).toThrow(/Missing/);
    for (const source of ['<svg viewBox="0 0 1 1">', '<img src="x.svg">', 'document.createElementNS("x", "svg")', 'data:image/png;base64,abc']) {
      expect(() => checkInlineAssets('packages/core/src/example.ts', source)).toThrow(/requires review/);
    }
    expect(() => checkInlineAssets('apps/studio/src/example.css', '.x { background: url(x.svg); }')).toThrow(/requires review/);
  });
  it('requires all generated-artifact checks in check-only mode and propagates stale failures', async () => {
    const tokens = vi.fn(), validator = vi.fn(), contract = vi.fn();
    await checkArtifacts({ tokens, validator, contract });
    for (const check of [tokens, validator, contract]) expect(check).toHaveBeenCalledWith(true);
    await expect(checkArtifacts({ tokens: () => { throw new Error('stale tokens'); }, validator, contract })).rejects.toThrow('stale tokens');
    await expect(checkArtifacts({ tokens, validator: () => { throw new Error('stale validator'); }, contract })).rejects.toThrow('stale validator');
    await expect(checkArtifacts({ tokens, validator, contract: () => { throw new Error('stale contract'); } })).rejects.toThrow('stale contract');
  });
  it('fails the real gate for stale tokens, validator and agent contract', () => {
    const temporary = mkdtempSync(join(tmpdir(), 'ssot-check-test-'));
    try {
      for (const path of ['packages', 'scripts', 'apps', 'tests', 'package.json']) cpSync(join(process.cwd(), path), join(temporary, path), { recursive: true });
      symlinkSync(join(process.cwd(), 'node_modules'), join(temporary, 'node_modules'), 'dir');
      const run = () => spawnSync(process.execPath, ['scripts/check-ssot.mjs'], { cwd: temporary, encoding: 'utf8' });
      const baseline = run(); expect(baseline.status, baseline.stderr).toBe(0);
      for (const [path, message] of [
        ['packages/tokens/generated/tokens.css', /Stale or missing generated artifact/],
        ['packages/agent-contract/generated-validator.mjs', /Agent validator is stale/],
        ['packages/agent-contract/design-system.json', /Design contract is stale/]
      ]) {
        const target = join(temporary, path), original = readFileSync(target, 'utf8');
        writeFileSync(target, `${original}\n`);
        const result = run(); expect(result.status, path).not.toBe(0); expect(result.stderr).toMatch(message);
        writeFileSync(target, original);
      }
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  }, 30000);
});
