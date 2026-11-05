import { emptyProject, parseProject, projectCSS, projectJSON, projectMaxBytes, validateProject, type TokenCombinations, type TokenValue } from '../../../../../packages/tokens/src/engine.mjs';
import { sources } from './sources';
import { commitProject, contrastFailures, currentCombination, getCommitted, getStorageNotice, setTokenMap } from './model';
import './styles.css';
export { initializeTokenOverrides } from './model';

type Scope = 'global' | 'light' | 'dark';
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node;
}
function button(label: string): HTMLButtonElement { const node = element('button', label); node.type = 'button'; return node; }
function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function mountTokenEditor(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const section = element('section'); section.className = 'token-editor';
  const heading = element('h1', 'Design tokens');
  const explanation = element('p', 'Edit a token, preview it, then commit your changes.');
  const help = element('details'); help.className = 'token-editor__help';
  help.append(element('summary', 'How token overrides work'), element('p', 'Theme-specific overrides take precedence over all-theme overrides, which take precedence over the selected palette, density and kit. Breakpoint values are reference tokens and do not rewrite CSS media queries. Repository JSON files are never changed. Representative contrast checks do not establish WCAG conformance.'));
  const scopeLabel = element('label', 'Edit overrides for '), scope = element('select');
  for (const [value, label] of [['global', 'All themes'], ['light', 'Light only'], ['dark', 'Dark only']]) { const option = element('option', label); option.value = value; scope.append(option); }
  scope.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; scopeLabel.append(scope);
  const status = element('p'); status.className = 'token-editor__status'; status.setAttribute('role', 'status'); status.textContent = getStorageNotice();
  const actions = element('div'); actions.className = 'token-editor__actions';
  const commit = button('Commit changes'), cancel = button('Cancel draft'), reset = button('Reset draft to defaults'), exportJson = button('Export JSON'), exportCss = button('Export CSS');
  actions.append(commit, cancel);
  const more = element('details'); more.className = 'token-editor__more';
  more.append(element('summary', 'Import, export & reset'));
  const moreActions = element('div'); moreActions.className = 'token-editor__actions'; moreActions.append(reset, exportJson, exportCss);
  const importLabel = element('label', 'Import token configuration '), file = element('input'); file.type = 'file'; file.accept = 'application/json,.json'; importLabel.append(file); more.append(moreActions, importLabel);
  const preview = element('div'); preview.className = 'token-editor__preview'; preview.setAttribute('aria-label', 'Token preview');
  const previewTitle = element('h2', 'Live preview'), previewCard = element('div'); previewCard.className = 'token-editor__preview-card';
  previewCard.append(element('h3', 'Workspace preview'), element('p', 'Text, surfaces and focus update from the same resolved token values.'), button('Preview action'));
  preview.append(previewTitle, previewCard);
  const previewPanel = element('details'); previewPanel.className = 'token-editor__preview-panel';
  previewPanel.open = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;
  previewPanel.append(element('summary', 'Live preview'), preview);
  const fields = element('div'); fields.className = 'token-editor__fields';
  const inputs = new Map<string, HTMLInputElement>();
  const categories = ['color', 'font', 'spacing', 'radius', 'shadow', 'elevation', 'layer', 'motion', 'size', 'focus', 'breakpoint'];
  const order = (key: string): number => { const index = categories.indexOf(key.split('.')[0]); return index < 0 ? categories.length : index; };
  const definitions = Object.entries(sources.semantics).sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b));
  let currentCategory = ''; let group: HTMLFieldSetElement | undefined;
  for (const [key, definition] of definitions) {
    const category = key.split('.')[0];
    if (category !== currentCategory) { currentCategory = category; group = element('fieldset'); group.append(element('legend', category)); fields.append(group); }
    const label = element('label'); label.className = 'token-editor__field';
    const title = element('span', key), type = element('small', definition.$type), input = element('input');
    input.type = 'text'; input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 128; input.dataset.token = key;
    input.setAttribute('aria-label', `${key} override`);
    label.append(title, type, input); group?.append(label); inputs.set(key, input);
  }
  const sourceList = element('details'); const sourceSummary = element('summary', 'View primitive source tokens'); sourceList.append(sourceSummary);
  const sourceContent = element('dl'); sourceContent.className = 'token-editor__source';
  for (const [key, value] of Object.entries(sources.primitives).sort(([a], [b]) => a.localeCompare(b))) { sourceContent.append(element('dt', key), element('dd', `${value.$value} (${value.$type})`)); }
  sourceList.append(sourceContent);
  const workspace = element('div'); workspace.className = 'token-editor__workspace'; workspace.append(previewPanel, fields);
  section.append(heading, explanation, scopeLabel, actions, more, help, status, workspace, sourceList); root.replaceChildren(section);
  let draft = getCommitted();
  let values: TokenCombinations = validateProject(sources, draft);
  let isValid = true; let destroyed = false; let importRevision = 0; let importPending = false;
  function cancelPendingImport(): boolean {
    if (!importPending) return false;
    importPending = false; importRevision++; file.value = ''; return true;
  }
  const draftScope = (): Scope => scope.value === 'global' || scope.value === 'dark' ? scope.value : 'light';
  function refreshInputs(): void {
    const selected = draft.overrides[draftScope()];
    const inherited = currentCombination(validateProject(sources, emptyProject()));
    for (const [key, input] of inputs) { input.value = selected[key] === undefined ? '' : String(selected[key]); input.placeholder = String(inherited[key]); }
  }
  function updatePreview(message?: string): void {
    try {
      values = validateProject(sources, draft);
      setTokenMap(preview, currentCombination(values));
      const failures = contrastFailures(values);
      isValid = failures.length === 0;
      commit.disabled = !isValid; exportJson.disabled = !isValid; exportCss.disabled = !isValid;
      status.textContent = failures.length ? `Draft has contrast issues: ${failures.join('; ')}. Adjust before committing.` : (message ?? 'Draft preview updated. Commit to save.');
    } catch (error) {
      isValid = false; commit.disabled = true; exportJson.disabled = true; exportCss.disabled = true;
      status.textContent = `Invalid draft: ${error instanceof Error ? error.message : 'Invalid token configuration'}. Previous preview is retained.`;
    }
  }
  refreshInputs(); setTokenMap(preview, currentCombination(values));
  scope.addEventListener('change', () => { const canceled = cancelPendingImport(); refreshInputs(); if (canceled) status.textContent = 'Pending import canceled; your draft is unchanged.'; }, { signal });
  for (const [key, input] of inputs) input.addEventListener('input', () => {
    const canceled = cancelPendingImport();
    const text = input.value.trim(), scopeValues = draft.overrides[draftScope()];
    if (!text) delete scopeValues[key];
    else {
      let value: TokenValue = text;
      if (sources.semantics[key].$type === 'number' && /^\d+$/.test(text)) value = Number(text);
      scopeValues[key] = value;
    }
    updatePreview(canceled ? 'Pending import canceled; draft preview updated.' : undefined);
  }, { signal });
  commit.addEventListener('click', () => {
    cancelPendingImport();
    if (!isValid) return;
    try { commitProject(draft); status.textContent = 'Token overrides committed and saved in this browser.'; }
    catch { status.textContent = 'Could not save token overrides. The committed configuration is unchanged.'; }
  }, { signal });
  cancel.addEventListener('click', () => { cancelPendingImport(); draft = getCommitted(); refreshInputs(); updatePreview('Draft discarded; committed overrides restored.'); }, { signal });
  reset.addEventListener('click', () => { cancelPendingImport(); draft = emptyProject(); refreshInputs(); updatePreview('Defaults are previewed. Commit to save the reset.'); }, { signal });
  exportJson.addEventListener('click', () => { if (isValid) download('token-overrides.json', projectJSON(draft), 'application/json'); }, { signal });
  exportCss.addEventListener('click', () => { if (isValid) download('tokens.css', projectCSS(values), 'text/css'); }, { signal });
  file.addEventListener('change', async () => {
    const revision = ++importRevision, selected = file.files?.[0]; if (!selected) { importPending = false; return; }
    importPending = true;
    if (selected.size > projectMaxBytes) { importPending = false; status.textContent = 'Import rejected: file exceeds 64 KiB. Existing draft and committed tokens are unchanged.'; file.value = ''; return; }
    try {
      const text = await selected.text(); if (destroyed || revision !== importRevision) return;
      const parsed = parseProject(sources, text);
      if (contrastFailures(parsed.combinations).length) throw new Error('Configuration fails representative contrast checks');
      draft = parsed.project; values = parsed.combinations; refreshInputs(); updatePreview('Imported configuration previewed. Commit to save.');
    } catch (error) {
      if (!destroyed && revision === importRevision) status.textContent = `Import rejected: ${error instanceof Error ? error.message : 'Invalid file'}. Existing draft and committed tokens are unchanged.`;
    } finally { if (!destroyed && revision === importRevision) { importPending = false; file.value = ''; } }
  }, { signal });
  const appearanceObserver = new MutationObserver(() => { if (isValid) setTokenMap(preview, currentCombination(values)); refreshInputs(); });
  appearanceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-density', 'data-kit'] });
  return () => { destroyed = true; importRevision++; appearanceObserver.disconnect(); controller.abort(); section.remove(); };
}
