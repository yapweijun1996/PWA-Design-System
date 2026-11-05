import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { readContract, validateContracts } from '../../scripts/check-component-contracts.mjs';

const actual = await readContract();
const clone = () => structuredClone(actual);
const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const replace = (path, content) => async requested => requested === path ? content : read(requested);

describe('component contract gate', () => {
  it('accepts the current source, package exports and test-call references', async () => {
    await expect(validateContracts(actual)).resolves.toEqual({ families: 21 });
  });
  it('rejects missing and duplicate required families', async () => {
    const missing = clone(); missing.components.pop();
    await expect(validateContracts(missing)).rejects.toThrow(/Expected 21/);
    const duplicate = clone(); duplicate.components[1] = structuredClone(duplicate.components[0]);
    await expect(validateContracts(duplicate)).rejects.toThrow(/Duplicate family/);
  });
  it('rejects untrusted keys, wrong primitives, excessive values and redirected files', async () => {
    const extra = clone(); extra.components[0].untrusted = 'x';
    await expect(validateContracts(extra)).rejects.toThrow(/invalid keys/);
    const wrong = clone(); wrong.components[0].states = 'disabled';
    await expect(validateContracts(wrong)).rejects.toThrow(/states/);
    const tooLong = clone(); tooLong.components[0].keyboard = ['x'.repeat(257)];
    await expect(validateContracts(tooLong)).rejects.toThrow(/bounded/);
    const path = clone(); path.components[0].source = '../../etc/passwd';
    await expect(validateContracts(path)).rejects.toThrow(/Invalid source/);
  });
  it('rejects missing source and absent exported factories or option types', async () => {
    const file = actual.components[0].source;
    await expect(validateContracts(actual, { read: async path => { if (path === file) throw new Error('missing'); return read(path); } })).rejects.toThrow(/Missing or unreadable file/);
    await expect(validateContracts(actual, { read: replace(file, 'export interface ButtonOptions {}') })).rejects.toThrow(/Missing exported factory/);
    await expect(validateContracts(actual, { read: replace(file, 'export function createButton() {}') })).rejects.toThrow(/Missing exported option type/);
  });
  it('rejects missing root or package subpath exports', async () => {
    await expect(validateContracts(actual, { read: replace('packages/core/src/index.ts', '') })).rejects.toThrow(/Missing root re-export/);
    const pkg = JSON.parse(await read('packages/core/package.json')); delete pkg.exports['./button'];
    await expect(validateContracts(actual, { read: replace('packages/core/package.json', JSON.stringify(pkg)) })).rejects.toThrow(/Invalid package entry/);
  });
  it('requires executable-looking factory calls in both test sources, not comments', async () => {
    const unit = actual.components[0].unitTest, browser = actual.components[0].browserTest;
    await expect(validateContracts(actual, { read: replace(unit, '// createButton() in a comment\n') })).rejects.toThrow(/Missing unitTest factory call/);
    await expect(validateContracts(actual, { read: replace(browser, '// createButton() in a comment\n') })).rejects.toThrow(/Missing browserTest factory call/);
  });
  it('detects inherited and local option-property additions and removals', async () => {
    const shared = 'packages/core/src/foundation/shared.ts'; const sharedText = await read(shared);
    await expect(validateContracts(actual, { read: replace(shared, sharedText.replace('disabled?: boolean;', 'disabled?: boolean; newFlag?: boolean;')) })).rejects.toThrow(/Option property drift/);
    const input = 'packages/core/src/forms/input.ts'; const inputText = await read(input);
    await expect(validateContracts(actual, { read: replace(input, inputText.replace('placeholder?: string;', '')) })).rejects.toThrow(/Option property drift/);
  });
  it('rejects missing metadata and changed property types', async () => {
    const missing = clone(); missing.components[0].properties.pop();
    await expect(validateContracts(missing)).rejects.toThrow(/Option property drift/);
    const wrongType = clone(); wrongType.components[0].properties[0].type = 'number';
    await expect(validateContracts(wrongType)).rejects.toThrow(/Option type drift/);
  });
});
