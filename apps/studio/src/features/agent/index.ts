import './agent.css';
import ajvLicense from '../../../../../packages/agent-contract/AJV-LICENSE.txt?raw';
import { maxContractBytes } from '../../../../../packages/agent-contract/validation.mjs';
import { createArtifacts, currentContract, verifyContractFile, type ExportName } from './model.js';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node;
}
/** Mount read-only contract inspection, verification and downloads; teardown cancels pending UI work. */
export function mountAgentRules(root: HTMLElement): () => void {
  const reference = currentContract(); const controller = new AbortController(), signal = controller.signal;
  const page = element('div', 'agent-page');
  const heading = element('h1', '', 'AI Agent Rules');
  const intro = element('p', 'agent-muted', 'Inspect the current contract and export configuration for your coding agent. Imported files are verified locally and never executed.');
  const rulesHeading = element('h2', '', 'Design rules'); const list = element('ol', 'agent-rules');
  for (const rule of reference.rules) list.append(element('li', '', rule.description));
  const exportHeading = element('h2', '', 'Export files');
  const exportNote = element('p', 'agent-muted', 'Exports are checked against the current registry. Token CSS uses this browser’s committed, validated overrides. Packages remain private and unpublished.');
  const actions = element('div', 'agent-actions'); const result = element('p', 'agent-status'); result.setAttribute('role', 'status');
  const names: ExportName[] = ['design-system.json', 'tokens.css', 'AGENTS.md', 'COMPONENT-API.md', 'INTEGRATION.md'];
  const urls = new Set<string>();
  for (const name of names) {
    const button = element('button', 'agent-button', `Export ${name}`); button.type = 'button';
    button.addEventListener('click', () => {
      let createdUrl: string | undefined;
      try {
        const contents = createArtifacts()[name], type = name.endsWith('.json') ? 'application/json' : name.endsWith('.css') ? 'text/css' : 'text/markdown';
        const url = URL.createObjectURL(new Blob([contents], { type: `${type};charset=utf-8` })); createdUrl = url; urls.add(url);
        const link = document.createElement('a'); link.href = url; link.download = name; link.hidden = true; document.body.append(link);
        try { link.click(); } finally { link.remove(); }
        const timer = window.setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); timers.delete(timer); }, 1000); timers.add(timer);
        result.textContent = `${name} download started.`;
      } catch (error) { if (createdUrl) { URL.revokeObjectURL(createdUrl); urls.delete(createdUrl); } result.textContent = error instanceof Error ? `Export failed: ${error.message}` : 'Export failed.'; }
    }, { signal }); actions.append(button);
  }
  const verifyHeading = element('h2', '', 'Verify a contract');
  const verifyNote = element('p', 'agent-muted', 'Select a design-system.json file (maximum 128 KiB). Verification does not apply or save its contents.');
  const label = element('label', 'agent-label', 'Contract file'); label.htmlFor = 'agent-contract-file';
  const input = element('input', 'agent-file'); input.id = 'agent-contract-file'; input.type = 'file'; input.accept = '.json,application/json';
  const verification = element('p', 'agent-status'); verification.setAttribute('role', 'status');
  let revision = 0; const timers = new Set<number>();
  input.addEventListener('change', async () => {
    const request = ++revision, file = input.files?.[0]; verification.textContent = '';
    if (!file) return;
    if (file.size > maxContractBytes) { verification.textContent = 'Verification failed: file exceeds 128 KiB.'; return; }
    try {
      const contents = await file.text(); if (signal.aborted || request !== revision) return;
      verifyContractFile(contents); verification.textContent = 'Contract matches the current registry and rules.';
    } catch (error) { if (!signal.aborted && request === revision) verification.textContent = error instanceof Error ? `Verification failed: ${error.message}` : 'Verification failed.'; }
  }, { signal });
  // Vite can remove license comments from generated code, so ship the notice as content.
  const notices = element('details', 'agent-notices');
  notices.append(element('summary', '', 'Third-party license notice'), element('p', 'agent-license', ajvLicense));
  page.append(heading, intro, rulesHeading, list, exportHeading, exportNote, actions, result, verifyHeading, verifyNote, label, input, verification, notices); root.append(page);
  return () => { revision++; controller.abort(); for (const timer of timers) window.clearTimeout(timer); for (const url of urls) URL.revokeObjectURL(url); page.remove(); };
}
