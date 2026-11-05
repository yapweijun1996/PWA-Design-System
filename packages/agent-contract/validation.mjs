import validate from './generated-validator.mjs';
import { canonical } from './model.mjs';
export const maxContractBytes = 131072;
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
/** Scan before JSON.parse so duplicate and forbidden keys cannot be silently merged. */
function scan(text) {
  let i = 0, nodes = 0;
  function whitespace() { while (i < text.length && [32, 9, 10, 13].includes(text.charCodeAt(i))) i++; }
  function string() {
    if (text[i] !== '"') throw new Error('Expected JSON string');
    const start = i++;
    while (i < text.length) {
      const char = text[i++];
      if (char === '\\') { if (i >= text.length) throw new Error('Invalid JSON string'); i++; }
      else if (char === '"') { try { return JSON.parse(text.slice(start, i)); } catch { throw new Error('Invalid JSON string'); } }
      else if (char.charCodeAt(0) < 32) throw new Error('Invalid JSON string');
    }
    throw new Error('Unterminated JSON string');
  }
  function value(depth) {
    if (++nodes > 12000 || depth > 12) throw new Error('Contract structure exceeds limits');
    whitespace();
    if (text[i] === '{') {
      i++; whitespace(); const seen = new Set();
      if (text[i] === '}') { i++; return; }
      while (true) {
        whitespace(); const key = string();
        if (seen.has(key)) throw new Error('Duplicate JSON key');
        if (forbidden.has(key)) throw new Error('Forbidden JSON key');
        seen.add(key); whitespace(); if (text[i++] !== ':') throw new Error('Invalid JSON object');
        value(depth + 1); whitespace(); if (text[i] === '}') { i++; return; }
        if (text[i++] !== ',') throw new Error('Invalid JSON object');
      }
    }
    if (text[i] === '[') {
      i++; whitespace(); if (text[i] === ']') { i++; return; }
      while (true) { value(depth + 1); whitespace(); if (text[i] === ']') { i++; return; } if (text[i++] !== ',') throw new Error('Invalid JSON array'); }
    }
    if (text[i] === '"') { string(); return; }
    const match = text.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
    if (!match) throw new Error('Invalid JSON value');
    i += match[0].length;
  }
  value(0); whitespace(); if (i !== text.length) throw new Error('Unexpected JSON content');
}
/** Only JSON text is accepted; imported data is validated and never evaluated. */
export function parseAgentContract(text, expected) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > maxContractBytes) throw new Error('Contract exceeds 128 KiB');
  scan(text);
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Contract is not valid JSON'); }
  if (!validate(value)) throw new Error('Contract does not match the schema');
  if (!validate(expected)) throw new Error('Current reference contract does not match the schema');
  if (JSON.stringify(canonical(value)) !== JSON.stringify(canonical(expected))) throw new Error('Contract does not match the current component registry or rules');
  return value;
}
