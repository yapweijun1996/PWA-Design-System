// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPlayground } from '../../apps/studio/src/features/playground/index';
import { buildPreview, defaultConfig, specs, validateConfig, validateEditableMetadata } from '../../apps/studio/src/features/playground/adapters';
import { validateProject } from '../../packages/tokens/src/engine.mjs';
import { getCommitted } from '../../apps/studio/src/features/tokens/model';
import { sources } from '../../apps/studio/src/features/tokens/sources';
import { contrastRatio } from '../../apps/studio/src/features/accessibility/contrast';
import contractText from '../../packages/agent-contract/component-contracts.json?raw';
import * as core from '../../packages/core/src/index';

let media: MediaQueryList;
beforeEach(() => {
  // jsdom omits matchMedia; EventTarget supplies real signal-aware listener cleanup.
  media = Object.assign(new EventTarget(), { matches: false, media: '(max-width: 768px)', onchange: null }) as MediaQueryList;
  vi.stubGlobal('matchMedia', vi.fn(() => media)); vi.stubGlobal('innerWidth', 1440);
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function click(root: HTMLElement, selector: string): void {
  const node = root.querySelector<HTMLButtonElement>(selector); if (!node) throw new Error(`Missing ${selector}`); node.click();
}
describe('component playground', () => {
  it('responds to the catalog breakpoint and releases its listener on teardown', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    const catalog = root.querySelector<HTMLElement>('#components-explorer'), toggle = root.querySelector<HTMLButtonElement>('[aria-controls=components-explorer]');
    if (!catalog || !toggle) throw new Error('Missing catalog');
    expect(catalog.hidden).toBe(false);
    vi.stubGlobal('innerWidth', 390); window.dispatchEvent(new Event('resize'));
    expect(catalog.hidden).toBe(true); expect(toggle.getAttribute('aria-expanded')).toBe('false');
    destroy(); vi.stubGlobal('innerWidth', 1440); window.dispatchEvent(new Event('resize'));
    expect(catalog.hidden).toBe(true); expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
  it('filters real registry groups, edits through one Inspector and resets without losing focus', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    const category = root.querySelector<HTMLSelectElement>('#pg-category'); if (!category) throw new Error('Category missing');
    category.value = 'Forms'; category.dispatchEvent(new Event('change')); expect(root.querySelectorAll('.pg-catalog-item')).toHaveLength(7);
    category.value = 'All'; category.dispatchEvent(new Event('change'));
    const variant = root.querySelector<HTMLSelectElement>('#pg-variant'); if (!variant) throw new Error('Variant missing'); variant.value = 'secondary'; variant.dispatchEvent(new Event('change'));
    expect(root.querySelectorAll('#pg-variant')).toHaveLength(1); expect(root.querySelector('.pg-options')).toBeNull(); expect(root.querySelector('.pg-settings pre')).toBeNull();
    click(root, '#pg-tab-Code'); expect(root.querySelector('#pg-panel-Code')?.hasAttribute('hidden')).toBe(false); expect(root.querySelector('pre code')?.textContent).toContain('"variant": "secondary"');
    click(root, '.pg-reset'); expect(root.querySelector<HTMLSelectElement>('#pg-variant')?.value).toBe('primary'); expect(document.activeElement?.textContent).toBe('Reset properties'); expect(root.querySelector('#pg-panel-Code')?.hasAttribute('hidden')).toBe(false);
    click(root, '#pg-tab-API'); expect(root.querySelector('#pg-panel-API')?.hasAttribute('hidden')).toBe(false); expect(root.querySelector('#pg-panel-Preview')?.hasAttribute('hidden')).toBe(true);
    root.querySelector('#pg-tab-API')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })); expect(document.activeElement?.id).toBe('pg-tab-Preview');
    destroy();
  });
  it('shows only the selected phone workspace panel while preserving configuration', () => {
    vi.stubGlobal('innerWidth', 390);
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    click(root, '[aria-controls=components-explorer]'); expect(root.querySelector<HTMLElement>('.pg-stage')?.hidden).toBe(true); expect(root.querySelector<HTMLElement>('.pg-settings')?.hidden).toBe(true);
    click(root, '[aria-controls=components-inspector]'); expect(root.querySelector<HTMLElement>('.pg-settings')?.hidden).toBe(false); expect(root.querySelector<HTMLElement>('.pg-catalog')?.hidden).toBe(true);
    const label = root.querySelector<HTMLInputElement>('#pg-label'); if (!label) throw new Error('Label missing'); label.value = 'Retained'; label.dispatchEvent(new Event('input'));
    click(root, '[aria-controls=components-canvas]'); expect(root.querySelector('.pg-preview button')?.textContent).toBe('Retained'); expect(root.querySelector<HTMLElement>('.pg-settings')?.hidden).toBe(true); destroy();
  });
  it('keeps workspace selected text and indicators legible across all token combinations', () => {
    const combinations = validateProject(sources, getCommitted()); expect(Object.keys(combinations)).toHaveLength(96);
    for (const [name, values] of Object.entries(combinations)) {
      expect(contrastRatio(String(values['color.link']), String(values['color.surface-alt'])), name).toBeGreaterThanOrEqual(4.5);
      for (const surface of ['color.surface', 'color.surface-alt']) expect(contrastRatio(String(values['color.focus']), String(values[surface])), `${name}: ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });
  it('matches editable contract flags to controls and rejects editability drift', () => {
    const entries = JSON.parse(contractText).components as { family: string; properties: { name: string; editable: boolean }[] }[];
    for (const item of entries) expect(() => validateEditableMetadata(item.family, item.properties), item.family).not.toThrow();
    const button = structuredClone(entries.find(item => item.family === 'button'));
    if (!button) throw new Error('Button contract missing');
    const variant = button.properties.find(item => item.name === 'variant'); if (!variant) throw new Error('Variant contract missing');
    variant.editable = false; expect(() => validateEditableMetadata(button.family, button.properties)).toThrow(/mismatch/);
  });
  it('checks representative factory defaults in every family and catches default drift', () => {
    const entries = JSON.parse(contractText).components as { family: string; properties: { name: string; defaultValue: string }[] }[];
    const toast = core.createToast({ message: 'Saved' });
    const input = core.createInput({ id: 'default-input' });
    const card = core.createCard(); const badge = core.createBadge({ label: 'Status' });
    const tabs = core.createTabs({ label: 'Tabs', tabs: [{ label: 'A', content: 'A' }, { label: 'B', content: 'B' }] });
    const radio = core.createRadioGroup({ id: 'default-radio', name: 'choice', legend: 'Choice', options: [{ value: 'a', label: 'A' }] });
    const fieldControl = core.createInput({ id: 'default-field' }); const field = core.createFormField({ label: 'Name', control: fieldControl.element });
    const select = core.createSelect({ id: 'default-select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] });
    const table = core.createDataTable({ label: 'People', columns: [{ id: 'name', label: 'Name' }], rows: Array.from({ length: 11 }, (_, index) => ({ id: `row-${index}`, cells: { name: `Person ${index}` } })) });
    const tooltipRequired = () => core.createTooltip({ trigger: document.createElement('button'), text: '' });
    const checks: [string, string, string][] = [
      ['button', 'variant', core.createButton({ label: 'Save' }).element.dataset.variant ?? ''],
      ['icon-button', 'size', core.createIconButton({ label: 'Settings', icon: 'x' }).element.dataset.size ?? ''],
      ['badge', 'variant', badge.element.dataset.variant ?? ''], ['card', 'variant', card.element.dataset.variant ?? ''],
      ['separator', 'orientation', core.createSeparator().element.dataset.orientation ?? ''],
      ['tooltip', 'text', (() => { try { tooltipRequired(); return 'accepted'; } catch { return 'required'; } })()],
      ['input', 'type', input.element.type], ['textarea', 'rows', String(core.createTextarea({ id: 'default-area' }).element.rows)],
      ['checkbox', 'checked', String(core.createCheckbox({ id: 'default-check', label: 'Check' }).input.checked)],
      ['radio-group', 'value', radio.inputs.every(item => !item.checked) ? 'not supplied' : 'selected'],
      ['switch', 'checked', String(core.createSwitch({ id: 'default-switch', label: 'Switch' }).input.checked)],
      ['select', 'value', select.element.value === select.element.options[0].value ? 'first available option' : 'unexpected'],
      ['form-field', 'description', field.element.querySelector('.ds-field__description') ? 'present' : 'not supplied'],
      ['tabs', 'selectedIndex', tabs.element.querySelector('[role=tab][aria-selected=true]')?.textContent === 'A' ? '0' : 'unexpected'],
      ['breadcrumb', 'href', core.createBreadcrumb([{ label: 'Current' }]).element.querySelector('a') ? 'present' : 'not supplied'],
      ['menu', 'label', (() => { try { core.createMenu({ label: '', items: [{ label: 'Open', onSelect() {} }] }); return 'accepted'; } catch { return 'required'; } })()],
      ['pagination', 'label', core.createPagination({ page: 1, totalPages: 1, onChange() {} }).element.getAttribute('aria-label') ?? ''],
      ['dialog', 'closeLabel', core.createDialog({ title: 'Title', description: 'Description' }).element.querySelector('button')?.textContent ?? ''],
      ['alert', 'tone', core.createAlert({ message: 'Notice' }).element.classList.contains('ds-alert-info') ? 'info' : 'unexpected'],
      ['toast', 'dismissLabel', toast.element.querySelector('button')?.textContent ?? ''],
      ['data-table', 'pageSize', String(table.element.querySelectorAll('tbody tr').length)],
      ['data-table', 'selectable', String(Boolean(table.element.querySelector('input[type=checkbox]')))],
      ['data-table', 'loading', table.element.querySelector('[aria-busy]')?.getAttribute('aria-busy') ?? '']
    ];
    function checkDefaults(records: typeof entries): void {
      for (const [family, property, observed] of checks) {
        const field = records.find(item => item.family === family)?.properties.find(item => item.name === property);
        if (!field || field.defaultValue !== observed) throw new Error(`Default drift: ${family}.${property}`);
      }
    }
    expect(() => checkDefaults(entries)).not.toThrow();
    const changed = structuredClone(entries); const button = changed.find(item => item.family === 'button')?.properties.find(item => item.name === 'variant');
    if (!button) throw new Error('Button variant missing'); button.defaultValue = 'ghost';
    expect(() => checkDefaults(changed)).toThrow(/Default drift: button.variant/);
    const changedTable = structuredClone(entries); const pageSize = changedTable.find(item => item.family === 'data-table')?.properties.find(item => item.name === 'pageSize');
    if (!pageSize) throw new Error('Data table pageSize missing'); pageSize.defaultValue = '999';
    expect(() => checkDefaults(changedTable)).toThrow(/Default drift: data-table.pageSize/);
    toast.destroy(); tabs.destroy(); field.destroy(); table.destroy();
  });
  it('loads all 21 contract families, searches, selects and tears down', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    expect(root.querySelectorAll('.pg-catalog-item')).toHaveLength(21);
    const search = root.querySelector<HTMLInputElement>('#pg-search'); if (!search) throw new Error('Search missing');
    search.value = 'tooltip'; search.dispatchEvent(new Event('input')); expect(root.querySelectorAll('.pg-catalog-item')).toHaveLength(1);
    search.value = 'no-such-component'; search.dispatchEvent(new Event('input')); expect(root.querySelector('.pg-empty')?.hasAttribute('hidden')).toBe(false);
    search.value = ''; search.dispatchEvent(new Event('input')); click(root, '[data-family=badge]'); expect(root.querySelector('.pg-stage h2')?.textContent).toBe('Badge');
    destroy(); expect(root.children).toHaveLength(0);
  });
  it('constructs a real preview and code for every catalog family', () => {
    const show = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover');
    const hide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover');
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value() {} });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value() {} });
    try {
      const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
      for (const button of root.querySelectorAll<HTMLButtonElement>('.pg-catalog-item')) {
        button.click(); expect(root.querySelector('.pg-preview')?.children.length, button.dataset.family).toBe(1);
        expect(root.querySelector('pre code')?.textContent, button.dataset.family).toContain('const component = create');
      }
      destroy();
    } finally {
      if (show) Object.defineProperty(HTMLElement.prototype, 'showPopover', show); else Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      if (hide) Object.defineProperty(HTMLElement.prototype, 'hidePopover', hide); else Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });
  it('keeps preview and escaped code aligned for variants and hostile labels', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    const variant = root.querySelector<HTMLSelectElement>('#pg-variant'); const label = root.querySelector<HTMLInputElement>('#pg-label'); if (!variant || !label) throw new Error('Controls missing');
    variant.value = 'secondary'; variant.dispatchEvent(new Event('change'));
    label.value = '<img src=x onerror=alert(1)>'; label.dispatchEvent(new Event('input'));
    const preview = root.querySelector<HTMLElement>('.pg-preview'); const code = root.querySelector('pre code');
    expect(preview?.querySelector('img')).toBeNull(); expect(preview?.textContent).toBe(label.value);
    expect(preview?.querySelector('button')?.dataset.variant).toBe('secondary'); expect(code?.textContent).toContain('"variant": "secondary"'); expect(code?.textContent).toContain(JSON.stringify(label.value));
    const previous = code?.textContent; label.value = ' '; label.dispatchEvent(new Event('input')); expect(label.getAttribute('aria-invalid')).toBe('true'); expect(code?.textContent).toBe(previous); expect(preview?.textContent).toBe('<img src=x onerror=alert(1)>');
    destroy();
  });
  it('rejects unsupported values and factory mismatches', () => {
    const config = defaultConfig('button'); expect(validateConfig({ ...config, size: 'enormous' })).toMatch(/Unsupported size/);
    expect(() => buildPreview(config, 'createToast', '@pwa-design-system/core/button')).toThrow(/factory/);
  });
  it('wires scalar and structured properties to the same preview and snippet', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    click(root, '[data-family=input]');
    const type = root.querySelector<HTMLSelectElement>('#pg-extra-type'), value = root.querySelector<HTMLInputElement>('#pg-extra-value'), required = root.querySelector<HTMLSelectElement>('#pg-extra-required');
    if (!type || !value || !required) throw new Error('Input controls missing');
    type.value = 'email'; type.dispatchEvent(new Event('change')); value.value = 'one@example.test'; value.dispatchEvent(new Event('input')); required.value = 'true'; required.dispatchEvent(new Event('change'));
    const preview = root.querySelector<HTMLInputElement>('.pg-preview input'), code = root.querySelector('pre code')?.textContent ?? '';
    expect(preview?.type).toBe('email'); expect(preview?.value).toBe('one@example.test'); expect(preview?.required).toBe(true);
    expect(code).toContain('"type": "email"'); expect(code).toContain('"value": "one@example.test"'); expect(code).toContain('"required": true');
    click(root, '[data-family=select]'); const options = root.querySelector<HTMLTextAreaElement>('#pg-extra-options'); if (!options) throw new Error('Options missing');
    options.value = 'alpha | First\nbeta | Second | disabled'; options.dispatchEvent(new Event('input'));
    expect(root.querySelector('.pg-preview option')?.textContent).toBe('First'); expect(root.querySelectorAll('.pg-preview option')[1].hasAttribute('disabled')).toBe(true);
    expect(root.querySelector('pre code')?.textContent).toContain('"label": "First"');
    destroy();
  });
  it('edits menu labels and disabled flags, rejecting invalid lines transactionally', () => {
    const show = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover'), hide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover');
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value() {} });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value() {} });
    try {
      const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root); click(root, '[data-family=menu]');
      const input = root.querySelector<HTMLTextAreaElement>('#pg-extra-items'); if (!input) throw new Error('Menu editor missing');
      input.value = 'Archive\nReview'; input.dispatchEvent(new Event('input'));
      expect(root.querySelectorAll('.pg-preview [role=menuitem]')[0].textContent).toBe('Archive'); expect(root.querySelector('pre code')?.textContent).toContain('"label":"Archive"');
      input.value = 'Archive\nReview | disabled'; input.dispatchEvent(new Event('input'));
      expect(root.querySelectorAll('.pg-preview [role=menuitem]')[1].getAttribute('aria-disabled')).toBe('true'); expect(root.querySelector('pre code')?.textContent).toContain('"disabled":true');
      const previous = root.querySelector('pre code')?.textContent; input.value = 'Archive | unexpected'; input.dispatchEvent(new Event('input'));
      expect(root.querySelector('#pg-error')?.textContent).toContain('Invalid Items'); expect(root.querySelector('pre code')?.textContent).toBe(previous); expect(root.querySelectorAll('.pg-preview [role=menuitem]')[1].getAttribute('aria-disabled')).toBe('true');
      destroy();
    } finally {
      if (show) Object.defineProperty(HTMLElement.prototype, 'showPopover', show); else Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      if (hide) Object.defineProperty(HTMLElement.prototype, 'hidePopover', hide); else Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });
  it('changes real preview state and generated code for each offered control', async () => {
    const show = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover'), hide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover');
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value() {} });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value() {} });
    try {
      const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
      const snapshot = () => {
        const preview = root.querySelector<HTMLElement>('.pg-preview'); if (!preview) throw new Error('Preview missing');
        const values = [...preview.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')].map(input => [input.value, input instanceof HTMLInputElement ? input.checked : null]);
        return JSON.stringify([preview.innerHTML, values]);
      };
      async function change(family: string, selector: string, value: string, event: string): Promise<void> {
        click(root, `[data-family="${family}"]`);
        if (family === 'form-field' && selector === '#pg-extra-error') { const state = root.querySelector<HTMLSelectElement>('#pg-state'); if (!state) throw new Error('State missing'); state.value = 'error'; state.dispatchEvent(new Event('change')); }
        await Promise.resolve(); const before = snapshot(), code = root.querySelector('pre code')?.textContent;
        const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector); if (!input) throw new Error(`Missing ${family}.${selector}`);
        input.value = value; input.dispatchEvent(new Event(event)); await Promise.resolve();
        expect(root.querySelector('#pg-error')?.textContent, `${family}.${selector}`).toBe('');
        expect(snapshot(), `${family}.${selector}`).not.toBe(before); expect(root.querySelector('pre code')?.textContent, `${family}.${selector}`).not.toBe(code);
      }
      for (const [family, spec] of Object.entries(specs)) {
        if (family !== 'separator') await change(family, '#pg-label', 'Updated label', 'input');
        for (const key of ['size', 'variant', 'state'] as const) for (const value of spec[key]?.slice(1) ?? []) await change(family, `#pg-${key}`, value, 'change');
        for (const extra of spec.extras ?? []) {
          let value = 'Updated text';
          if (extra.kind === 'select') value = extra.choices?.[1] ?? '';
          else if (extra.kind === 'number') value = extra.key === 'selectedIndex' ? '1' : extra.key === 'page' ? '2' : String(Number(extra.initial) + 1);
          else if (extra.kind === 'list') value = family === 'menu' ? 'Updated action\nUnavailable | disabled' : extra.initial.replace(' | ', ' | Updated ');
          else if (extra.key === 'value' && (family === 'select' || family === 'radio-group')) value = family === 'select' ? 'b' : 'a';
          else if (extra.key === 'href') value = '/updated';
          await change(family, `#pg-extra-${extra.key}`, value, extra.kind === 'select' ? 'change' : 'input');
        }
      }
      destroy();
    } finally {
      if (show) Object.defineProperty(HTMLElement.prototype, 'showPopover', show); else Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      if (hide) Object.defineProperty(HTMLElement.prototype, 'hidePopover', hide); else Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });
  it('uses a form-level error summary without misattributing invalid extras', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root); click(root, '[data-family=textarea]');
    const rows = root.querySelector<HTMLInputElement>('#pg-extra-rows'), label = root.querySelector<HTMLInputElement>('#pg-label'); if (!rows || !label) throw new Error('Controls missing');
    const previous = root.querySelector('pre code')?.textContent; rows.value = '0'; rows.dispatchEvent(new Event('input'));
    expect(rows.hasAttribute('aria-invalid')).toBe(false); expect(label.hasAttribute('aria-invalid')).toBe(false); expect(root.querySelector('#pg-error')?.textContent).toContain('Rows'); expect(root.querySelector('pre code')?.textContent).toBe(previous);
    const placeholder = root.querySelector<HTMLInputElement>('#pg-extra-placeholder'); if (!placeholder) throw new Error('Placeholder missing'); placeholder.value = 'Valid'; placeholder.dispatchEvent(new Event('input'));
    expect(placeholder.hasAttribute('aria-invalid')).toBe(false); expect(root.querySelector('#pg-error')?.textContent).toContain('Rows');
    destroy();
  });
  it('mounts an empty assertive alert before setting its message', () => {
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root); click(root, '[data-family=alert]');
    const select = root.querySelector<HTMLSelectElement>('#pg-extra-assertive'); if (!select) throw new Error('Assertive control missing');
    select.value = 'true'; select.dispatchEvent(new Event('change'));
    expect(root.querySelector('.pg-preview [role=alert]')?.textContent).toBe('Review your settings.');
    const code = root.querySelector('pre code')?.textContent ?? ''; expect(code).toContain('message: ""'); expect(code.indexOf('document.body.append')).toBeLessThan(code.indexOf('component.setMessage'));
    destroy();
  });
  it('changes only preview theme, retains other axes and leaves component code unchanged', () => {
    Object.assign(document.documentElement.dataset, { theme: 'light', palette: 'teal', density: 'compact', kit: 'minimal' });
    const root = document.createElement('div'); document.body.append(root); const destroy = mountPlayground(root);
    const select = root.querySelector<HTMLSelectElement>('#pg-theme'), preview = root.querySelector<HTMLElement>('.pg-preview');
    if (!select || !preview) throw new Error('Preview controls missing');
    const code = root.querySelector('pre code')?.textContent;
    const values = validateProject(sources, getCommitted());
    select.value = 'dark'; select.dispatchEvent(new Event('change'));
    expect(preview.style.getPropertyValue('--ds-color-surface')).toBe(values['dark/teal/compact/minimal']['color.surface']);
    expect(document.documentElement.dataset.theme).toBe('light'); expect(root.querySelector('pre code')?.textContent).toBe(code);
    select.value = 'light'; select.dispatchEvent(new Event('change'));
    expect(preview.style.getPropertyValue('--ds-color-surface')).toBe(values['light/teal/compact/minimal']['color.surface']);
    select.value = 'studio'; select.dispatchEvent(new Event('change')); expect(preview.style.getPropertyValue('--ds-color-surface')).toBe('');
    destroy(); Object.assign(document.documentElement.dataset, { theme: 'light', palette: 'blue', density: 'comfortable', kit: 'default' });
  });
  it('reports clipboard success and permission failure', async () => {
    const root = document.createElement('div'); document.body.append(root); const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const destroy = mountPlayground(root); click(root, '.pg-copy'); await Promise.resolve(); await Promise.resolve();
    expect(root.querySelector('.pg-copy-status')?.textContent).toBe('Code copied.');
    writeText.mockRejectedValueOnce(new Error('denied')); click(root, '.pg-copy'); await Promise.resolve(); await Promise.resolve();
    expect(root.querySelector('.pg-copy-status')?.textContent).toMatch(/Copy failed/); destroy();
  });
});
