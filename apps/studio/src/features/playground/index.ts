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
const groups: Record<string, string> = { input: 'Forms', textarea: 'Forms', checkbox: 'Forms', 'radio-group': 'Forms', switch: 'Forms', select: 'Forms', 'form-field': 'Forms', tabs: 'Navigation', breadcrumb: 'Navigation', menu: 'Navigation', pagination: 'Navigation', dialog: 'Feedback', alert: 'Feedback', toast: 'Feedback', 'data-table': 'Data' };
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
  catalog.id = 'pg-catalog';
  const catalogToggle = element('button', 'pg-catalog-toggle', 'Explorer'); catalogToggle.type = 'button'; catalogToggle.setAttribute('aria-label', 'Explorer: Button'); catalogToggle.setAttribute('aria-controls', catalog.id);
  const narrow = window.matchMedia(`(max-width: ${sources.primitives['breakpoint.desktop'].$value})`);
  const phone = window.matchMedia(`(max-width: ${Number.parseInt(String(sources.primitives['breakpoint.mobile'].$value), 10) - 1}px)`); let catalogOpen = false, toggleHadFocus = false, mobilePanel = 'preview';
  const panelNav = element('div', 'pg-panel-nav'); panelNav.setAttribute('role', 'group'); panelNav.setAttribute('aria-label', 'Workspace panels');
  const previewPanelButton = element('button', 'pg-tool', 'Preview'), propertiesPanelButton = element('button', 'pg-tool', 'Properties');
  previewPanelButton.type = propertiesPanelButton.type = 'button'; panelNav.append(catalogToggle, previewPanelButton, propertiesPanelButton);
  const syncPanels = (): void => { const stage = page.querySelector<HTMLElement>('.pg-stage'), inspector = page.querySelector<HTMLElement>('.pg-settings'); if (stage) stage.hidden = phone.matches && (catalogOpen || mobilePanel !== 'preview'); if (inspector) inspector.hidden = phone.matches && (catalogOpen || mobilePanel !== 'properties'); previewPanelButton.setAttribute('aria-pressed', String(!catalogOpen && mobilePanel === 'preview')); propertiesPanelButton.setAttribute('aria-pressed', String(!catalogOpen && mobilePanel === 'properties')); };
  previewPanelButton.addEventListener('click', () => { mobilePanel = 'preview'; catalogOpen = false; syncCatalog(); syncPanels(); }, { signal });
  propertiesPanelButton.addEventListener('click', () => { mobilePanel = 'properties'; catalogOpen = false; syncCatalog(); syncPanels(); }, { signal });
  const reconcilePanels = (): void => {
    if (!phone.matches) return;
    const active = document.activeElement;
    if (catalog.contains(active)) catalogOpen = true;
    else if (page.querySelector('.pg-settings')?.contains(active)) { catalogOpen = false; mobilePanel = 'properties'; }
    else if (page.querySelector('.pg-stage')?.contains(active)) { catalogOpen = false; mobilePanel = 'preview'; }
  };
  phone.addEventListener('change', () => { reconcilePanels(); if (!phone.matches && (document.activeElement === previewPanelButton || document.activeElement === propertiesPanelButton)) heading.focus(); syncCatalog(); }, { signal });
  const syncCatalog = (): void => { catalog.hidden = narrow.matches && !catalogOpen; catalogToggle.setAttribute('aria-expanded', String(!catalog.hidden)); syncPanels(); if (!narrow.matches) { const active = document.activeElement; if (active === catalogToggle || (toggleHadFocus && active === document.body)) heading.focus(); toggleHadFocus = false; } };
  heading.tabIndex = -1;
  // A media-query CSS change can hide/blur the toggle before its change event fires.
  catalogToggle.addEventListener('focus', () => { toggleHadFocus = true; }, { signal });
  catalogToggle.addEventListener('blur', () => { if (narrow.matches) toggleHadFocus = false; }, { signal });
  document.addEventListener('pointerdown', event => { if (event.target !== catalogToggle) toggleHadFocus = false; }, { signal, capture: true });
  catalogToggle.addEventListener('click', () => { catalogOpen = !catalogOpen; syncCatalog(); if (catalogOpen) search.focus(); }, { signal });
  catalog.addEventListener('keydown', event => { if (event.key === 'Escape' && narrow.matches) { event.preventDefault(); catalogOpen = false; syncCatalog(); catalogToggle.focus(); } }, { signal });
  narrow.addEventListener('change', () => { reconcilePanels(); if (narrow.matches && catalog.contains(document.activeElement)) catalogOpen = true; syncCatalog(); }, { signal });
  const filters = element('div', 'pg-categories'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Component categories'); let category = 'All';
  for (const value of ['All', 'Foundation', 'Forms', 'Navigation', 'Feedback', 'Data']) { const count = entries.filter(item => value === 'All' || (groups[item.family] ?? 'Foundation') === value).length; const filter = element('button', 'pg-category', `${value} ${count}`); filter.type = 'button'; filter.setAttribute('aria-pressed', String(value === category)); filter.addEventListener('click', () => { category = value; for (const node of filters.querySelectorAll('button')) node.setAttribute('aria-pressed', String(node === filter)); renderList(); }, { signal }); filters.append(filter); }
  const catalogHeader = element('div', 'pg-catalog-header'); catalogHeader.append(element('h2', '', 'Component Explorer'), searchLabel, search, filters, listHelp); catalog.append(catalogHeader, list, empty);
  const detail = element('section', 'pg-detail'); detail.setAttribute('aria-label', 'Component playground');
  layout.append(catalog, detail); page.append(heading, intro, panelNav, layout); root.append(page);
  let selected = entries[0]; let config: PlaygroundConfig = defaultConfig(selected.family);
  let previewTheme = 'studio', previewWidth = 'fit';
  let active: ReturnType<typeof buildPreview> | undefined;
  let listController = new AbortController(); let detailController = new AbortController();

  function renderList(): void {
    listController.abort(); listController = new AbortController();
    list.replaceChildren(); const term = search.value.trim().toLowerCase();
    const matches = entries.filter(entry => title(entry.family).toLowerCase().includes(term) || entry.family.includes(term));
    const visible = matches.filter(entry => category === 'All' || (groups[entry.family] ?? 'Foundation') === category);
    empty.hidden = visible.length > 0;
    listHelp.textContent = `${visible.length} of ${entries.length} components · Search or scroll to explore.`;
    for (const item of visible) {
      const button = element('button', 'pg-catalog-item', title(item.family)); button.type = 'button'; button.dataset.family = item.family; button.setAttribute('aria-pressed', String(selected.family === item.family));
      button.addEventListener('click', () => { selected = item; config = defaultConfig(item.family); for (const node of list.querySelectorAll('button')) node.setAttribute('aria-pressed', String(node.dataset.family === item.family)); renderDetail(); catalogToggle.setAttribute('aria-label', `Explorer: ${title(item.family)}`); if (narrow.matches) { catalogOpen = false; mobilePanel = 'preview'; syncCatalog(); syncPanels(); detail.querySelector<HTMLElement>('h2')?.focus(); } }, { signal: listController.signal });
      list.append(button);
    }
  }
  function renderDetail(): void {
    detailController.abort(); detailController = new AbortController(); const detailSignal = detailController.signal;
    active?.destroy(); active = undefined; detail.replaceChildren();
    const name = element('h2', '', title(selected.family)); name.tabIndex = -1;
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
    const previewTitle = element('h3', '', 'Live preview'); const preview = element('div', 'pg-preview'); preview.dataset.family = selected.family;
    const codeTitle = element('h3', '', 'Code example'); const codeWrap = element('pre', 'pg-code'); codeWrap.tabIndex = 0; codeWrap.setAttribute('aria-label', 'Code example'); const code = element('code'); codeWrap.append(code);
    const copy = element('button', 'pg-copy', 'Copy code'); copy.type = 'button';
    const copyStatus = element('p', 'pg-api pg-copy-status'); copyStatus.setAttribute('role', 'status');
    const workbench = element('div', 'pg-workbench'), stage = element('section', 'pg-stage'), settings = element('section', 'pg-settings');
    stage.setAttribute('aria-label', 'Live component preview'); settings.setAttribute('aria-label', 'Preview properties');
    const deviceWrap = element('div', 'pg-device-control'), deviceLabel = element('label', 'pg-label', 'Preview width'), device = element('select', 'pg-select'); device.id = 'pg-device'; deviceLabel.htmlFor = device.id;
    for (const [value, label] of [['fit', 'Fit workspace'], ['390', 'Mobile · 390px'], ['768', 'Tablet · 768px'], ['1440', 'Desktop · 1440px']]) { const option = element('option', '', label); option.value = value; device.append(option); }
    device.value = previewWidth; deviceWrap.append(deviceLabel, device); const widthStatus = element('output', 'pg-width-status'); widthStatus.setAttribute('aria-label', 'Preview canvas width');
    const toolbar = element('div', 'pg-toolbar'); toolbar.setAttribute('aria-label', 'Component tools'); const viewCode = element('button', 'pg-tool', 'View code'), reset = element('button', 'pg-tool', 'Reset properties'); viewCode.type = reset.type = 'button'; toolbar.append(deviceWrap, widthStatus, viewCode, reset);
    const canvas = element('div', 'pg-canvas-scroll'); canvas.tabIndex = 0; canvas.setAttribute('role', 'region'); canvas.setAttribute('aria-label', 'Scrollable preview canvas'); canvas.append(preview);
    const canvasHelp = element('details', 'pg-canvas-help'); canvasHelp.append(element('summary', '', 'About canvas sizing'), element('p', 'pg-list-help', 'Canvas width changes component space. Browser media queries and portaled overlays follow the Studio viewport.'));
    const syncWidth = (): void => { preview.style.width = device.value === 'fit' ? '100%' : `${device.value}px`; preview.dataset.canvasWidth = device.value; widthStatus.value = `${Math.round(preview.getBoundingClientRect().width)}px canvas`; canvas.scrollLeft = 0; };
    device.addEventListener('change', () => { previewWidth = device.value; syncWidth(); }, { signal: detailSignal }); const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(syncWidth) : undefined; resize?.observe(canvas); detailSignal.addEventListener('abort', () => resize?.disconnect(), { once: true });
    const tabBar = element('div', 'pg-tabs'); tabBar.setAttribute('role', 'tablist'); tabBar.setAttribute('aria-label', 'Component information');
    const panels = new Map<string, HTMLElement>(); const previewPanel = element('div', 'pg-preview-panel'), usagePanel = element('div'), apiPanel = element('div'), accessibilityPanel = element('div');
    previewPanel.append(previewTitle, canvas, canvasHelp); stage.append(name, toolbar, tabBar); settings.append(element('h2', '', 'Properties'), controls, error); workbench.append(stage, settings);
    const activateTab = (label: string, focus = false): void => { for (const [key, panel] of panels) { panel.hidden = key !== label; const tab = tabBar.querySelector<HTMLButtonElement>(`[data-panel="${key}"]`); tab?.setAttribute('aria-selected', String(key === label)); if (tab) tab.tabIndex = key === label ? 0 : -1; if (focus && key === label) tab?.focus(); } };
    for (const [label, panel] of [['Preview', previewPanel], ['Usage', usagePanel], ['API', apiPanel], ['Accessibility', accessibilityPanel]] as const) { const tab = element('button', 'pg-tab', label); tab.type = 'button'; tab.setAttribute('role', 'tab'); tab.id = `pg-tab-${label}`; tab.dataset.panel = label; panel.id = `pg-panel-${label}`; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id); tab.setAttribute('aria-controls', panel.id); panels.set(label, panel); tab.addEventListener('click', () => activateTab(label), { signal: detailSignal }); tabBar.append(tab); stage.append(panel); }
    tabBar.addEventListener('keydown', event => { const labels = [...panels.keys()], index = labels.findIndex(label => tabBar.querySelector(`[data-panel="${label}"]`) === document.activeElement); let next = index; if (event.key === 'ArrowRight') next = (index + 1) % labels.length; else if (event.key === 'ArrowLeft') next = (index + labels.length - 1) % labels.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = labels.length - 1; else return; event.preventDefault(); activateTab(labels[next], true); }, { signal: detailSignal });
    const options = element('div', 'pg-options');
    for (const property of ['variant', 'size', 'state'] as const) { const values = spec[property]; if (!values) continue; const group = element('div', 'pg-option-group'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', `Quick ${property}`); group.append(element('h4', '', `${title(property)} options`)); for (const value of values) { const option = element('button', 'pg-option', title(value)); option.type = 'button'; option.dataset.choice = property; option.dataset.value = value; option.addEventListener('click', () => { const select = choices[property]; if (select) { select.value = value; update(); } }, { signal: detailSignal }); group.append(option); } options.append(group); }
    previewPanel.append(options);
    if (selected.family === 'button') {
      const examples = element('section', 'pg-examples'); examples.setAttribute('aria-label', 'Button examples'); examples.append(element('h3', '', 'Examples'), element('p', 'pg-list-help', 'Approved button variants in common action contexts. The inspector edits the live preview above.'));
      for (const [label, variant, state] of [['Create', 'primary', 'enabled'], ['Edit', 'secondary', 'enabled'], ['Saving…', 'primary', 'loading']] as const) { const sample = buildPreview({ ...defaultConfig('button'), label, variant, state }, selected.factory, selected.entry); examples.append(sample.element); detailSignal.addEventListener('abort', () => sample.destroy(), { once: true }); }
      previewPanel.append(examples);
    } viewCode.addEventListener('click', () => { mobilePanel = 'properties'; syncPanels(); codeWrap.focus(); codeWrap.scrollIntoView({ block: 'nearest' }); }, { signal: detailSignal }); reset.addEventListener('click', () => { config = defaultConfig(selected.family); renderDetail(); detail.querySelector<HTMLButtonElement>('.pg-toolbar button:last-child')?.focus(); }, { signal: detailSignal });
    activateTab('Preview');

    const usage = element('details', 'pg-usage'); usage.append(element('summary', '', 'Usage and accessibility'), note, supported, theme, unsupported); usage.open = true; accessibilityPanel.append(element('h3', '', 'Keyboard and accessibility'), key, element('p', 'pg-api', selected.apiNotes), element('p', 'pg-api', 'Automated examples do not establish WCAG conformance. Test assistive technology in your application.'));
    apiDetails.insertBefore(api, apiNotes);
    const codeHeader = element('div', 'pg-code-header'); codeHeader.append(codeTitle, copy);
    usagePanel.append(usage); apiPanel.append(apiDetails); apiDetails.open = true; settings.append(codeHeader, codeWrap, copyStatus); detail.append(workbench);
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
        active?.destroy(); active = next; preview.replaceChildren(next.element); next.afterMount?.(); config = candidate; code.textContent = next.code; copyStatus.textContent = ''; for (const option of options.querySelectorAll<HTMLButtonElement>('[data-choice]')) option.setAttribute('aria-pressed', String(candidate[option.dataset.choice as 'variant' | 'size' | 'state'] === option.dataset.value));
      } catch (problem) { error.textContent = problem instanceof Error ? problem.message : 'Unable to render this component.'; }
    }
    labelInput.addEventListener('input', update, { signal: detailSignal });
    for (const choice of Object.values(choices)) choice.addEventListener('change', update, { signal: detailSignal });
    for (const input of Object.values(extraControls)) input.addEventListener(input instanceof HTMLSelectElement ? 'change' : 'input', update, { signal: detailSignal });
    copy.addEventListener('click', async () => {
      try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(code.textContent ?? ''); if (!detailSignal.aborted) copyStatus.textContent = 'Code copied.'; }
      catch { if (!detailSignal.aborted) copyStatus.textContent = 'Copy failed. Select and copy the code manually.'; }
    }, { signal: detailSignal });
    applyPreviewTheme(); update(); syncPanels(); syncWidth();
  }
  search.addEventListener('input', renderList, { signal });
  renderList(); renderDetail(); syncCatalog();
  return () => { controller.abort(); listController.abort(); detailController.abort(); active?.destroy(); page.remove(); };
}
