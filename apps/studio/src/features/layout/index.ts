import './layout.css';

type Sample = 'dashboard' | 'erp-form' | 'data-table' | 'settings' | 'card-grid' | 'dialog' | 'mobile-navigation';
const samples: readonly { value: Sample; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' }, { value: 'erp-form', label: 'ERP form' },
  { value: 'data-table', label: 'Data table' }, { value: 'settings', label: 'Settings page' },
  { value: 'card-grid', label: 'Card grid' }, { value: 'dialog', label: 'Dialog' },
  { value: 'mobile-navigation', label: 'Mobile navigation' }
];
const tokenNames = ['color-background', 'color-surface', 'color-surface-alt', 'color-text', 'color-text-muted', 'color-border-subtle', 'color-border-control', 'color-primary', 'color-on-primary', 'color-link', 'color-focus', 'font-body', 'font-size-body', 'font-size-small', 'font-weight-heading', 'spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg', 'radius-card', 'radius-control', 'shadow-card', 'size-control-medium'] as const;

function element<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const result = doc.createElement(tag); result.className = className;
  if (text !== undefined) result.textContent = text;
  return result;
}
function field(doc: Document, label: string, value: string): HTMLLabelElement {
  const result = element(doc, 'label', 'sample-field', label);
  const input = element(doc, 'input'); input.value = value; result.append(input); return result;
}
function table(doc: Document): HTMLDivElement {
  const wrap = element(doc, 'div', 'sample-table-wrap'); wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', 'Scrollable example table');
  const table = element(doc, 'table'); const caption = element(doc, 'caption', '', 'Recent orders');
  const head = element(doc, 'thead'); const header = element(doc, 'tr');
  for (const name of ['Order', 'Customer', 'Status', 'Amount']) { const cell = element(doc, 'th', '', name); cell.scope = 'col'; header.append(cell); }
  head.append(header); const body = element(doc, 'tbody');
  for (const row of [['ORD-104', 'Northwind', 'Processing', '$240'], ['ORD-105', 'Harbor Co.', 'Ready', '$180'], ['ORD-106', 'Fieldworks', 'Draft', '$96']]) {
    const tr = element(doc, 'tr'); for (const value of row) tr.append(element(doc, 'td', '', value)); body.append(tr);
  }
  table.append(caption, head, body); wrap.append(table); return wrap;
}
function renderSample(doc: Document, sample: Sample): void {
  const app = element(doc, 'main', 'sample-app'); app.id = 'preview-main';
  const title = samples.find(item => item.value === sample)?.label ?? 'Layout example';
  const header = element(doc, 'header', 'sample-header'); header.append(element(doc, 'span', 'sample-kicker', 'EXAMPLE WORKSPACE'), element(doc, 'h1', '', title)); app.append(header);
  if (sample === 'dashboard') {
    const cards = element(doc, 'div', 'sample-grid');
    for (const [name, value] of [['Open orders', '24'], ['In progress', '08'], ['Completed', '16']]) { const card = element(doc, 'article', 'sample-card'); card.append(element(doc, 'p', 'sample-muted', name), element(doc, 'strong', 'sample-metric', value)); cards.append(card); }
    app.append(cards, table(doc));
  } else if (sample === 'erp-form') {
    const form = element(doc, 'form', 'sample-card sample-form');
    form.append(field(doc, 'Order reference', 'ORD-104'), field(doc, 'Customer', 'Northwind'), field(doc, 'Delivery date', '2026-11-10'), field(doc, 'Notes', 'Standard delivery'));
    app.append(form);
  } else if (sample === 'data-table') {
    app.append(element(doc, 'p', 'sample-muted', 'This is a local HTML layout example.'), table(doc));
  } else if (sample === 'settings') {
    const card = element(doc, 'section', 'sample-card'); card.append(element(doc, 'h2', '', 'Notifications'), element(doc, 'p', 'sample-muted', 'Example preferences for this preview.'));
    for (const label of ['Order updates', 'Weekly summary']) { const item = element(doc, 'label', 'sample-check'); const input = element(doc, 'input'); input.type = 'checkbox'; item.append(input, doc.createTextNode(label)); card.append(item); }
    app.append(card);
  } else if (sample === 'card-grid') {
    const grid = element(doc, 'div', 'sample-grid');
    for (const name of ['Orders', 'Inventory', 'Customers', 'Reports', 'Deliveries', 'Invoices']) { const card = element(doc, 'article', 'sample-card'); card.append(element(doc, 'h2', '', name), element(doc, 'p', 'sample-muted', 'Example content for a reusable layout.')); grid.append(card); }
    app.append(grid);
  } else if (sample === 'dialog') {
    const example = element(doc, 'dialog', 'sample-dialog'); example.open = true; example.setAttribute('aria-label', 'Example dialog');
    example.append(element(doc, 'h2', '', 'Confirm changes'), element(doc, 'p', 'sample-muted', 'A static dialog layout example.')); app.append(example);
  } else {
    const nav = element(doc, 'nav', 'sample-mobile-nav'); nav.setAttribute('aria-label', 'Example navigation');
    for (const label of ['Overview', 'Orders', 'Settings']) { const a = element(doc, 'a', '', label); a.href = '#preview-main'; nav.append(a); }
    app.append(nav, element(doc, 'p', 'sample-muted', 'Navigation adapts as the preview width changes.'));
  }
  doc.body.replaceChildren(app);
}
const frameStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--ds-color-text); background: var(--ds-color-background); font: var(--ds-font-size-body) var(--ds-font-body); }
  .sample-app { padding: var(--ds-spacing-lg); max-width: 75rem; margin: auto; }
  .sample-header { margin-bottom: var(--ds-spacing-lg); } h1 { margin: var(--ds-spacing-xs) 0 0; font-size: 1.5rem; } h2 { font-size: 1rem; margin: 0 0 var(--ds-spacing-sm); }
  .sample-kicker { font-size: var(--ds-font-size-small); color: var(--ds-color-link); font-weight: var(--ds-font-weight-heading); }
  .sample-muted { color: var(--ds-color-text-muted); line-height: 1.5; margin: 0 0 var(--ds-spacing-md); }
  .sample-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: var(--ds-spacing-md); margin-bottom: var(--ds-spacing-lg); }
  .sample-card, .sample-dialog { min-width: 0; padding: var(--ds-spacing-lg); border: 1px solid var(--ds-color-border-subtle); border-radius: var(--ds-radius-card); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-card); }
  .sample-metric { font-size: 1.5rem; } .sample-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); gap: var(--ds-spacing-md); }
  .sample-field { display: grid; gap: var(--ds-spacing-sm); font-size: var(--ds-font-size-small); font-weight: var(--ds-font-weight-heading); }
  .sample-field input { min-width: 0; min-height: var(--ds-size-control-medium); padding: var(--ds-spacing-sm); color: var(--ds-color-text); background: var(--ds-color-surface); border: 1px solid var(--ds-color-border-control); border-radius: var(--ds-radius-control); font: inherit; font-size: max(1rem, var(--ds-font-size-body)); }
  .sample-check { display: flex; gap: var(--ds-spacing-sm); align-items: center; min-height: var(--ds-size-control-medium); }
  .sample-table-wrap { max-width: 100%; overflow-x: auto; border: 1px solid var(--ds-color-border-subtle); border-radius: var(--ds-radius-control); background: var(--ds-color-surface); }
  table { border-collapse: collapse; width: 100%; min-width: 30rem; } caption { text-align: start; padding: var(--ds-spacing-md); font-weight: var(--ds-font-weight-heading); }
  th, td { padding: var(--ds-spacing-md); border-top: 1px solid var(--ds-color-border-subtle); text-align: start; white-space: nowrap; font-size: var(--ds-font-size-small); }
  .sample-dialog { position: static; display: block; width: min(100%, 24rem); margin: 0; color: var(--ds-color-text); }
  .sample-mobile-nav { display: flex; flex-wrap: wrap; gap: var(--ds-spacing-md); padding: var(--ds-spacing-md); margin-bottom: var(--ds-spacing-lg); background: var(--ds-color-surface); border: 1px solid var(--ds-color-border-subtle); border-radius: var(--ds-radius-control); }
  a { color: var(--ds-color-link); } :focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
`;

/** The iframe is a local layout sandbox; it never executes scripts or loads external assets. */
export function mountLayoutPlayground(root: HTMLElement): () => void {
  const controller = new AbortController(); const signal = controller.signal;
  const header = element(document, 'header', 'layout-heading');
  header.append(element(document, 'p', 'layout-eyebrow', 'WORKSPACE / RESPONSIVE'), element(document, 'h1', 'layout-title', 'Layout Playground'), element(document, 'p', 'layout-description', 'Inspect local layout examples in an isolated, adjustable viewport.'));
  const controls = element(document, 'section', 'layout-controls'); controls.setAttribute('aria-label', 'Preview controls');
  const presetGroup = element(document, 'div', 'layout-presets'); presetGroup.setAttribute('role', 'group'); presetGroup.setAttribute('aria-label', 'Viewport presets');
  let width = 768; let current: Sample = 'dashboard';
  const presetButtons: HTMLButtonElement[] = [];
  for (const [name, value] of [['Mobile', 390], ['Tablet', 768], ['Desktop', 1440]] as const) {
    const button = element(document, 'button', 'layout-preset', `${name} · ${value}px`); button.type = 'button'; button.dataset.width = String(value);
    button.addEventListener('click', () => setWidth(value), { signal }); presetButtons.push(button); presetGroup.append(button);
  }
  const grid = element(document, 'div', 'layout-control-grid');
  const sampleLabel = element(document, 'label', 'layout-field', 'Example'); const sampleSelect = element(document, 'select', 'layout-select'); sampleSelect.id = 'layout-example'; sampleLabel.htmlFor = sampleSelect.id;
  for (const option of samples) { const item = element(document, 'option', '', option.label); item.value = option.value; sampleSelect.append(item); }
  sampleLabel.append(sampleSelect);
  const widthLabel = element(document, 'label', 'layout-field', 'Viewport width (px)'); const widthInput = element(document, 'input', 'layout-width'); widthInput.type = 'number'; widthInput.id = 'layout-width'; widthInput.min = '320'; widthInput.max = '1600'; widthInput.step = '1'; widthLabel.htmlFor = widthInput.id; widthLabel.append(widthInput);
  const rangeLabel = element(document, 'label', 'layout-field', 'Adjust width'); const range = element(document, 'input', 'layout-range'); range.type = 'range'; range.min = '320'; range.max = '1600'; range.step = '1'; range.id = 'layout-range'; rangeLabel.htmlFor = range.id; rangeLabel.append(range);
  grid.append(sampleLabel, widthLabel, rangeLabel); controls.append(presetGroup, grid);
  const feedback = element(document, 'p', 'layout-hint', 'The preview scrolls horizontally when its viewport is wider than this screen.');
  const shell = element(document, 'section', 'layout-preview-shell'); shell.setAttribute('aria-label', 'Layout preview');
  const bar = element(document, 'div', 'layout-preview-bar'); const caption = element(document, 'span', '', 'Live viewport'); const widthDisplay = element(document, 'output', 'layout-width-display'); widthDisplay.setAttribute('aria-live', 'polite'); bar.append(caption, widthDisplay);
  const scroller = element(document, 'div', 'layout-preview-scroll'); scroller.tabIndex = 0; scroller.setAttribute('role', 'region'); scroller.setAttribute('aria-label', 'Scrollable preview viewport');
  const frame = element(document, 'iframe', 'layout-frame'); frame.title = 'Layout preview'; frame.setAttribute('sandbox', 'allow-same-origin');
  scroller.append(frame); shell.append(bar, scroller); root.append(header, controls, feedback, shell);
  const updateTokens = () => {
    const doc = frame.contentDocument; if (!doc) return;
    const computed = getComputedStyle(document.documentElement);
    for (const name of tokenNames) doc.documentElement.style.setProperty(`--ds-${name}`, computed.getPropertyValue(`--ds-${name}`).trim());
    doc.documentElement.style.colorScheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  };
  function setWidth(next: number): void {
    if (!Number.isInteger(next) || next < 320 || next > 1600) return;
    width = next; widthInput.setCustomValidity(''); widthInput.value = String(width); range.value = String(width); frame.style.width = `${width}px`; widthDisplay.value = `${width} px`;
    for (const button of presetButtons) button.setAttribute('aria-pressed', String(Number(button.dataset.width) === width));
  }
  sampleSelect.addEventListener('change', () => { const selected = samples.find(sample => sample.value === sampleSelect.value); if (!selected) return; current = selected.value; if (frame.contentDocument) renderSample(frame.contentDocument, current); }, { signal });
  range.addEventListener('input', () => setWidth(Number(range.value)), { signal });
  widthInput.addEventListener('change', () => { const next = Number(widthInput.value); if (!Number.isInteger(next) || next < 320 || next > 1600) { widthInput.setCustomValidity('Enter a width from 320 to 1600 pixels.'); widthInput.reportValidity(); return; } widthInput.setCustomValidity(''); setWidth(next); }, { signal });
  widthInput.addEventListener('input', () => widthInput.setCustomValidity(''), { signal });
  frame.addEventListener('load', () => { const doc = frame.contentDocument; if (!doc) return; const style = doc.createElement('style'); style.textContent = frameStyles; doc.head.append(style); updateTokens(); renderSample(doc, current); }, { signal });
  const observer = new MutationObserver(updateTokens); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-theme', 'data-palette', 'data-density', 'data-kit'] });
  setWidth(width); frame.srcdoc = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>';
  return () => { controller.abort(); observer.disconnect(); };
}
