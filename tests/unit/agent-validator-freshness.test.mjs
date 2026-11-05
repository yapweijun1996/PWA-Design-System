import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { buildAgentValidator } from '../../scripts/build-agent-validator.mjs';

describe('agent validator generation', () => {
  it('rejects a stale standalone validator', async () => {
    const read = async (path, encoding) => path.endsWith('/packages/agent-contract/generated-validator.mjs') ? 'stale' : readFile(path, encoding);
    await expect(buildAgentValidator(true, { read })).rejects.toThrow(/stale/);
  });
  it('rejects missing or modified license attribution', async () => {
    const read = async (path, encoding) => path.endsWith('/packages/agent-contract/AJV-LICENSE.txt') ? 'invalid' : readFile(path, encoding);
    await expect(buildAgentValidator(true, { read })).rejects.toThrow(/license/);
  });
});
