import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { axes } from '../packages/tokens/src/engine.mjs';
import { createDesignContract } from '../packages/agent-contract/model.mjs';
import validate from '../packages/agent-contract/generated-validator.mjs';
import { readContract, validateContracts } from './check-component-contracts.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function json(path) { return JSON.parse(await readFile(resolve(root, path), 'utf8')); }
export async function buildAgentContract(check = false) {
  const [registry, rules, core, tokens] = await Promise.all([readContract(), json('packages/agent-contract/validation-rules.json'), json('packages/core/package.json'), json('packages/tokens/package.json')]);
  await validateContracts(registry);
  if (!rules || typeof rules !== 'object' || Array.isArray(rules) || Object.keys(rules).sort().join(',') !== 'rules,version' || rules.version !== 1 || !Array.isArray(rules.rules) || new Set(rules.rules.map(rule => rule.id)).size !== rules.rules.length) throw new Error('Invalid validation rules');
  const contract = createDesignContract(registry, rules, core, tokens, axes);
  if (!validate(contract)) throw new Error('Generated design contract violates schema');
  const content = `${JSON.stringify(contract, null, 2)}\n`, path = resolve(root, 'packages/agent-contract/design-system.json');
  if (check) { const existing = await readFile(path, 'utf8').catch(() => ''); if (existing !== content) throw new Error('Design contract is stale'); }
  else await writeFile(path, content);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== '--check')) { console.error('Usage: node scripts/build-agent-contract.mjs [--check]'); process.exitCode = 1; }
  else buildAgentContract(args[0] === '--check').then(() => console.log('Design contract is current.')).catch(error => { console.error(error.message); process.exitCode = 1; });
}
