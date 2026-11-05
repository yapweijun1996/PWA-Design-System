import {
  createButton, createIconButton, createBadge, createCard, createSeparator, createTooltip,
  createInput, createTextarea, createCheckbox, createRadioGroup, createSwitch, createSelect, createFormField,
  createTabs, createBreadcrumb, createMenu, createPagination, createDialog, createAlert, createToast, createDataTable
} from '../../../../../packages/core/src/index.js';
import type { Component } from '../../../../../packages/core/src/types.js';
import { getIcon } from '../../../../../packages/icons/generated/index.js';

export interface PlaygroundConfig { family: string; label: string; size: string; variant: string; state: string; extras: Record<string, string> }
type Field = { key: string; label: string; initial: string; kind?: 'text' | 'select' | 'number' | 'list'; choices?: readonly string[]; min?: number; max?: number; required?: boolean };
type Specs = { size?: readonly string[]; variant?: readonly string[]; state?: readonly string[]; label: string; note: string; extras?: readonly Field[] };
const field = (key: string, label: string, initial = '', required = false): Field => ({ key, label, initial, required });
const selectField = (key: string, label: string, choices: readonly string[]): Field => ({ key, label, kind: 'select', initial: choices[0], choices });
const numberField = (key: string, label: string, initial: string, min: number, max: number): Field => ({ key, label, initial, kind: 'number', min, max });
const listField = (key: string, label: string, initial: string): Field => ({ key, label, initial, kind: 'list', required: true });
const action: Specs = { size: ['medium', 'small', 'large'], variant: ['primary', 'secondary', 'ghost'], state: ['enabled', 'disabled', 'loading'], label: 'Save', extras: [selectField('type', 'Button type', ['button', 'submit', 'reset'])], note: 'Native button; Tab focuses and Enter or Space activates. Loading disables the action.' };
const control: Specs = { size: ['md', 'sm', 'lg'], state: ['enabled', 'disabled'], label: 'Example field', extras: [field('name', 'Name'), selectField('required', 'Required', ['false', 'true'])], note: 'Native control; use a persistent visible label in a real form.' };
const choice: Specs = { size: ['md', 'sm', 'lg'], state: ['unchecked', 'checked', 'disabled'], label: 'Enable option', extras: [field('name', 'Name'), field('value', 'Value', 'on'), field('error', 'Error message'), selectField('required', 'Required', ['false', 'true'])], note: 'Native labeled choice; Space toggles the state.' };
/** Factory-specific editor capability, not a component inventory. The inventory comes from the contract. */
export const specs: Record<string, Specs> = {
  button: action, 'icon-button': { ...action, label: 'Settings', extras: [...(action.extras ?? []), field('icon', 'Icon glyph', getIcon('settings'), true)], note: 'The label names the icon-only button. The glyph is hidden from assistive technology.' },
  badge: { label: 'Active', variant: ['neutral', 'primary', 'success', 'danger'], note: 'Noninteractive status text; do not rely on color alone.' },
  card: { label: 'Account', variant: ['outlined', 'elevated'], note: 'A noninteractive section; callers supply content and semantics.' },
  separator: { label: 'Separator', variant: ['horizontal', 'vertical'], note: 'Noninteractive separator. The label is not rendered.' },
  tooltip: { label: 'More information', extras: [field('text', 'Tooltip text', 'Helpful information', true)], note: 'Focus or hover reveals the tooltip; Escape dismisses it. Requires native Popover API.' },
  input: { ...control, extras: [...(control.extras ?? []), selectField('type', 'Input type', ['text', 'email', 'password', 'search', 'tel', 'url']), field('value', 'Initial value'), field('placeholder', 'Placeholder')] },
  textarea: { ...control, extras: [...(control.extras ?? []), field('value', 'Initial value'), field('placeholder', 'Placeholder'), numberField('rows', 'Rows', '3', 1, 100)] }, checkbox: choice, switch: choice,
  'radio-group': { label: 'Choose a plan', state: ['enabled', 'disabled'], extras: [field('name', 'Name', 'playground-plan', true), listField('options', 'Options (value | label, one per line)', 'a | Basic\nb | Plus'), field('value', 'Selected value'), field('error', 'Error message'), selectField('required', 'Required', ['false', 'true'])], note: 'A fieldset with a visible legend; native radio arrow-key behavior applies.' },
  select: { ...control, label: 'Choose a country', extras: [...(control.extras ?? []), listField('options', 'Options (value | label, one per line)', 'a | Option A\nb | Option B'), field('value', 'Selected value')], note: 'Native single-select behavior and keyboard interaction.' },
  'form-field': { label: 'Email', state: ['default', 'error'], extras: [field('description', 'Description'), field('error', 'Error message', 'Enter an email')], note: 'A visible label and optional error describe the native input.' },
  tabs: { label: 'Views', extras: [listField('tabs', 'Tabs (label | content, one per line)', 'First | First panel\nSecond | Second panel'), numberField('selectedIndex', 'Selected index', '0', 0, 9)], note: 'Left/Right arrows wrap and select; Home and End move to the first or last tab.' },
  breadcrumb: { label: 'Current page', extras: [field('href', 'Home link', './', true), field('navigationLabel', 'Navigation label', 'Breadcrumb', true)], note: 'The final item identifies the current page; links use native keyboard behavior.' },
  menu: { label: 'Actions', extras: [listField('items', 'Items (label per line, optional | disabled)', 'Open\nUnavailable | disabled')], note: 'Arrow keys navigate; Escape closes and restores focus. Disabled items remain focusable.' },
  pagination: { label: 'Pagination', extras: [numberField('page', 'Page', '1', 1, 100), numberField('totalPages', 'Total pages', '3', 1, 100)], note: 'Native buttons change one-based pages; boundary controls are disabled.' },
  dialog: { label: 'Example dialog', extras: [field('description', 'Description', 'Press Escape or Close.'), field('closeLabel', 'Close label', 'Close', true)], note: 'A native modal. Escape closes it; focus returns to its opener.' },
  alert: { label: 'Review your settings.', variant: ['info', 'success', 'warning', 'danger'], extras: [selectField('assertive', 'Assertive', ['false', 'true'])], note: 'Static by default. Assertive updates require an initially mounted live region.' },
  'data-table': { label: 'People', state: ['ready', 'loading', 'empty'], extras: [numberField('pageSize', 'Page size', '2', 1, 100), selectField('selectable', 'Row selection', ['false', 'true'])], note: 'Sort a column, navigate pages and optionally select rows on the current page.' },
  toast: { label: 'Changes saved', extras: [field('dismissLabel', 'Dismiss label', 'Dismiss', true)], note: 'Polite status with a dismiss button. Screen-reader behavior requires manual verification.' }
};
/** Verify that contract editability matches actual allowlisted controls. */
export function validateEditableMetadata(family: string, properties: readonly { name: string; editable: boolean }[]): void {
  const spec = Object.hasOwn(specs, family) ? specs[family] : undefined; if (!spec) throw new Error('Unknown component');
  const labelProperty: Record<string, string> = { input: 'ariaLabel', textarea: 'ariaLabel', select: 'ariaLabel', 'radio-group': 'legend', dialog: 'title', alert: 'message', toast: 'message' };
  const expected = new Set<string>();
  if (family !== 'separator' && family !== 'tooltip') expected.add(labelProperty[family] ?? 'label');
  if (spec.size) expected.add('size');
  if (spec.variant) expected.add(family === 'separator' ? 'orientation' : family === 'alert' ? 'tone' : 'variant');
  if (spec.state) {
    if (family === 'data-table') { expected.add('rows'); expected.add('loading'); }
    else if (family === 'button' || family === 'icon-button') { expected.add('disabled'); expected.add('loading'); }
    else if (family === 'checkbox' || family === 'switch') { expected.add('checked'); expected.add('disabled'); }
    else if (family === 'form-field') expected.add('error');
    else expected.add('disabled');
  }
  for (const extra of spec.extras ?? []) if (extra.key !== 'navigationLabel') expected.add(extra.key);
  const actual = new Set(properties.filter(property => property.editable).map(property => property.name));
  if (actual.size !== expected.size || [...expected].some(name => !actual.has(name))) throw new Error(`Editable property mismatch: ${family}`);
}
export function defaultConfig(family: string): PlaygroundConfig {
  const s = Object.hasOwn(specs, family) ? specs[family] : undefined; if (!s) throw new Error('Unsupported component');
  return { family, label: s.label, size: s.size?.[0] ?? '', variant: s.variant?.[0] ?? '', state: s.state?.[0] ?? '', extras: Object.fromEntries((s.extras ?? []).map(item => [item.key, item.initial])) };
}
export function validateConfig(config: PlaygroundConfig): string | null {
  const s = Object.hasOwn(specs, config.family) ? specs[config.family] : undefined;
  if (!s) return 'Unknown component.';
  if (typeof config.label !== 'string' || !config.label.trim() || config.label.length > 80) return 'Enter 1 to 80 characters.';
  for (const key of ['size', 'variant', 'state'] as const) if (s[key] ? !s[key].includes(config[key]) : config[key] !== '') return `Unsupported ${key}.`;
  if (!config.extras || typeof config.extras !== 'object' || Array.isArray(config.extras)) return 'Invalid properties.';
  const fields = s.extras ?? [];
  if (Object.keys(config.extras).length !== fields.length || fields.some(item => !Object.hasOwn(config.extras, item.key))) return 'Invalid properties.';
  for (const item of fields) {
    const value = config.extras[item.key];
    if (typeof value !== 'string' || value.length > (item.kind === 'list' ? 800 : 80) || (item.required && !value.trim())) return `Invalid ${item.label}.`;
    if (item.kind === 'select' && !item.choices?.includes(value)) return `Invalid ${item.label}.`;
    if (item.kind === 'number' && (!/^\d+$/.test(value) || Number(value) < (item.min ?? 0) || Number(value) > (item.max ?? 100))) return `Invalid ${item.label}.`;
    if (item.kind === 'list') { try { if (config.family === 'menu' && item.key === 'items') parseMenu(value); else parseList(value); } catch { return `Invalid ${item.label}; check the line format and duplicates.`; } }
  }
  if (config.family === 'pagination' && Number(config.extras.page) > Number(config.extras.totalPages)) return 'Page must not exceed total pages.';
  if (config.family === 'tabs' && Number(config.extras.selectedIndex) >= parseList(config.extras.tabs).length) return 'Selected index must identify a tab.';
  if (config.family === 'tabs' && parseList(config.extras.tabs).some(option => option.disabled)) return 'Tabs do not support disabled items.';
  if ((config.family === 'select' || config.family === 'radio-group') && config.extras.value && !parseList(config.extras.options).some(option => option.value === config.extras.value)) return 'Selected value must exist in options.';
  if (config.family === 'breadcrumb') { try { const url = new URL(config.extras.href, document.baseURI); if (!['http:', 'https:'].includes(url.protocol)) return 'Home link must use HTTP or HTTPS.'; } catch { return 'Home link must be valid.'; } }
  return null;
}
function parseList(value: string): { value: string; label: string; disabled: boolean }[] {
  const lines = value.split('\n'); if (!lines.length || lines.length > 10) throw new Error('Invalid list');
  const seen = new Set<string>(); return lines.map(line => {
    const parts = line.split('|').map(part => part.trim());
    if (parts.length < 2 || parts.length > 3 || !parts[0] || !parts[1] || parts[0].length > 80 || parts[1].length > 80 || (parts[2] && parts[2] !== 'disabled') || seen.has(parts[0])) throw new Error('Invalid list item');
    seen.add(parts[0]); return { value: parts[0], label: parts[1], disabled: parts[2] === 'disabled' };
  });
}
function parseMenu(value: string): { label: string; disabled: boolean }[] {
  const lines = value.split('\n'); if (!lines.length || lines.length > 10) throw new Error('Invalid list');
  const seen = new Set<string>(); return lines.map(line => {
    const parts = line.split('|').map(part => part.trim());
    if (parts.length > 2 || !parts[0] || parts[0].length > 80 || (parts.length === 2 && parts[1] !== 'disabled') || seen.has(parts[0])) throw new Error('Invalid menu item');
    seen.add(parts[0]); return { label: parts[0], disabled: parts[1] === 'disabled' };
  });
}
interface Built { element: HTMLElement; code: string; afterMount?(): void; destroy(): void }
const q = (value: string): string => JSON.stringify(value);
/** The same validated config drives the concrete factory call and its code example. */
export function buildPreview(config: PlaygroundConfig, factory: string, entry: string): Built {
  const error = validateConfig(config); if (error) throw new Error(error);
  const expectedFactory = `create${config.family.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')}`;
  if (factory !== expectedFactory) throw new Error('Invalid factory name');
  if (!/^@pwa-design-system\/core\/[a-z-]+$/.test(entry)) throw new Error('Invalid package entry');
  const { family: f, label, size, variant, state, extras: v } = config;
  let component: Component<HTMLElement>; let extra: Component<HTMLElement>[] = []; let expression = ''; let afterMount: (() => void) | undefined;
  switch (f) {
    case 'button': case 'icon-button': {
      const opts = { label, size: size as 'small' | 'medium' | 'large', variant: variant as 'primary' | 'secondary' | 'ghost', type: v.type as 'button' | 'submit' | 'reset', disabled: state === 'disabled', loading: state === 'loading' };
      component = f === 'button' ? createButton(opts) : createIconButton({ ...opts, icon: v.icon });
      expression = JSON.stringify(f === 'button' ? opts : { ...opts, icon: v.icon }, null, 2); break;
    }
    case 'badge': component = createBadge({ label, variant: variant as 'neutral' | 'primary' | 'success' | 'danger' }); expression = `{ label: ${q(label)}, variant: ${q(variant)} }`; break;
    case 'card': component = createCard({ label, variant: variant as 'outlined' | 'elevated' }); component.element.textContent = label; expression = `{ label: ${q(label)}, variant: ${q(variant)} }`; break;
    case 'separator': component = createSeparator({ orientation: variant as 'horizontal' | 'vertical' }); expression = `{ orientation: ${q(variant)} }`; break;
    case 'tooltip': { const trigger = document.createElement('button'); trigger.textContent = label; trigger.type = 'button'; component = createTooltip({ trigger, text: v.text }); expression = `{ trigger, text: ${q(v.text)} }`; break; }
    case 'input': case 'textarea': case 'select': {
      const opts = { id: 'playground-control', ariaLabel: label, size: size as 'sm' | 'md' | 'lg', disabled: state === 'disabled', name: v.name, required: v.required === 'true' };
      const input = { ...opts, type: v.type as 'text' | 'email' | 'password' | 'search' | 'tel' | 'url', value: v.value, placeholder: v.placeholder };
      const textarea = { ...opts, value: v.value, placeholder: v.placeholder, rows: Number(v.rows) };
      const select = { ...opts, options: f === 'select' ? parseList(v.options) : [], ...(v.value ? { value: v.value } : {}) };
      component = f === 'input' ? createInput(input) : f === 'textarea' ? createTextarea(textarea) : createSelect(select);
      expression = JSON.stringify(f === 'input' ? input : f === 'textarea' ? textarea : select, null, 2); break;
    }
    case 'checkbox': case 'switch': {
      const opts = { id: 'playground-choice', label, size: size as 'sm' | 'md' | 'lg', checked: state === 'checked', disabled: state === 'disabled', name: v.name, value: v.value, error: v.error, required: v.required === 'true' };
      component = f === 'checkbox' ? createCheckbox(opts) : createSwitch(opts);
      expression = JSON.stringify(opts, null, 2); break;
    }
    case 'radio-group': { const opts = { id: 'playground-radio', legend: label, name: v.name, disabled: state === 'disabled', options: parseList(v.options), required: v.required === 'true', error: v.error, ...(v.value ? { value: v.value } : {}) }; component = createRadioGroup(opts); expression = JSON.stringify(opts, null, 2); break; }
    case 'form-field': { const input = createInput({ id: 'playground-email', type: 'email' }); extra = [input]; component = createFormField({ label, control: input.element, description: v.description, error: state === 'error' ? v.error : undefined }); expression = `{ label: ${q(label)}, control: input, description: ${q(v.description)}, error: ${state === 'error' ? q(v.error) : 'undefined'} }`; break; }
    case 'tabs': { const opts = { label, tabs: parseList(v.tabs).map(item => ({ label: item.value, content: item.label })), selectedIndex: Number(v.selectedIndex) }; component = createTabs(opts); expression = JSON.stringify(opts, null, 2); break; }
    case 'breadcrumb': component = createBreadcrumb([{ label: 'Home', href: v.href }, { label }], v.navigationLabel); expression = `[{ label: 'Home', href: ${q(v.href)} }, { label: ${q(label)} }], ${q(v.navigationLabel)}`; break;
    case 'menu': { const items = parseMenu(v.items).map(item => ({ ...item, onSelect() {} })); component = createMenu({ label, items }); expression = `{ label: ${q(label)}, items: ${JSON.stringify(items.map(({ label, disabled }) => ({ label, disabled })))}.map(item => ({ ...item, onSelect() {} })) }`; break; }
    case 'pagination': component = createPagination({ page: Number(v.page), totalPages: Number(v.totalPages), label, onChange() {} }); expression = `{ page: ${Number(v.page)}, totalPages: ${Number(v.totalPages)}, label: ${q(label)}, onChange() {} }`; break;
    case 'dialog': { const dialog = createDialog({ title: label, description: v.description, closeLabel: v.closeLabel }); const trigger = document.createElement('button'); trigger.type = 'button'; trigger.textContent = 'Open dialog'; const controller = new AbortController(); trigger.addEventListener('click', () => dialog.open(trigger), { signal: controller.signal }); const wrapper = document.createElement('div'); wrapper.append(dialog.element, trigger); component = { element: wrapper, destroy() { controller.abort(); dialog.destroy(); } }; expression = `{ title: ${q(label)}, description: ${q(v.description)}, closeLabel: ${q(v.closeLabel)} }`; break; }
    case 'alert': { const alert = createAlert({ message: v.assertive === 'true' ? '' : label, tone: variant as 'info' | 'success' | 'warning' | 'danger', assertive: v.assertive === 'true' }); component = alert; if (v.assertive === 'true') afterMount = () => alert.setMessage(label); expression = `{ message: ${q(v.assertive === 'true' ? '' : label)}, tone: ${q(variant)}, assertive: ${v.assertive === 'true'} }`; break; }
    case 'data-table': {
      const columns = [{ id: 'name', label: 'Name', sortable: true }, { id: 'team', label: 'Team' }];
      const rows = state === 'empty' ? [] : [{ id: 'a', label: 'Ada', cells: { name: 'Ada', team: 'Design' } }, { id: 'b', label: 'Bea', cells: { name: 'Bea', team: 'Engineering' } }, { id: 'c', label: 'Cleo', cells: { name: 'Cleo', team: 'Operations' } }];
      const opts = { label, columns, rows, pageSize: Number(v.pageSize), selectable: v.selectable === 'true', loading: state === 'loading' };
      component = createDataTable(opts); expression = JSON.stringify(opts, null, 2); break;
    }
    case 'toast': component = createToast({ message: label, dismissLabel: v.dismissLabel }); expression = `{ message: ${q(label)}, dismissLabel: ${q(v.dismissLabel)} }`; break;
    default: throw new Error('Unknown component');
  }
  const prefix = f === 'tooltip' ? `const trigger = document.createElement('button');\ntrigger.type = 'button';\ntrigger.textContent = ${q(label)};\n` : f === 'form-field' ? "const input = createInput({ id: 'playground-email', type: 'email' }).element;\n" : '';
  const after = f === 'card' ? `component.element.textContent = ${q(label)};\n` : '';
  const suffix = f === 'dialog' ? "document.body.append(component.element);\nconst opener = document.createElement('button');\nopener.type = 'button';\nopener.textContent = 'Open dialog';\nopener.addEventListener('click', () => component.open(opener));\ndocument.body.append(opener);" : `document.body.append(component.element);${f === 'alert' && v.assertive === 'true' ? `\ncomponent.setMessage(${q(label)});` : ''}`;
  const imports = `import { ${factory} } from ${q(entry)};\n${f === 'form-field' ? "import { createInput } from '@pwa-design-system/core/input';\n" : ''}\n`;
  return { element: component.element, code: `${imports}${prefix}const component = ${factory}(${expression});\n${after}${suffix}`, afterMount, destroy() { component.destroy(); for (const item of extra) item.destroy(); } };
}
