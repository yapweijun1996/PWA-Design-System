import { createProjectValidator, emptyProject, parseProject, projectCSS, projectJSON, projectMaxBytes, type ProjectTokens, type TokenCombinations } from '../../../../../packages/tokens/src/engine.mjs';
import { sources } from './sources';
import { commitProject, contrastFailures, currentCombination, getCommitted, getStorageNotice } from './model';
import { directUses, referenceGraph, inspectReferences, draftChanges, scopeNames, tokenPurpose, type Scope, type PreviewTheme } from './editor-utils';
import { createTokenScene } from './preview';
import './styles.css';
import { setDraftGuard } from '../pwa/guard.js';
export { initializeTokenOverrides } from './model';
let nextEditor = 0;
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
function button(label: string): HTMLButtonElement { const node = element('button', label); node.type = 'button'; node.className = 'token-editor__control'; return node; }
function select(label: string, options: readonly (readonly [string, string])[]): { label: HTMLLabelElement; input: HTMLSelectElement } {
  const wrapper = element('label', label), input = element('select'); input.className = 'token-editor__control';
  for (const [value, text] of options) { const option = element('option', text); option.value = value; input.append(option); }
  wrapper.append(input); return { label: wrapper, input };
}
function download(name: string, content: string, type: string): void { const url = URL.createObjectURL(new Blob([content], { type })); const link = element('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
interface TokenRow { row: HTMLElement; input: HTMLInputElement; defaults: HTMLElement; resolved: HTMLElement; sourceUses: HTMLElement; swatch?: HTMLElement; picker?: HTMLInputElement; group: HTMLFieldSetElement; descriptionIds: string }
export function mountTokenEditor(root: HTMLElement): () => void {
  const controller = new AbortController(), { signal } = controller, id = `token-editor-${++nextEditor}`;
  const validateDraft = createProjectValidator(sources), inheritedValues = validateDraft(emptyProject());
  let draft = getCommitted(), baseline = getCommitted(), values: TokenCombinations = validateDraft(draft);
  let isValid = true, resolutionValid = true, destroyed = false, importRevision = 0, importPending = false;
  let validationMessage = '';
  let mobileView: 'editor' | 'preview' = 'editor'; const history: ProjectTokens[] = [];
  const section = element('section'); section.className = 'token-editor';
  const heading = element('h1', 'Design tokens'); heading.tabIndex = -1;
  const intro = element('p', 'Find a token, explore its effect, then commit your draft.'); intro.className = 'token-editor__intro';
  const scopeControl = select('Editing scope', [['global', 'All themes'], ['light', 'Light only'], ['dark', 'Dark only']]);
  const scope = scopeControl.input; scope.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const previewControl = select('Preview theme', [['light', 'Light'], ['dark', 'Dark']]); const previewTheme = previewControl.input; previewTheme.value = scope.value;
  const toolbar = element('div'); toolbar.className = 'token-editor__toolbar'; toolbar.append(scopeControl.label, previewControl.label);
  const context = element('div'); context.className = 'token-editor__context'; const contextText = element('p'); context.append(contextText);
  const mismatch = element('div'); mismatch.className = 'token-editor__mismatch'; const mismatchText = element('p'), matchPreview = button('Preview editing theme'); mismatch.append(mismatchText, matchPreview);
  const status = element('p'); status.id = `${id}-status`; status.className = 'token-editor__status'; status.setAttribute('role', 'status');
  const validation = element('p'); validation.id = `${id}-validation`; validation.className = 'token-editor__validation'; validation.setAttribute('role', 'status'); validation.setAttribute('aria-label', 'Draft validation'); validation.hidden = true;
  const draftCount = element('output'); draftCount.className = 'token-editor__draft-count'; draftCount.setAttribute('aria-label', 'Unsaved change count');
  const actions = element('div'); actions.className = 'token-editor__actions'; const commit = button('Commit changes'), cancel = button('Cancel draft'), undo = button('Undo'); undo.setAttribute('aria-label', 'Undo last change'); actions.append(commit, cancel, undo); context.append(draftCount);
  const diff = element('details'); diff.className = 'token-editor__diff'; const diffSummary = element('summary'), diffList = element('ul'); diff.append(diffSummary, diffList);
  const viewSwitch = element('div'); viewSwitch.className = 'token-editor__view-switch'; viewSwitch.setAttribute('role', 'group'); viewSwitch.setAttribute('aria-label', 'Token workspace view');
  const editorView = button('Editor'), previewView = button('Preview'); viewSwitch.append(editorView, previewView);
  const editorPanel = element('section'); editorPanel.className = 'token-editor__editor-panel'; editorPanel.id = `${id}-editor`; editorPanel.setAttribute('aria-label', 'Token editor');
  const editorTitle = element('h2', 'Token editor'); editorTitle.className = 'token-editor__panel-title';
  const filters = element('div'); filters.className = 'token-editor__filters';
  const searchLabel = element('label', 'Search tokens'), search = element('input'); search.type = 'search'; search.className = 'token-editor__control'; search.placeholder = 'Name, type, value or reference'; searchLabel.append(search);
  const categories = [...new Set(Object.keys(sources.semantics).filter(key => !key.startsWith('breakpoint.')).map(key => key.split('.')[0]))];
  const categoryControl = select('Category', [['all', 'All categories'], ...categories.map(category => [category, category] as const)]), category = categoryControl.input;
  const modifiedLabel = element('label', 'Modified only'), modified = element('input'); modified.type = 'checkbox'; modifiedLabel.className = 'token-editor__check'; modifiedLabel.prepend(modified);
  const modifiedHelp = element('small', 'Saved overrides and pending removals in this scope.'); modifiedHelp.id = `${id}-modified-help`; modified.setAttribute('aria-describedby', modifiedHelp.id);
  const filterCount = element('p'); filterCount.className = 'token-editor__filter-count'; filterCount.setAttribute('role', 'status'); filters.append(searchLabel, categoryControl.label, modifiedLabel, modifiedHelp);
  const inheritHelp = element('p', 'Empty override = inherited value. Default is the selected preset; Resolved includes the draft.'); inheritHelp.className = 'token-editor__field-help'; inheritHelp.id = `${id}-inherit-help`;
  const fields = element('div'); fields.className = 'token-editor__fields'; const rows = new Map<string, TokenRow>(), groups = new Map<string, HTMLFieldSetElement>();
  const definitions = Object.entries(sources.semantics).filter(([key]) => !key.startsWith('breakpoint.')).sort(([a], [b]) => categories.indexOf(a.split('.')[0]) - categories.indexOf(b.split('.')[0]) || a.localeCompare(b));
  for (const [key, definition] of definitions) {
    const category = key.split('.')[0]; let group = groups.get(category);
    if (!group) { group = element('fieldset'); group.append(element('legend', category)); groups.set(category, group); fields.append(group); }
    const row = element('article'); row.className = 'token-editor__field'; row.dataset.tokenRow = key;
    const title = element('h3', key), type = element('small', definition.$type), purpose = element('p', tokenPurpose(key)); purpose.className = 'token-editor__purpose';
    const rowHeading = element('div'); rowHeading.className = 'token-editor__row-heading'; type.id = `${id}-${key.replaceAll('.', '-')}-type`; purpose.id = `${id}-${key.replaceAll('.', '-')}-purpose`; rowHeading.append(title, type);
    const metrics = element('dl'); metrics.className = 'token-editor__values'; metrics.id = `${id}-${key.replaceAll('.', '-')}-values`; const defaults = element('dd'), resolved = element('dd'); metrics.append(element('dt', 'Default'), defaults, element('dt', 'Resolved'), resolved);
    const label = element('label', 'Override (empty = inherited)'), input = element('input'); input.type = 'text'; input.className = 'token-editor__control'; input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 128; input.dataset.token = key; input.setAttribute('aria-label', `${key} override`); input.setAttribute('aria-describedby', inheritHelp.id); label.append(input);
    const useInherited = button('Use inherited value'); useInherited.setAttribute('aria-label', `Use inherited value for ${key}`);
    const source = element('details'); source.className = 'token-editor__source-detail'; const uses = element('p'); source.append(element('summary', 'Purpose, source & references'), purpose, element('p', `Declared semantic source: ${definition.$value}`), uses);
    row.append(rowHeading, metrics, label); const controls = element('div'); controls.className = 'token-editor__row-actions'; let swatch: HTMLElement | undefined, picker: HTMLInputElement | undefined;
    if (definition.$type === 'color') {
      swatch = element('span'); swatch.className = 'token-editor__swatch'; swatch.setAttribute('aria-hidden', 'true');
      const pickerLabel = element('label', 'Choose new color'); pickerLabel.className = 'token-editor__picker-label'; picker = element('input'); picker.type = 'color'; picker.className = 'token-editor__color-picker'; picker.setAttribute('aria-label', `Choose ${key} color`); picker.title = 'Choosing a color replaces this scope override with a HEX literal.'; pickerLabel.append(picker); metrics.children[2].append(swatch); controls.append(pickerLabel);
      picker.addEventListener('input', () => changeValue(key, picker?.value ?? ''), { signal });
    }
    controls.append(useInherited); row.append(controls, source); group.append(row); rows.set(key, { row, input, defaults, resolved, sourceUses: uses, swatch, picker, group, descriptionIds: `${inheritHelp.id} ${purpose.id} ${type.id} ${metrics.id}` });
    input.addEventListener('input', () => changeValue(key, input.value), { signal }); useInherited.addEventListener('click', () => { changeValue(key, ''); input.focus(); }, { signal });
  }
  const empty = element('div'); empty.className = 'token-editor__empty'; const clearFilters = button('Clear filters'); empty.append(element('p', 'No tokens match these filters.'), clearFilters); const panelHeading = element('div'); panelHeading.className = 'token-editor__panel-heading'; panelHeading.append(editorTitle, filterCount); editorPanel.append(panelHeading, filters, fields, empty);
  const previewPanel = element('section'); previewPanel.className = 'token-editor__preview-panel'; previewPanel.id = `${id}-preview`; previewPanel.setAttribute('aria-label', 'Live component preview');
  const compareLabel = element('label', 'Compare light and dark'), compare = element('input'); compare.type = 'checkbox'; compareLabel.className = 'token-editor__check'; compareLabel.prepend(compare);
  const previewNote = element('p', 'Preview controls use real core components. Contrast checks below cover selected pairs, not complete WCAG conformance.'); previewNote.className = 'token-editor__field-help';
  const primaryScene = createTokenScene(), comparisonScene = createTokenScene(true); comparisonScene.element.hidden = true;
  previewPanel.append(element('h2', 'Live preview'), compareLabel, previewNote, primaryScene.element, comparisonScene.element);
  const workspace = element('div'); workspace.className = 'token-editor__workspace'; workspace.append(editorPanel, previewPanel); editorView.setAttribute('aria-controls', editorPanel.id); previewView.setAttribute('aria-controls', previewPanel.id);
  const more = element('details'); more.className = 'token-editor__more'; more.append(element('summary', 'Import, export & reset'));
  const reset = button('Reset draft to defaults'), exportJson = button('Export JSON'), exportCss = button('Export CSS'); const moreActions = element('div'); moreActions.className = 'token-editor__actions'; moreActions.append(reset, exportJson, exportCss);
  const importLabel = element('label', 'Import token configuration '), file = element('input'); file.type = 'file'; file.accept = 'application/json,.json'; file.className = 'token-editor__control'; importLabel.append(file);
  more.append(element('p', 'Reset removes every override in All themes, Light and Dark. It only changes the draft until you commit. Exports include the entire validated draft, regardless of filters.'), moreActions, importLabel);
  const help = element('details'); help.className = 'token-editor__help'; help.append(element('summary', 'How token overrides work'), element('p', 'Theme-specific overrides take precedence over all-theme overrides, which take precedence over the selected palette, density and kit. Editing scope controls where values are written; Preview theme controls only this local preview. A HEX picker explicitly replaces an alias with a literal; otherwise aliases remain intact. Repository JSON files are never changed.'), intro, inheritHelp);
  const fixed = element('details'); fixed.className = 'token-editor__help'; fixed.append(element('summary', 'Layout breakpoints and viewport presets (read-only)')); const primitiveValue = (key: string): string => String(sources.primitives[key].$value);
  fixed.append(element('p', `Build-time layout rules: navigation drawer below ${primitiveValue('breakpoint.mobile')}; component catalog stacks through ${primitiveValue('breakpoint.tablet')}; this preview rail starts at ${primitiveValue('breakpoint.preview')}; desktop shell changes above ${primitiveValue('breakpoint.desktop')}. These values cannot be edited at runtime.`), element('p', `Viewport examples: mobile ${primitiveValue('viewport.mobile')}, tablet ${primitiveValue('viewport.tablet')}, desktop ${primitiveValue('viewport.desktop')}. Examples do not alter layout rules.`));
  const fixedValues = element('dl'); fixedValues.className = 'token-editor__source'; for (const [key, definition] of Object.entries(sources.primitives).filter(([key]) => key.startsWith('breakpoint.') || key.startsWith('viewport.')).sort(([a], [b]) => a.localeCompare(b))) fixedValues.append(element('dt', key), element('dd', String(definition.$value))); fixed.append(fixedValues);
  const sourceList = element('details'); sourceList.className = 'token-editor__help'; sourceList.append(element('summary', 'View primitive source tokens'), element('p', 'Primitives are raw scales. Semantic tokens assign those values a UI purpose. Source values below are read-only.')); const primitiveGroups = new Map<string, HTMLElement>();
  for (const [key, definition] of Object.entries(sources.primitives).sort(([a], [b]) => a.localeCompare(b))) {
    const name = key.split('.')[0]; let group = primitiveGroups.get(name); if (!group) { group = element('details'); group.append(element('summary', name)); primitiveGroups.set(name, group); sourceList.append(group); }
    const row = element('div'); row.className = 'token-editor__primitive'; const copyName = button('Copy name'), copyValue = button('Copy value'); copyName.setAttribute('aria-label', `Copy ${key} name`); copyValue.setAttribute('aria-label', `Copy ${key} value`); row.append(element('code', key), element('span', `${definition.$value} (${definition.$type})`), copyName, copyValue); group.append(row);
    copyName.addEventListener('click', () => { void copyText(key); }, { signal }); copyValue.addEventListener('click', () => { void copyText(String(definition.$value)); }, { signal });
  }
  section.append(heading, toolbar, context, mismatch, actions, more, status, validation, diff, viewSwitch, workspace, help, fixed, sourceList); root.replaceChildren(section);
  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 900px)') : undefined;
  const clearDraftGuard = setDraftGuard(() => draftChanges(baseline, draft).length > 0 || importPending, () => { status.textContent = 'Save or cancel the token draft and finish importing before leaving this page.'; });
  const selectedScope = (): Scope => scope.value === 'global' || scope.value === 'dark' ? scope.value : 'light'; const selectedTheme = (): PreviewTheme => previewTheme.value === 'dark' ? 'dark' : 'light';
  function cancelPendingImport(): boolean { if (!importPending) return false; importPending = false; importRevision++; file.value = ''; return true; }
  function updateView(): void {
    const wide = media?.matches ?? false; if (wide && viewSwitch.contains(document.activeElement)) heading.focus(); editorPanel.hidden = !wide && mobileView !== 'editor'; previewPanel.hidden = !wide && mobileView !== 'preview'; editorView.setAttribute('aria-pressed', String(mobileView === 'editor')); previewView.setAttribute('aria-pressed', String(mobileView === 'preview'));
  }
  function updateDraftSummary(): void {
    const changes = draftChanges(baseline, draft); draftCount.value = `${changes.length} unsaved ${changes.length === 1 ? 'change' : 'changes'}`; diffSummary.textContent = `Review changes (${changes.length})`; diff.hidden = changes.length === 0; diffList.replaceChildren(...changes.map(change => element('li', `${scopeNames[change.scope]} · ${change.key}: ${change.before === undefined ? 'inherited' : change.before} → ${change.after === undefined ? 'inherited' : change.after}`))); if (!history.length && document.activeElement === undo) cancel.focus(); undo.disabled = history.length === 0;
  }
  function filterRows(): void {
    const query = search.value.trim().toLowerCase(), changed = draftChanges(baseline, draft), scopeKey = selectedScope(), resolved = currentCombination(values, selectedTheme()); let count = 0;
    for (const [key, row] of rows) {
      const searchable = `${key} ${sources.semantics[key].$type} ${sources.semantics[key].$value} ${resolved[key]} ${draft.overrides[scopeKey][key] ?? ''}`.toLowerCase(); const hasOverride = Object.hasOwn(draft.overrides[scopeKey], key) || changed.some(change => change.scope === scopeKey && change.key === key);
      const visible = (!query || searchable.includes(query)) && (category.value === 'all' || key.split('.')[0] === category.value) && (!modified.checked || hasOverride); if (!visible && row.row.contains(document.activeElement)) search.focus(); row.row.hidden = !visible; if (visible) count++;
    }
    for (const group of groups.values()) group.hidden = ![...group.querySelectorAll<HTMLElement>('[data-token-row]')].some(row => !row.hidden); empty.hidden = count > 0; filterCount.textContent = `${count} of ${definitions.length} tokens`;
  }
  function refreshRows(): void {
    const defaults = currentCombination(inheritedValues, selectedTheme()), resolved = currentCombination(values, selectedTheme()), current = selectedScope();
    const appearance = { theme: selectedTheme(), palette: document.documentElement.dataset.palette ?? 'blue', density: document.documentElement.dataset.density ?? 'comfortable', kit: document.documentElement.dataset.kit ?? 'default' };
    const graph = referenceGraph(draft, appearance);
    for (const [key, row] of rows) {
      const raw = draft.overrides[current][key]; if (document.activeElement !== row.input || row.input.value.trim() !== String(raw ?? '')) row.input.value = raw === undefined ? '' : String(raw);
      row.input.placeholder = 'Leave empty to inherit'; row.defaults.textContent = String(defaults[key]); row.resolved.textContent = `${resolutionValid ? '' : 'Last valid: '}${resolved[key]}`; row.row.dataset.modified = String(Object.hasOwn(draft.overrides[current], key)); const references = inspectReferences(graph, `semantic.${key}`); row.sourceUses.textContent = `Reference chain (${appearance.theme}/${appearance.palette}/${appearance.density}/${appearance.kit}): ${references.chain.join(' → ')}. Direct dependents: ${references.direct.join(', ') || 'None'}. Indirect dependents: ${references.indirect.join(', ') || 'None'}.${references.issue ? ` ${references.issue}.` : ''} Declared uses across all scopes (may be overridden): ${directUses(key, draft).join(', ') || 'None'}.`;
      if (row.swatch) row.swatch.style.backgroundColor = String(resolved[key]); if (row.picker && /^#[a-f\d]{6}$/i.test(String(resolved[key]))) row.picker.value = String(resolved[key]); const syntaxInvalid = raw !== undefined && !resolutionValid && (validationMessage.includes(key) || (typeof raw === 'string' && raw.startsWith('{') && validationMessage.includes(raw.slice(1, -1)))); const projectBlocked = raw !== undefined && !isValid; row.input.setAttribute('aria-invalid', String(syntaxInvalid)); row.input.setAttribute('aria-describedby', `${row.descriptionIds}${projectBlocked ? ` ${validation.id}` : ''}`);
    }
    contextText.textContent = `Editing: ${scopeNames[current]} · Preview: ${selectedTheme() === 'light' ? 'Light' : 'Dark'}`; const differs = current !== 'global' && current !== selectedTheme(); mismatch.hidden = !differs; mismatchText.textContent = differs ? `You are editing ${scopeNames[current]} while previewing ${selectedTheme()}. These edits may not appear in this preview.` : ''; filterRows();
  }
  function renderPreview(): void { previewNote.textContent = `Palette: ${document.documentElement.dataset.palette ?? 'blue'} · ${document.documentElement.dataset.density ?? 'comfortable'} · ${document.documentElement.dataset.kit ?? 'default'}. Real core components; selected contrast pairs do not establish WCAG conformance.`; primaryScene.update(currentCombination(values, selectedTheme()), selectedTheme(), !resolutionValid, !isValid); const otherTheme = selectedTheme() === 'light' ? 'dark' : 'light'; comparisonScene.update(currentCombination(values, otherTheme), otherTheme, !resolutionValid, !isValid); comparisonScene.element.hidden = !compare.checked; }
  function formatContrastFailures(failures: string[], combinations: TokenCombinations): string {
    const pending = new Set(failures), examples = new Map<string, string>();
    // Diagnose only invalid projects, using the same existing checker per combination.
    for (const [name, combination] of Object.entries(combinations)) {
      for (const failure of contrastFailures({ [name]: combination })) if (pending.delete(failure)) examples.set(failure, name);
      if (!pending.size) break;
    }
    return failures.map(failure => `${failure} (example: ${examples.get(failure) ?? 'unavailable'})`).join('; ');
  }
  function updatePreview(message?: string): void {
    try { values = validateDraft(draft); resolutionValid = true; const failures = contrastFailures(values); isValid = failures.length === 0; validationMessage = failures.join('; '); validation.textContent = failures.length ? `Draft has contrast issues in project-wide checks (96 combinations): ${formatContrastFailures(failures, values)}. Saving and exports are blocked for the whole project, even when this preview passes.` : ''; }
    catch (error) { resolutionValid = false; isValid = false; validationMessage = error instanceof Error ? error.message : 'Invalid token configuration'; validation.textContent = `Invalid draft: ${validationMessage}. Previous preview is retained.`; }
    validation.hidden = isValid; status.textContent = message ?? (isValid ? 'Draft preview updated. Commit to save.' : '');
    commit.disabled = !isValid; exportJson.disabled = !isValid; exportCss.disabled = !isValid; renderPreview(); refreshRows(); updateDraftSummary();
  }
  function remember(next: ProjectTokens): void { if (draftChanges(draft, next).length) { history.push(structuredClone(draft)); if (history.length > 50) history.shift(); draft = next; } }
  function changeValue(key: string, text: string): void { const canceled = cancelPendingImport(), next = structuredClone(draft), raw = text.trim(); if (!raw) delete next.overrides[selectedScope()][key]; else next.overrides[selectedScope()][key] = sources.semantics[key].$type === 'number' && /^\d+$/.test(raw) ? Number(raw) : raw; remember(next); updatePreview(canceled ? 'Pending import canceled; draft preview updated.' : undefined); }
  async function copyText(text: string): Promise<void> { try { await navigator.clipboard.writeText(text); if (!destroyed) status.textContent = `Copied ${text}.`; } catch { if (!destroyed) status.textContent = 'Clipboard unavailable. Select and copy the displayed text instead.'; } }
  scope.addEventListener('change', () => { const canceled = cancelPendingImport(); refreshRows(); if (canceled) status.textContent = 'Pending import canceled; your draft is unchanged.'; }, { signal });
  previewTheme.addEventListener('change', () => { refreshRows(); renderPreview(); }, { signal });
  matchPreview.addEventListener('click', () => { if (selectedScope() !== 'global') previewTheme.value = selectedScope(); refreshRows(); renderPreview(); previewTheme.focus(); }, { signal });
  for (const input of [search, category, modified]) input.addEventListener(input === search ? 'input' : 'change', filterRows, { signal });
  clearFilters.addEventListener('click', () => { search.value = ''; category.value = 'all'; modified.checked = false; filterRows(); search.focus(); }, { signal });
  editorView.addEventListener('click', () => { mobileView = 'editor'; updateView(); }, { signal }); previewView.addEventListener('click', () => { mobileView = 'preview'; updateView(); }, { signal });
  media?.addEventListener('change', () => { if (!media.matches) { if (previewPanel.contains(document.activeElement)) mobileView = 'preview'; else if (editorPanel.contains(document.activeElement)) mobileView = 'editor'; } updateView(); }, { signal });
  compare.addEventListener('change', () => { if (!compare.checked) for (const dialog of comparisonScene.element.querySelectorAll('dialog')) if (dialog.open) dialog.close(); renderPreview(); }, { signal });
  commit.addEventListener('click', () => { const canceled = cancelPendingImport(); if (!isValid) return; try { commitProject(draft); baseline = getCommitted(); history.length = 0; status.textContent = canceled ? 'Pending import canceled. Current draft committed and saved in this browser.' : 'Token overrides committed and saved in this browser.'; updateDraftSummary(); refreshRows(); } catch { status.textContent = `${canceled ? 'Pending import canceled. ' : ''}Could not save token overrides. The committed configuration is unchanged.`; } }, { signal });
  cancel.addEventListener('click', () => { cancelPendingImport(); draft = getCommitted(); baseline = getCommitted(); history.length = 0; updatePreview('Draft discarded; committed overrides restored.'); }, { signal });
  undo.addEventListener('click', () => { cancelPendingImport(); const previous = history.pop(); if (previous) draft = previous; updatePreview('Last draft change undone.'); }, { signal });
  reset.addEventListener('click', () => { cancelPendingImport(); remember(emptyProject()); updatePreview('Defaults are previewed for all scopes. Commit to save the reset.'); }, { signal });
  exportJson.addEventListener('click', () => { if (isValid) download('token-overrides.json', projectJSON(draft), 'application/json'); }, { signal }); exportCss.addEventListener('click', () => { if (isValid) download('tokens.css', projectCSS(values), 'text/css'); }, { signal });
  file.addEventListener('change', async () => {
    const revision = ++importRevision, selected = file.files?.[0]; if (!selected) { importPending = false; return; } importPending = true;
    if (selected.size > projectMaxBytes) { importPending = false; status.textContent = 'Import rejected: file exceeds 64 KiB. Existing draft and committed tokens are unchanged.'; file.value = ''; return; }
    status.textContent = 'Reading token configuration… It will be validated before preview. Committing cancels this read and saves the current draft.';
    try { const text = await selected.text(); if (destroyed || revision !== importRevision) return; status.textContent = 'Validating token configuration before preview…'; const parsed = parseProject(sources, text), failures = contrastFailures(parsed.combinations); if (failures.length) throw new Error(`Configuration fails project-wide contrast checks: ${formatContrastFailures(failures, parsed.combinations)}`); importPending = false; remember(parsed.project); updatePreview('Imported configuration previewed. Commit to save.'); }
    catch (error) { if (!destroyed && revision === importRevision) status.textContent = `Import rejected: ${error instanceof Error ? error.message : 'Invalid file'}. Existing draft and committed tokens are unchanged.`; }
    finally { if (!destroyed && revision === importRevision) { importPending = false; file.value = ''; } }
  }, { signal });
  const appearanceObserver = new MutationObserver(() => { refreshRows(); renderPreview(); }); appearanceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-density', 'data-kit'] });
  refreshRows(); renderPreview(); updateDraftSummary(); updateView(); status.textContent = getStorageNotice();
  return () => { destroyed = true; importRevision++; clearDraftGuard(); appearanceObserver.disconnect(); controller.abort(); primaryScene.destroy(); comparisonScene.destroy(); section.remove(); };
}
