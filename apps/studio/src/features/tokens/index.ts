import { createProjectValidator, emptyProject, parseProject, projectCSS, projectJSON, projectMaxBytes, type ProjectTokens, type TokenCombinations } from '../../../../../packages/tokens/src/engine.mjs';
import { sources } from './sources';
import { commitProject, contrastFailures, currentCombination, getCommitted, getStorageNotice } from './model';
import { directUses, referenceGraph, inspectReferences, draftChanges, scopeNames, tokenPurpose, type Scope, type PreviewTheme } from './editor-utils';
import { createTokenScene } from './preview';
import './styles.css';
import { setDraftGuard } from '../pwa/guard.js';
import { createWorkspace } from '../../components/workspace/index.js';
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
interface TokenRow { row: HTMLTableRowElement; select: HTMLButtonElement; defaults: HTMLElement; resolved: HTMLElement; state: HTMLElement; swatch?: HTMLElement }
export function mountTokenEditor(root: HTMLElement): () => void {
  const controller = new AbortController(), { signal } = controller, id = `token-editor-${++nextEditor}`;
  const validateDraft = createProjectValidator(sources), inheritedValues = validateDraft(emptyProject());
  let draft = getCommitted(), baseline = getCommitted(), values: TokenCombinations = validateDraft(draft);
  let isValid = true, resolutionValid = true, destroyed = false, importRevision = 0, importPending = false;
  let validationMessage = '';
  const history: ProjectTokens[] = []; let selectedKey = 'color.surface';
  const section = element('section'); section.className = 'token-editor';
  const heading = element('h1', 'Design tokens'); heading.tabIndex = -1;
  const intro = element('p', 'Find a token, explore its effect, then commit your draft.'); intro.className = 'token-editor__intro';
  const scopeControl = select('Editing scope', [['global', 'All themes'], ['light', 'Light only'], ['dark', 'Dark only']]);
  const scope = scopeControl.input; scope.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const previewControl = select('Canvas theme', [['light', 'Light'], ['dark', 'Dark']]); const previewTheme = previewControl.input; previewTheme.value = scope.value;
  const workspace = createWorkspace({ id: 'tokens', label: 'Design token workspace', labels: { explorer: 'Categories', canvas: 'Workspace', inspector: 'Token details' } });
  const toolbar = element('div'); toolbar.className = 'token-editor__toolbar'; toolbar.append(scopeControl.label, previewControl.label);
  const canvasScopeHelp = element('p', 'Editing scope writes overrides. Canvas theme affects this canvas only; Studio theme stays unchanged.'); canvasScopeHelp.className = 'token-editor__field-help';
  const context = element('div'); context.className = 'token-editor__context studio-sr-only'; const contextText = element('p'); context.append(contextText);
  const mismatch = element('div'); mismatch.className = 'token-editor__mismatch'; const mismatchText = element('p'), matchPreview = button('Preview editing theme'); mismatch.append(mismatchText, matchPreview);
  const status = element('p'); status.id = `${id}-status`; status.className = 'token-editor__status'; status.setAttribute('role', 'status');
  const validation = element('p'); validation.id = `${id}-validation`; validation.className = 'token-editor__validation'; validation.setAttribute('role', 'status'); validation.setAttribute('aria-label', 'Draft validation'); validation.hidden = true;
  const draftCount = element('output'); draftCount.className = 'token-editor__draft-count'; draftCount.setAttribute('aria-label', 'Unsaved change count');
  const actions = element('div'); actions.className = 'token-editor__actions'; const commit = button('Commit changes'), cancel = button('Cancel draft'), undo = button('Undo'); undo.setAttribute('aria-label', 'Undo last change'); commit.textContent = 'Commit'; commit.setAttribute('aria-label', 'Commit changes'); cancel.textContent = 'Cancel'; cancel.setAttribute('aria-label', 'Cancel draft'); actions.append(draftCount, commit, cancel, undo); commit.classList.add('token-editor__commit');
  const diff = element('details'); diff.className = 'token-editor__diff'; const diffSummary = element('summary'), diffList = element('ul'); diff.append(diffSummary, diffList);
  const viewSwitch = element('div'); viewSwitch.className = 'token-editor__view-switch'; viewSwitch.setAttribute('role', 'tablist'); viewSwitch.setAttribute('aria-label', 'Token canvas views');
  const editorPanel = element('section'); editorPanel.className = 'token-editor__editor-panel'; editorPanel.id = `${id}-editor`; editorPanel.setAttribute('aria-label', 'Token editor');
  const editorTitle = element('h2', 'Token table'); editorTitle.className = 'token-editor__panel-title';
  const filters = element('div'); filters.className = 'token-editor__filters';
  const searchLabel = element('label', 'Search tokens'), search = element('input'); search.type = 'search'; search.className = 'token-editor__control'; search.placeholder = 'Name, type, value or reference'; searchLabel.append(search);
  const categories = [...new Set(Object.keys(sources.semantics).filter(key => !key.startsWith('breakpoint.')).map(key => key.split('.')[0]))];
  const definitions = Object.entries(sources.semantics).filter(([key]) => !key.startsWith('breakpoint.')).sort(([a], [b]) => categories.indexOf(a.split('.')[0]) - categories.indexOf(b.split('.')[0]) || a.localeCompare(b));
  const categoryControl = select('Category', [['all', `All categories (${definitions.length})`], ...categories.map(category => [category, `${category} (${definitions.filter(([key]) => key.split('.')[0] === category).length})`] as const)]), category = categoryControl.input;
  const modifiedLabel = element('label', 'Modified only'), modified = element('input'); modified.type = 'checkbox'; modifiedLabel.className = 'token-editor__check'; modifiedLabel.prepend(modified);
  const modifiedHelp = element('small', 'Saved overrides and pending removals in this scope.'); modifiedHelp.id = `${id}-modified-help`; modified.setAttribute('aria-describedby', modifiedHelp.id);
  const filterCount = element('p'); filterCount.className = 'token-editor__filter-count'; filterCount.setAttribute('role', 'status'); filters.append(searchLabel, modifiedLabel, modifiedHelp);
  workspace.explorer.append(element('h2', 'Token categories'), categoryControl.label, element('p', 'Choose a category, then select a token in the table.'), filterCount);
  const inheritHelp = element('p', 'Empty override = inherited value. Default is the selected preset; Resolved includes the draft.'); inheritHelp.className = 'studio-sr-only'; inheritHelp.id = `${id}-inherit-help`;
  const fields = element('div'); fields.className = 'token-editor__fields'; fields.setAttribute('role', 'region'); fields.setAttribute('aria-label', 'Token table'); fields.tabIndex = 0;
  const table = element('table'); const caption = element('caption', 'Semantic tokens — select a name to edit its override.'); table.append(caption); const head = element('thead'), headings = element('tr');
  for (const text of ['Token', 'Default', 'Resolved', 'Override status']) { const th = element('th', text); th.scope = 'col'; headings.append(th); } head.append(headings); table.append(head); const body = element('tbody'); table.append(body); fields.append(table);
  const rows = new Map<string, TokenRow>();
  for (const [key, definition] of definitions) {
    const row = element('tr'); row.dataset.tokenRow = key; const name = element('th'); name.scope = 'row'; const choose = button(key); choose.className = 'token-editor__token-name'; choose.dataset.selectToken = key; choose.setAttribute('aria-pressed', String(key === selectedKey)); name.append(choose, element('small', definition.$type));
    const defaults = element('td'), resolved = element('td'), state = element('td'); resolved.className = 'token-editor__table-resolved'; let swatch: HTMLElement | undefined;
    if (definition.$type === 'color') { swatch = element('span'); swatch.className = 'token-editor__swatch'; swatch.setAttribute('aria-hidden', 'true'); }
    row.append(name, defaults, resolved, state); body.append(row); rows.set(key, { row, select: choose, defaults, resolved, state, swatch });
    choose.addEventListener('click', () => selectToken(key, true), { signal });
  }
  const empty = element('div'); empty.className = 'token-editor__empty'; const clearFilters = button('Clear filters'); empty.append(element('p', 'No tokens match these filters.'), clearFilters); const panelHeading = element('div'); panelHeading.className = 'token-editor__panel-heading'; panelHeading.append(editorTitle); editorPanel.append(panelHeading, filters, fields, empty);
  const inspector = element('article'); inspector.className = 'token-editor__field'; const inspectorTitle = element('h2', selectedKey), type = element('small'), purpose = element('p'); purpose.id = `${id}-selected-purpose`; type.id = `${id}-selected-type`; const selectionNotice = element('p'); selectionNotice.className = 'token-editor__field-help';
  const metrics = element('dl'); metrics.className = 'token-editor__values'; metrics.id = `${id}-selected-values`; const defaults = element('dd'), resolved = element('dd'), swatch = element('span'); swatch.className = 'token-editor__swatch'; swatch.setAttribute('aria-hidden', 'true'); metrics.append(element('dt', 'Default'), defaults, element('dt', 'Resolved'), resolved);
  const label = element('label', 'Override (empty = inherited)'), input = element('input'); input.type = 'text'; input.className = 'token-editor__control'; input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 128; label.append(input);
  const pickerLabel = element('label', 'Choose new color'); pickerLabel.className = 'token-editor__picker-label'; const picker = element('input'); picker.type = 'color'; picker.className = 'token-editor__color-picker'; picker.title = 'Choosing a color replaces this scope override with a HEX literal.'; pickerLabel.append(picker);
  const useInherited = button('Use inherited value'); const rowActions = element('div'); rowActions.className = 'token-editor__row-actions'; rowActions.append(pickerLabel, useInherited);
  const sourceDetail = element('details'); sourceDetail.className = 'token-editor__source-detail'; const uses = element('p'), declared = element('p'); sourceDetail.append(element('summary', 'Purpose, source & references'), declared, uses);
  const dependency = element('section'); dependency.className = 'token-editor__dependency'; dependency.setAttribute('aria-label', 'Token dependency chain'); const chain = element('ol'); dependency.append(element('h3', 'Dependency chain'), chain);
  const inspectorHeading = element('div'); inspectorHeading.className = 'token-editor__inspector-heading'; inspectorHeading.append(inspectorTitle, type); purpose.className = 'token-editor__field-help'; inspector.append(inspectorHeading, purpose, selectionNotice, metrics, label, rowActions, dependency, sourceDetail); workspace.inspector.append(inspector);
  chain.addEventListener('click', event => { const reference = (event.target as Element).closest<HTMLButtonElement>('[data-reference]')?.dataset.reference; if (reference) selectToken(reference, true); }, { signal });
  input.addEventListener('input', () => changeValue(selectedKey, input.value), { signal }); picker.addEventListener('input', () => changeValue(selectedKey, picker.value), { signal }); useInherited.addEventListener('click', () => { changeValue(selectedKey, ''); input.focus(); }, { signal });
  const previewPanel = element('section'); previewPanel.className = 'token-editor__preview-panel'; previewPanel.id = `${id}-preview`; previewPanel.setAttribute('aria-label', 'Live component preview');
  const compareLabel = element('label', 'Compare light and dark'), compare = element('input'); compare.type = 'checkbox'; compareLabel.className = 'token-editor__check'; compareLabel.prepend(compare);
  const previewNote = element('p'); previewNote.className = 'token-editor__field-help';
  const primaryScene = createTokenScene(), comparisonScene = createTokenScene(true); comparisonScene.element.hidden = true;
  const scenes = element('div'); scenes.className = 'token-editor__scenes'; scenes.append(primaryScene.element, comparisonScene.element); previewPanel.append(element('h2', 'Live preview'), compareLabel, previewNote, scenes);
  const infoPanel = element('section'); infoPanel.id = `${id}-info`; infoPanel.className = 'token-editor__info'; infoPanel.append(element('h2', 'Token documentation'));
  const panels = [editorPanel, previewPanel, infoPanel], tabs: HTMLButtonElement[] = [];
  function activateView(index: number, focus = false): void { panels.forEach((panel, i) => { panel.hidden = i !== index; tabs[i].setAttribute('aria-selected', String(i === index)); tabs[i].tabIndex = i === index ? 0 : -1; }); if (index !== 1) for (const dialog of previewPanel.querySelectorAll('dialog')) if (dialog.open) dialog.close(); if (focus) tabs[index].focus(); }
  for (const [index, title] of ['Tokens', 'Preview', 'Info'].entries()) { const tab = button(title); tab.setAttribute('role', 'tab'); tab.id = `${id}-tab-${index}`; tab.setAttribute('aria-controls', panels[index].id); panels[index].setAttribute('role', 'tabpanel'); panels[index].setAttribute('aria-labelledby', tab.id); tab.addEventListener('click', () => activateView(index), { signal }); tab.addEventListener('keydown', event => { const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : null; if (next !== null) { event.preventDefault(); activateView(next, true); } }, { signal }); tabs.push(tab); viewSwitch.append(tab); }
  workspace.canvas.append(viewSwitch, ...panels);
  const more = element('details'); more.className = 'token-editor__more'; more.append(element('summary', 'Import, export & reset'));
  const reset = button('Reset draft to defaults'), exportJson = button('Export JSON'), exportCss = button('Export CSS'); const moreActions = element('div'); moreActions.className = 'token-editor__actions'; moreActions.append(reset, exportJson, exportCss);
  const importLabel = element('label', 'Import token configuration '), file = element('input'); file.type = 'file'; file.accept = 'application/json,.json'; file.className = 'token-editor__control'; importLabel.append(file);
  more.append(element('p', 'Reset removes every override in All themes, Light and Dark. It only changes the draft until you commit. Exports include the entire validated draft, regardless of filters.'), moreActions, importLabel);
  const help = element('details'); help.className = 'token-editor__help'; help.append(element('summary', 'How token overrides work'), element('p', 'Theme-specific overrides take precedence over all-theme overrides, which take precedence over the selected palette, density and kit. Editing scope controls where values are written; Canvas theme controls only this local preview. A HEX picker explicitly replaces an alias with a literal; otherwise aliases remain intact. Repository JSON files are never changed.'), intro, element('p', inheritHelp.textContent ?? ''));
  const fixed = element('details'); fixed.className = 'token-editor__help'; fixed.append(element('summary', 'Layout breakpoints and viewport presets (read-only)')); const primitiveValue = (key: string): string => String(sources.primitives[key].$value);
  fixed.append(element('p', `Build-time layout rules: navigation drawer below ${primitiveValue('breakpoint.mobile')}; workspace panels switch below ${primitiveValue('breakpoint.mobile')}; three panes require both sufficient available width and a viewport above ${primitiveValue('breakpoint.desktop')}. These values cannot be edited at runtime.`), element('p', `Viewport examples: mobile ${primitiveValue('viewport.mobile')}, tablet ${primitiveValue('viewport.tablet')}, desktop ${primitiveValue('viewport.desktop')}. Examples do not alter layout rules.`));
  const fixedValues = element('dl'); fixedValues.className = 'token-editor__source'; for (const [key, definition] of Object.entries(sources.primitives).filter(([key]) => key.startsWith('breakpoint.') || key.startsWith('viewport.')).sort(([a], [b]) => a.localeCompare(b))) fixedValues.append(element('dt', key), element('dd', String(definition.$value))); fixed.append(fixedValues);
  const sourceList = element('details'); sourceList.className = 'token-editor__help'; sourceList.append(element('summary', 'View primitive source tokens'), element('p', 'Primitives are raw scales. Semantic tokens assign those values a UI purpose. Source values below are read-only.')); const primitiveGroups = new Map<string, HTMLElement>();
  for (const [key, definition] of Object.entries(sources.primitives).sort(([a], [b]) => a.localeCompare(b))) {
    const name = key.split('.')[0]; let group = primitiveGroups.get(name); if (!group) { group = element('details'); group.append(element('summary', name)); primitiveGroups.set(name, group); sourceList.append(group); }
    const row = element('div'); row.className = 'token-editor__primitive'; const copyName = button('Copy name'), copyValue = button('Copy value'); copyName.setAttribute('aria-label', `Copy ${key} name`); copyValue.setAttribute('aria-label', `Copy ${key} value`); row.append(element('code', key), element('span', `${definition.$value} (${definition.$type})`), copyName, copyValue); group.append(row);
    copyName.addEventListener('click', () => { void copyText(key); }, { signal }); copyValue.addEventListener('click', () => { void copyText(String(definition.$value)); }, { signal });
  }
  toolbar.append(actions); const utility = element('div'); utility.className = 'token-editor__utilities'; utility.append(more, diff); workspace.toolbar.append(toolbar, context, mismatch, status, validation, utility); infoPanel.append(canvasScopeHelp, help, fixed, sourceList); section.append(heading, inheritHelp, workspace.element); root.replaceChildren(section);
  const clearDraftGuard = setDraftGuard(() => draftChanges(baseline, draft).length > 0 || importPending, () => { status.textContent = 'Save or cancel the token draft and finish importing before leaving this page.'; });
  const selectedScope = (): Scope => scope.value === 'global' || scope.value === 'dark' ? scope.value : 'light'; const selectedTheme = (): PreviewTheme => previewTheme.value === 'dark' ? 'dark' : 'light';
  function cancelPendingImport(): boolean { if (!importPending) return false; importPending = false; importRevision++; file.value = ''; return true; }
  function updateDraftSummary(): void {
    const changes = draftChanges(baseline, draft); draftCount.value = `${changes.length} unsaved ${changes.length === 1 ? 'change' : 'changes'}`; diffSummary.textContent = `Review changes (${changes.length})`; diff.hidden = changes.length === 0; diffList.replaceChildren(...changes.map(change => element('li', `${scopeNames[change.scope]} · ${change.key}: ${change.before === undefined ? 'inherited' : change.before} → ${change.after === undefined ? 'inherited' : change.after}`))); if (!history.length && document.activeElement === undo) cancel.focus(); undo.disabled = history.length === 0;
  }
  function ensureFocusedInput(): void {
    if (document.activeElement !== input) return;
    const bounds = input.getBoundingClientRect(), header = document.querySelector('.studio-topbar')?.getBoundingClientRect().bottom ?? 0;
    const bottom = window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : innerHeight;
    if (bounds.top >= header && bounds.bottom <= bottom) return;
    input.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    const top = input.getBoundingClientRect().top; if (top < header && typeof window.scrollBy === 'function') window.scrollBy({ top: top - header, behavior: 'instant' });
  }
  function selectToken(key: string, focus = false): void { if (!sources.semantics[key] || key.startsWith('breakpoint.')) return; selectedKey = key; refreshRows(); workspace.showPanel('inspector', false); if (focus) input.focus(); }
  function filterRows(): void {
    const query = search.value.trim().toLowerCase(), changed = draftChanges(baseline, draft), scopeKey = selectedScope(), resolved = currentCombination(values, selectedTheme()); let count = 0;
    for (const [key, row] of rows) {
      const searchable = `${key} ${sources.semantics[key].$type} ${sources.semantics[key].$value} ${resolved[key]} ${draft.overrides[scopeKey][key] ?? ''}`.toLowerCase(); const hasOverride = Object.hasOwn(draft.overrides[scopeKey], key) || changed.some(change => change.scope === scopeKey && change.key === key);
      const visible = (!query || searchable.includes(query)) && (category.value === 'all' || key.split('.')[0] === category.value) && (!modified.checked || hasOverride); if (!visible && row.row.contains(document.activeElement)) search.focus(); row.row.hidden = !visible; if (visible) count++;
    }
    empty.hidden = count > 0; filterCount.textContent = `${count} of ${definitions.length} tokens`; selectionNotice.hidden = !rows.get(selectedKey)?.row.hidden; selectionNotice.textContent = rows.get(selectedKey)?.row.hidden ? 'This selected token is outside the current filters. Its draft remains editable.' : 'Editing the selected token. Other token drafts are retained.';
  }
  function refreshRows(): void {
    const defaultValues = currentCombination(inheritedValues, selectedTheme()), resolvedValues = currentCombination(values, selectedTheme()), current = selectedScope();
    const appearance = { theme: selectedTheme(), palette: document.documentElement.dataset.palette ?? 'blue', density: document.documentElement.dataset.density ?? 'comfortable', kit: document.documentElement.dataset.kit ?? 'default' };
    const graph = referenceGraph(draft, appearance), changes = draftChanges(baseline, draft);
    for (const [key, row] of rows) {
      row.defaults.textContent = String(defaultValues[key]); row.resolved.replaceChildren(); if (row.swatch) { row.swatch.style.backgroundColor = String(resolvedValues[key]); row.resolved.append(row.swatch); } row.resolved.append(document.createTextNode(`${resolutionValid ? '' : 'Last valid: '}${resolvedValues[key]}`));
      const raw = draft.overrides[current][key], changed = changes.some(change => change.scope === current && change.key === key); row.state.textContent = raw === undefined ? changed ? 'Removal pending' : 'Inherited' : changed ? 'Modified' : 'Override'; row.row.dataset.modified = String(raw !== undefined); row.select.setAttribute('aria-pressed', String(key === selectedKey));
    }
    const key = selectedKey, raw = draft.overrides[current][key], definition = sources.semantics[key];
    inspector.dataset.selectedToken = key; inspectorTitle.textContent = key; type.textContent = definition.$type; purpose.textContent = tokenPurpose(key); declared.textContent = `Declared semantic source: ${definition.$value}`;
    input.dataset.token = key; input.setAttribute('aria-label', `${key} override`); if (document.activeElement !== input || input.value.trim() !== String(raw ?? '')) input.value = raw === undefined ? '' : String(raw); input.placeholder = 'Leave empty to inherit';
    defaults.textContent = String(defaultValues[key]); resolved.replaceChildren(); if (definition.$type === 'color') { swatch.style.backgroundColor = String(resolvedValues[key]); resolved.append(swatch); } resolved.append(document.createTextNode(`${resolutionValid ? '' : 'Last valid: '}${resolvedValues[key]}`));
    pickerLabel.hidden = definition.$type !== 'color'; picker.setAttribute('aria-label', `Choose new color for ${key}`); if (/^#[a-f\d]{6}$/i.test(String(resolvedValues[key]))) picker.value = String(resolvedValues[key]); useInherited.setAttribute('aria-label', `Use inherited value for ${key}`);
    const references = inspectReferences(graph, `semantic.${key}`); uses.textContent = `Reference chain (${appearance.theme}/${appearance.palette}/${appearance.density}/${appearance.kit}): ${references.chain.join(' → ')}. Direct dependents: ${references.direct.join(', ') || 'None'}. Indirect dependents: ${references.indirect.join(', ') || 'None'}.${references.issue ? ` ${references.issue}.` : ''} Declared uses across all scopes (may be overridden): ${directUses(key, draft).join(', ') || 'None'}.`;
    chain.replaceChildren(...references.chain.map(reference => { const li = element('li'); const semantic = reference.startsWith('semantic.') ? reference.slice('semantic.'.length) : ''; if (semantic && sources.semantics[semantic] && semantic !== key) { const link = button(reference); link.dataset.reference = semantic; li.append(link); } else li.append(element('code', reference)); return li; }));
    input.setAttribute('aria-invalid', String(raw !== undefined && !resolutionValid && (validationMessage.includes(key) || (typeof raw === 'string' && raw.startsWith('{') && validationMessage.includes(raw.slice(1, -1)))))); input.setAttribute('aria-describedby', `${inheritHelp.id} ${purpose.id} ${type.id} ${metrics.id}${raw !== undefined && !isValid ? ` ${validation.id}` : ''}`);
    contextText.textContent = `Editing: ${scopeNames[current]} · Preview: ${selectedTheme() === 'light' ? 'Light' : 'Dark'}`; const differs = current !== 'global' && current !== selectedTheme(); mismatch.hidden = !differs; mismatchText.textContent = differs ? `You are editing ${scopeNames[current]} while previewing ${selectedTheme()}. These edits may not appear in this preview.` : ''; filterRows(); ensureFocusedInput();
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
    commit.disabled = !isValid; exportJson.disabled = !isValid; exportCss.disabled = !isValid; renderPreview(); refreshRows(); updateDraftSummary(); ensureFocusedInput();
  }
  function remember(next: ProjectTokens): void { if (draftChanges(draft, next).length) { history.push(structuredClone(draft)); if (history.length > 50) history.shift(); draft = next; } }
  function changeValue(key: string, text: string): void { const canceled = cancelPendingImport(), next = structuredClone(draft), raw = text.trim(); if (!raw) delete next.overrides[selectedScope()][key]; else next.overrides[selectedScope()][key] = sources.semantics[key].$type === 'number' && /^\d+$/.test(raw) ? Number(raw) : raw; remember(next); updatePreview(canceled ? 'Pending import canceled; draft preview updated.' : undefined); }
  async function copyText(text: string): Promise<void> { try { await navigator.clipboard.writeText(text); if (!destroyed) status.textContent = `Copied ${text}.`; } catch { if (!destroyed) status.textContent = 'Clipboard unavailable. Select and copy the displayed text instead.'; } }
  scope.addEventListener('change', () => { const canceled = cancelPendingImport(); refreshRows(); if (canceled) status.textContent = 'Pending import canceled; your draft is unchanged.'; }, { signal });
  previewTheme.addEventListener('change', () => { refreshRows(); renderPreview(); }, { signal });
  matchPreview.addEventListener('click', () => { if (selectedScope() !== 'global') previewTheme.value = selectedScope(); refreshRows(); renderPreview(); previewTheme.focus(); }, { signal });
  for (const input of [search, category, modified]) input.addEventListener(input === search ? 'input' : 'change', filterRows, { signal });
  clearFilters.addEventListener('click', () => { search.value = ''; category.value = 'all'; modified.checked = false; filterRows(); search.focus(); }, { signal });
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
  refreshRows(); renderPreview(); updateDraftSummary(); activateView(0); status.textContent = getStorageNotice();
  return () => { destroyed = true; importRevision++; clearDraftGuard(); appearanceObserver.disconnect(); controller.abort(); primaryScene.destroy(); comparisonScene.destroy(); workspace.destroy(); section.remove(); };
}
