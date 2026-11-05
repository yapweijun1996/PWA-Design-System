import contractText from '../../../../../packages/agent-contract/component-contracts.json?raw';
import '../../../../../packages/core/src/foundation/foundation.css';
import '../../../../../packages/core/src/forms/forms.css';
import '../../../../../packages/core/src/navigation/navigation.css';
import '../../../../../packages/core/src/feedback/feedback.css';
import '../../../../../packages/core/src/table/table.css';
import './playground.css';
import { buildPreview, defaultConfig, specs, validateConfig, validateEditableMetadata, type PlaygroundConfig } from './adapters.js';
import { axes, validateProject } from '../../../../../packages/tokens/src/engine.mjs';
import { getCommitted, setTokenMap } from '../tokens/model.js';
import { sources } from '../tokens/sources.js';

interface Property { name: string; type: string; required: boolean; defaultValue: string; editable: boolean; reason: string }
interface Entry { family: string; factory: string; entry: string; optionType: string; keyboard: string[]; states: string[]; apiNotes: string; properties: Property[] }
function inventory(): Entry[] {
  const value: unknown = JSON.parse(contractText);
  if (!value || typeof value !== 'object' || !('components' in value) || !Array.isArray(value.components) || value.components.length !== Object.keys(specs).length) throw new Error('Invalid component inventory');
  const seen = new Set<string>();
  return value.components.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid component entry');
    const record = item as Record<string, unknown>;
    const { family, factory, entry, optionType, keyboard, states, apiNotes, properties } = record;
    if (typeof family !== 'string' || !Object.hasOwn(specs, family) || seen.has(family) || typeof factory !== 'string' || !/^create[A-Za-z]+$/.test(factory) || typeof entry !== 'string' || !/^@pwa-design-system\/core\/[a-z-]+$/.test(entry) || typeof optionType !== 'string' || optionType.length > 80 || typeof apiNotes !== 'string' || apiNotes.length > 256 || !Array.isArray(keyboard) || !Array.isArray(states) || [...keyboard, ...states].some(text => typeof text !== 'string' || text.length > 256) || !Array.isArray(properties) || properties.length < 1 || properties.length > 20) throw new Error('Invalid component entry');
    const propertyNames = new Set<string>();
    for (const value of properties) {
      if (!value || typeof value !== 'object') throw new Error('Invalid component property');
      const p = value as Record<string, unknown>;
      if (typeof p.name !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(p.name) || propertyNames.has(p.name) || typeof p.type !== 'string' || p.type.length > 256 || typeof p.defaultValue !== 'string' || p.defaultValue.length > 256 || typeof p.reason !== 'string' || p.reason.length > 256 || typeof p.required !== 'boolean' || typeof p.editable !== 'boolean') throw new Error('Invalid component property');
      propertyNames.add(p.name);
    }
    validateEditableMetadata(family, properties as Property[]);
    seen.add(family); return { family, factory, entry, optionType, keyboard, states, apiNotes, properties } as Entry;
  });
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node;
}
const title = (value: string): string => value.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');

/** Mount the catalog and playground. Returned teardown releases its component and event listeners. */
export function mountPlayground(root: HTMLElement): () => void {
  const entries = inventory();
  const controller = new AbortController();
  const signal = controller.signal;
  const page = element('div', 'pg-page');
  const heading = element('h1', '', 'Components');
  const intro = element('p', 'pg-intro', 'Browse the component library and try supported properties.');
  const layout = element('div', 'pg-layout');
  const catalog = element('section', 'pg-catalog'); catalog.setAttribute('aria-label', 'Component catalog');
  const searchLabel = element('label', 'pg-label', 'Search components'); searchLabel.htmlFor = 'pg-search';
  const search = element('input', 'pg-input'); search.id = 'pg-search'; search.type = 'search'; search.placeholder = 'Search by name';
  const list = element('div', 'pg-list'); list.setAttribute('role', 'region'); list.setAttribute('aria-label', 'Scrollable component list'); list.setAttribute('aria-describedby', 'pg-list-help'); list.tabIndex = 0;
  const listHelp = element('p', 'pg-list-help', 'Scroll the list to see more components, or use search to filter.'); listHelp.id = 'pg-list-help';
  const empty = element('p', 'pg-empty', 'No matching components.'); empty.hidden = true;
  catalog.append(searchLabel, search, listHelp, list, empty);
  const detail = element('section', 'pg-detail'); detail.setAttribute('aria-label', 'Component playground');
  layout.append(catalog, detail); page.append(heading, intro, layout); root.append(page);
  let selected = entries[0]; let config: PlaygroundConfig = defaultConfig(selected.family);
  let previewTheme = 'studio';
  let active: ReturnType<typeof buildPreview> | undefined;
  let listController = new AbortController(); let detailController = new AbortController();

  function renderList(): void {
    listController.abort(); listController = new AbortController();
    list.replaceChildren(); const term = search.value.trim().toLowerCase();
    const matches = entries.filter(entry => title(entry.family).toLowerCase().includes(term) || entry.family.includes(term));
    empty.hidden = matches.length > 0;
    for (const item of matches) {
      const button = element('button', 'pg-catalog-item', title(item.family)); button.type = 'button'; button.dataset.family = item.family; button.setAttribute('aria-pressed', String(selected.family === item.family));
      button.addEventListener('click', () => { selected = item; config = defaultConfig(item.family); for (const node of list.querySelectorAll('button')) node.setAttribute('aria-pressed', String(node.dataset.family === item.family)); renderDetail(); }, { signal: listController.signal });
      list.append(button);
    }
  }
  function renderDetail(): void {
    detailController.abort(); detailController = new AbortController(); const detailSignal = detailController.signal;
    active?.destroy(); active = undefined; detail.replaceChildren();
    const name = element('h2', '', title(selected.family));
    const spec = specs[selected.family];
    const note = element('p', 'pg-intro', spec.note);
    const api = element('p', 'pg-api', `API: ${selected.factory} · ${selected.optionType} · ${selected.entry}`);
    const apiDetails = element('details', 'pg-api-details');
    const apiSummary = element('summary', '', 'Component API and defaults');
    const apiNotes = element('p', 'pg-api', selected.apiNotes); const properties = element('dl', 'pg-properties');
    for (const property of selected.properties) {
      const term = element('dt', '', property.name);
      const description = element('dd', '', `${property.type} · ${property.required ? 'required' : `default: ${property.defaultValue}`} · ${property.editable ? 'editable' : 'not editable'}: ${property.reason}`);
      properties.append(term, description);
    }
    apiDetails.append(apiSummary, apiNotes, properties);
    const key = element('p', 'pg-api', `Keyboard: ${selected.keyboard.join(' ')}`);
    const supported = element('p', 'pg-api', `Documented states: ${selected.states.join(', ')}. Controls below expose only the properties supported by this preview.`);
    const theme = element('p', 'pg-api', 'Choose an isolated preview theme, or follow the Studio. Theme is host styling and is not included in the component snippet.');
    const controls = element('div', 'pg-controls');
    const themeWrap = element('div', 'pg-field'); const themeLabel = element('label', 'pg-label', 'Preview theme'); themeLabel.htmlFor = 'pg-theme';
    const themeSelect = element('select', 'pg-select'); themeSelect.id = 'pg-theme';
    for (const [value, label] of [['studio', 'Studio'], ['light', 'Light'], ['dark', 'Dark']]) { const option = element('option', '', label); option.value = value; themeSelect.append(option); }
    themeSelect.value = previewTheme;
    themeWrap.append(themeLabel, themeSelect); controls.append(themeWrap);
    const labelWrap = element('div', 'pg-field');
    const labelCaption = element('label', 'pg-label', 'Label or message'); labelCaption.htmlFor = 'pg-label';
    const labelInput = element('input', 'pg-input'); labelInput.id = 'pg-label'; labelInput.value = config.label; labelInput.maxLength = 80;
    const error = element('p', 'pg-error'); error.id = 'pg-error'; error.setAttribute('role', 'status');
    if (selected.family !== 'separator') { labelWrap.append(labelCaption, labelInput); controls.append(labelWrap); }
    const choices: Partial<Record<'size' | 'variant' | 'state', HTMLSelectElement>> = {};
    for (const name of ['size', 'variant', 'state'] as const) {
      const values = spec[name];
      if (!values) continue;
      const wrap = element('div', 'pg-field'); const caption = element('label', 'pg-label', title(name)); const select = element('select', 'pg-select');
      select.id = `pg-${name}`; caption.htmlFor = select.id;
      for (const value of values) { const option = element('option', '', title(value)); option.value = value; select.append(option); }
      select.value = config[name]; choices[name] = select; wrap.append(caption, select); controls.append(wrap);
    }
    const extraControls: Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = {};
    for (const item of spec.extras ?? []) {
      const wrap = element('div', 'pg-field'); const caption = element('label', 'pg-label', item.label);
      const input = item.kind === 'select' ? element('select', 'pg-select') : item.kind === 'list' ? element('textarea', 'pg-input') : element('input', 'pg-input');
      input.id = `pg-extra-${item.key}`; caption.htmlFor = input.id;
      if (input instanceof HTMLSelectElement) for (const value of item.choices ?? []) { const option = element('option', '', value); option.value = value; input.append(option); }
      if (input instanceof HTMLInputElement && item.kind === 'number') { input.type = 'number'; input.min = String(item.min); input.max = String(item.max); }
      input.value = config.extras[item.key]; extraControls[item.key] = input; wrap.append(caption, input); controls.append(wrap);
    }
    const unsupported = element('p', 'pg-api', [!spec.size && 'Size', !spec.variant && 'Variant', !spec.state && 'State'].filter(Boolean).length ? `Not configurable in this preview: ${[!spec.size && 'size', !spec.variant && 'variant', !spec.state && 'state'].filter(Boolean).join(', ')}.` : '');
    const previewTitle = element('h3', '', 'Live preview'); const preview = element('div', 'pg-preview');
    const codeTitle = element('h3', '', 'Code example'); const codeWrap = element('pre', 'pg-code'); codeWrap.tabIndex = 0; codeWrap.setAttribute('aria-label', 'Code example'); const code = element('code'); codeWrap.append(code);
    const copy = element('button', 'pg-copy', 'Copy code'); copy.type = 'button';
    const copyStatus = element('p', 'pg-api pg-copy-status'); copyStatus.setAttribute('role', 'status');
    detail.append(name, previewTitle, preview, note, api, apiDetails, key, supported, theme, controls, error, unsupported, codeTitle, codeWrap, copy, copyStatus);
    let ownedTokens: string[] = [];
    function applyPreviewTheme(): void {
      for (const property of ownedTokens) preview.style.removeProperty(property);
      ownedTokens = []; preview.style.removeProperty('color-scheme');
      const preference = themeSelect.value; preview.dataset.previewTheme = preference;
      if (preference === 'studio') return;
      if (preference !== 'light' && preference !== 'dark') return;
      const attrs = document.documentElement.dataset;
      const palette = axes.palettes.includes(attrs.palette ?? '') ? attrs.palette : 'blue';
      const density = axes.density.includes(attrs.density ?? '') ? attrs.density : 'comfortable';
      const kit = axes.kits.includes(attrs.kit ?? '') ? attrs.kit : 'default';
      const values = validateProject(sources, getCommitted())[`${preference}/${palette}/${density}/${kit}`];
      if (!values) throw new Error('Preview token combination is unavailable');
      setTokenMap(preview, values);
      ownedTokens = Object.keys(values).map(name => `--ds-${name.replaceAll('.', '-')}`);
      preview.style.colorScheme = preference;
    }
    themeSelect.addEventListener('change', () => { previewTheme = themeSelect.value; applyPreviewTheme(); }, { signal: detailSignal });
    const appearanceObserver = new MutationObserver(applyPreviewTheme);
    appearanceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-density', 'data-kit'] });
    detailSignal.addEventListener('abort', () => appearanceObserver.disconnect(), { once: true });
    function update(): void {
      const candidate: PlaygroundConfig = { family: selected.family, label: selected.family === 'separator' ? config.label : labelInput.value, size: choices.size?.value ?? '', variant: choices.variant?.value ?? '', state: choices.state?.value ?? '', extras: Object.fromEntries(Object.entries(extraControls).map(([key, input]) => [key, input.value])) };
      const message = validateConfig(candidate); error.textContent = message ? `Cannot update preview: ${message}` : '';
      for (const input of [labelInput, ...Object.values(choices), ...Object.values(extraControls)]) input.removeAttribute('aria-invalid');
      const labelInvalid = selected.family !== 'separator' && (!labelInput.value.trim() || labelInput.value.length > 80);
      if (labelInvalid) { labelInput.setAttribute('aria-invalid', 'true'); labelInput.setAttribute('aria-describedby', error.id); }
      else labelInput.removeAttribute('aria-describedby');
      if (message) return;
      try {
        const next = buildPreview(candidate, selected.factory, selected.entry);
        active?.destroy(); active = next; preview.replaceChildren(next.element); next.afterMount?.(); config = candidate; code.textContent = next.code; copyStatus.textContent = '';
      } catch (problem) { error.textContent = problem instanceof Error ? problem.message : 'Unable to render this component.'; }
    }
    labelInput.addEventListener('input', update, { signal: detailSignal });
    for (const choice of Object.values(choices)) choice.addEventListener('change', update, { signal: detailSignal });
    for (const input of Object.values(extraControls)) input.addEventListener(input instanceof HTMLSelectElement ? 'change' : 'input', update, { signal: detailSignal });
    copy.addEventListener('click', async () => {
      try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(code.textContent ?? ''); if (!detailSignal.aborted) copyStatus.textContent = 'Code copied.'; }
      catch { if (!detailSignal.aborted) copyStatus.textContent = 'Copy failed. Select and copy the code manually.'; }
    }, { signal: detailSignal });
    applyPreviewTheme(); update();
  }
  search.addEventListener('input', renderList, { signal });
  renderList(); renderDetail();
  return () => { controller.abort(); listController.abort(); detailController.abort(); active?.destroy(); page.remove(); };
}
