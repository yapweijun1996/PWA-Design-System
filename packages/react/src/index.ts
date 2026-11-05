import { createElement, useEffect, useRef, type DependencyList, type ReactElement } from 'react';
import {
  createButton, createIconButton, createBadge, createCard, createSeparator, createTooltip,
  createInput, createTextarea, createCheckbox, createSwitch, createRadioGroup, createSelect, createFormField,
  createTabs, createBreadcrumb, createMenu, createPagination, createDialog, createAlert, createToast, createDataTable,
  type Component, type ButtonOptions, type IconButtonOptions, type BadgeOptions, type CardOptions, type SeparatorOptions,
  type InputOptions, type TextareaOptions, type CheckboxOptions, type RadioGroupOptions, type SelectOptions,
  type TabsOptions, type BreadcrumbItem, type MenuItem, type PaginationOptions, type DialogOptions, type AlertOptions, type ToastOptions, type DataTableOptions, type DataTable as CoreDataTable, type DataTableSort
} from '@pwa-design-system/core';

/** Effects are client-only; SSR emits an empty host, filled after hydration. */
function useLatest<T>(value: T): { current: T } {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
type Focus = { index: number; start: number | null; end: number | null; menuOpen: boolean };
const focusable = 'button, input, textarea, select, a[href], [tabindex="0"]';
function focusTargets(element: HTMLElement): HTMLElement[] {
  const children = Array.from(element.querySelectorAll<HTMLElement>(focusable));
  return element.matches(focusable) ? [element, ...children] : children;
}
function useCore(factory: () => Component<HTMLElement>, deps: DependencyList): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const latestFactory = useLatest(factory);
  // All dependencies supplied by adapters are primitives or serialized structures.
  const fingerprint = JSON.stringify(deps);
  const restore = useRef<Focus | null>(null);
  useEffect(() => {
    if (!fingerprint) throw new Error('Adapter dependencies could not be serialized');
    const root = host.current;
    if (!root) return;
    const component = latestFactory.current(); root.append(component.element);
    const saved = restore.current;
    if (saved) {
      if (saved.menuOpen) component.element.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')?.click();
      const target = focusTargets(component.element)[saved.index];
      if (target && !target.matches(':disabled')) {
        target.focus({ preventScroll: true });
        if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && saved.start !== null && saved.end !== null) {
          try { target.setSelectionRange(saved.start, saved.end); } catch { /* Input types without text selections. */ }
        }
      }
      restore.current = null;
    }
    return () => {
      const active = document.activeElement;
      if (root.isConnected && active instanceof HTMLElement && component.element.contains(active)) {
        const index = focusTargets(component.element).indexOf(active);
        if (index >= 0) restore.current = { index, start: active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionStart : null, end: active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionEnd : null, menuOpen: component.element.querySelector('button[aria-haspopup="menu"]')?.getAttribute('aria-expanded') === 'true' };
      }
      component.destroy(); component.element.remove();
    };
  }, [fingerprint, latestFactory]);
  return createElement('div', { ref: host, 'data-ds-react-host': '' });
}

export function Button(props: ButtonOptions): ReactElement {
  const callback = useLatest(props.onClick);
  return useCore(() => createButton({ ...props, onClick: event => callback.current?.(event) }), [props.label, props.size, props.variant, props.type, props.disabled, props.loading]);
}
export function IconButton(props: IconButtonOptions): ReactElement {
  const callback = useLatest(props.onClick);
  return useCore(() => createIconButton({ ...props, onClick: event => callback.current?.(event) }), [props.label, props.icon, props.size, props.variant, props.type, props.disabled, props.loading]);
}
export function Badge(props: BadgeOptions): ReactElement { return useCore(() => createBadge(props), [props.label, props.variant]); }
export function Separator(props: SeparatorOptions): ReactElement { return useCore(() => createSeparator(props), [props.orientation]); }
/** Text-only content; arbitrary React children are not yet supported. */
export interface CardProps extends CardOptions { content?: string }
export function Card(props: CardProps): ReactElement {
  return useCore(() => { const instance = createCard(props); instance.element.textContent = props.content ?? ''; return instance; }, [props.label, props.variant, props.content]);
}
/** Tooltip adapter currently supplies a native text button as the trigger. */
export interface TooltipProps { label: string; text: string; onClick?(event: MouseEvent): void }
export function Tooltip(props: TooltipProps): ReactElement {
  const callback = useLatest(props.onClick);
  return useCore(() => {
    const trigger = createButton({ label: props.label, onClick: event => callback.current?.(event) });
    try {
      const instance = createTooltip({ trigger: trigger.element, text: props.text });
      return { element: instance.element, destroy() { instance.destroy(); trigger.destroy(); } };
    } catch (error) { trigger.destroy(); throw error; }
  }, [props.label, props.text]);
}

export interface InputProps extends InputOptions { onValueChange?(value: string): void }
export interface TextareaProps extends TextareaOptions { onValueChange?(value: string): void }
type TextControl = HTMLInputElement | HTMLTextAreaElement;
type TextHandle = { element: HTMLElement; input: TextControl; destroy(): void };
type TextProps = { onValueChange?(value: string): void };
function syncAttributes(target: HTMLElement, source: HTMLElement): void {
  for (const attribute of [...target.attributes]) if (!source.hasAttribute(attribute.name)) target.removeAttribute(attribute.name);
  for (const attribute of [...source.attributes]) if (target.getAttribute(attribute.name) !== attribute.value) target.setAttribute(attribute.name, attribute.value);
}
function inputHandle(props: InputProps): TextHandle { const item = createInput(props); return { element: item.element, input: item.element, destroy: () => item.destroy() }; }
function textareaHandle(props: TextareaProps): TextHandle { const item = createTextarea(props); return { element: item.element, input: item.element, destroy: () => item.destroy() }; }
function formFieldHandle(props: FormFieldProps): TextHandle {
  const input = createInput(props.control);
  try {
    const field = createFormField({ label: props.label, control: input.element, description: props.description, error: props.error });
    return { element: field.element, input: input.element, destroy() { field.destroy(); input.destroy(); } };
  } catch (error) { input.destroy(); throw error; }
}
const inputValue = (props: InputProps): string | undefined => props.value;
const textareaValue = (props: TextareaProps): string | undefined => props.value;
const fieldValue = (props: FormFieldProps): string | undefined => props.control.value;
function syncPlain(target: TextHandle, source: TextHandle): void { syncAttributes(target.input, source.input); }
function syncField(target: TextHandle, source: TextHandle): void {
  const oldChildren = [...target.element.children], newChildren = [...source.element.children];
  const oldLabel = oldChildren[0], newLabel = newChildren[0], oldError = oldChildren[oldChildren.length - 1], newError = newChildren[newChildren.length - 1];
  syncAttributes(oldLabel as HTMLElement, newLabel as HTMLElement); oldLabel.textContent = newLabel.textContent;
  const oldDescription = oldChildren.length === 4 ? oldChildren[2] : null, newDescription = newChildren.length === 4 ? newChildren[2] : null;
  if (oldDescription && !newDescription) oldDescription.remove();
  else if (!oldDescription && newDescription) target.element.insertBefore(newDescription.cloneNode(true), oldError);
  else if (oldDescription && newDescription) { syncAttributes(oldDescription as HTMLElement, newDescription as HTMLElement); oldDescription.textContent = newDescription.textContent; }
  syncAttributes(oldError as HTMLElement, newError as HTMLElement); oldError.textContent = newError.textContent;
  syncAttributes(target.input, source.input);
}
/** Keep core-created text controls connected during prop updates, including IME. */
function useTextControl<P extends TextProps>(props: P, factory: (options: P) => TextHandle, getValue: (options: P) => string | undefined, sync: (target: TextHandle, source: TextHandle) => void): ReactElement {
  const host = useRef<HTMLDivElement>(null), current = useLatest(props), instance = useRef<TextHandle | null>(null);
  const composing = useRef(false), pendingSelection = useRef<{ start: number; end: number } | null>(null);
  useEffect(() => {
    const root = host.current; if (!root) return;
    const component = factory(current.current); instance.current = component; root.append(component.element);
    let alive = true;
    const applyControlled = () => {
      const value = getValue(current.current);
      if (!alive || value === undefined || composing.current || component.input.value === value) return;
      component.input.value = value;
      const selection = pendingSelection.current;
      if (selection && document.activeElement === component.input) {
        try { component.input.setSelectionRange(selection.start, selection.end); } catch { /* Non-textual input type. */ }
      }
    };
    const onInput = () => {
      const start = component.input.selectionStart, end = component.input.selectionEnd;
      pendingSelection.current = start !== null && end !== null ? { start, end } : null;
      current.current.onValueChange?.(component.input.value);
      queueMicrotask(applyControlled);
    };
    const onCompositionStart = () => { composing.current = true; };
    const onCompositionEnd = () => { composing.current = false; queueMicrotask(applyControlled); };
    component.input.addEventListener('input', onInput);
    component.input.addEventListener('compositionstart', onCompositionStart);
    component.input.addEventListener('compositionend', onCompositionEnd);
    return () => {
      alive = false; composing.current = false; instance.current = null;
      component.input.removeEventListener('input', onInput);
      component.input.removeEventListener('compositionstart', onCompositionStart);
      component.input.removeEventListener('compositionend', onCompositionEnd);
      component.destroy(); component.element.remove();
    };
  }, [factory, getValue, current]);
  useEffect(() => {
    const active = instance.current; if (!active) return;
    const probe = factory(props);
    try {
      const previous = active.input.value; sync(active, probe);
      if (!composing.current) {
        const value = getValue(props) ?? previous;
        if (active.input.value !== value) {
          active.input.value = value;
          const selection = pendingSelection.current;
          if (selection && document.activeElement === active.input) {
            try { active.input.setSelectionRange(selection.start, selection.end); } catch { /* Non-textual input type. */ }
          }
        }
      }
    } finally { probe.destroy(); }
  });
  return createElement('div', { ref: host, 'data-ds-react-host': '' });
}
export function Input(props: InputProps): ReactElement { return useTextControl(props, inputHandle, inputValue, syncPlain); }
export function Textarea(props: TextareaProps): ReactElement { return useTextControl(props, textareaHandle, textareaValue, syncPlain); }
export interface ChoiceProps extends CheckboxOptions { onCheckedChange?(checked: boolean): void }
function useChoice(props: ChoiceProps, kind: 'checkbox' | 'switch'): ReactElement {
  const callback = useLatest(props.onCheckedChange); const controlled = useLatest(props.checked); const lastChecked = useRef<boolean | undefined>(undefined);
  return useCore(() => {
    let alive = true;
    const options = { ...props, checked: props.checked ?? lastChecked.current };
    const instance = kind === 'checkbox' ? createCheckbox(options) : createSwitch(options);
    const listener = () => { lastChecked.current = instance.input.checked; callback.current?.(instance.input.checked); queueMicrotask(() => { if (alive && controlled.current !== undefined) instance.input.checked = controlled.current; }); };
    instance.input.addEventListener('change', listener);
    return { element: instance.element, destroy() { alive = false; if (controlled.current === undefined) lastChecked.current = instance.input.checked; instance.input.removeEventListener('change', listener); instance.destroy(); } };
  }, [kind, props.id, props.name, props.disabled, props.required, props.size, props.label, props.checked, props.value, props.error]);
}
export function Checkbox(props: ChoiceProps): ReactElement { return useChoice(props, 'checkbox'); }
export function Switch(props: ChoiceProps): ReactElement { return useChoice(props, 'switch'); }
export interface RadioGroupProps extends RadioGroupOptions { onValueChange?(value: string): void }
export function RadioGroup(props: RadioGroupProps): ReactElement {
  const callback = useLatest(props.onValueChange); const controlled = useLatest(props.value); const lastValue = useRef<string | undefined>(undefined);
  const signature = JSON.stringify(props.options);
  return useCore(() => {
    let alive = true;
    const value = props.value ?? (props.options.some(item => item.value === lastValue.current) ? lastValue.current : undefined);
    const instance = createRadioGroup({ ...props, value }); const listener = (event: Event) => { const input = event.target; if (input instanceof HTMLInputElement && input.checked) { lastValue.current = input.value; callback.current?.(input.value); queueMicrotask(() => { if (alive && controlled.current !== undefined) for (const item of instance.inputs) item.checked = item.value === controlled.current; }); } };
    instance.element.addEventListener('change', listener);
    return { element: instance.element, destroy() { alive = false; if (controlled.current === undefined) lastValue.current = instance.inputs.find(item => item.checked)?.value; instance.element.removeEventListener('change', listener); instance.destroy(); } };
  }, [props.id, props.legend, props.name, props.value, props.disabled, props.required, props.error, signature]);
}
export interface SelectProps extends SelectOptions { onValueChange?(value: string): void }
export function Select(props: SelectProps): ReactElement {
  const callback = useLatest(props.onValueChange); const controlled = useLatest(props.value); const lastValue = useRef<string | undefined>(undefined);
  const signature = JSON.stringify(props.options);
  return useCore(() => {
    let alive = true;
    const value = props.value ?? (props.options.some(item => item.value === lastValue.current) ? lastValue.current : undefined);
    const instance = createSelect({ ...props, value }); const listener = () => { lastValue.current = instance.element.value; callback.current?.(instance.element.value); queueMicrotask(() => { if (alive && controlled.current !== undefined) instance.element.value = controlled.current; }); };
    instance.element.addEventListener('change', listener);
    return { element: instance.element, destroy() { alive = false; if (controlled.current === undefined) lastValue.current = instance.element.value; instance.element.removeEventListener('change', listener); instance.destroy(); } };
  }, [props.id, props.name, props.ariaLabel, props.disabled, props.required, props.size, props.value, signature]);
}
/** Label and optional error around a native input, not an arbitrary React child. */
export interface FormFieldProps { label: string; control: InputOptions; description?: string; error?: string; onValueChange?(value: string): void }
export function FormField(props: FormFieldProps): ReactElement { return useTextControl(props, formFieldHandle, fieldValue, syncField); }
export function Tabs(props: TabsOptions): ReactElement {
  const callback = useLatest(props.onChange); const controlled = useLatest(props.selectedIndex); const lastIndex = useRef<number | undefined>(undefined); const signature = JSON.stringify(props.tabs);
  return useCore(() => {
    const selectedIndex = props.selectedIndex ?? (lastIndex.current !== undefined && lastIndex.current < props.tabs.length ? lastIndex.current : undefined);
    let alive = true;
    const instance = createTabs({ ...props, selectedIndex, onChange: index => {
      lastIndex.current = index; callback.current?.(index);
      queueMicrotask(() => {
        if (!alive || controlled.current === undefined || controlled.current === index) return;
        const ownsFocus = instance.element.contains(document.activeElement);
        instance.select(controlled.current);
        if (ownsFocus) instance.element.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
      });
    } });
    return { element: instance.element, destroy() { alive = false; instance.destroy(); } };
  }, [props.label, props.selectedIndex, signature]);
}
export interface BreadcrumbProps { items: readonly BreadcrumbItem[]; label?: string }
export function Breadcrumb(props: BreadcrumbProps): ReactElement {
  const signature = JSON.stringify(props.items);
  return useCore(() => createBreadcrumb(props.items, props.label), [props.label, signature]);
}
export interface MenuProps { label: string; items: readonly MenuItem[] }
export function Menu(props: MenuProps): ReactElement {
  const latest = useLatest(props.items); const signature = JSON.stringify(props.items.map(({ label, disabled }) => ({ label, disabled })));
  return useCore(() => createMenu({ label: props.label, items: props.items.map(({ label, disabled }, index) => ({ label, disabled, onSelect() { latest.current[index]?.onSelect(); } })) }), [props.label, signature]);
}
export function Pagination(props: PaginationOptions): ReactElement {
  const callback = useLatest(props.onChange); const controlled = useLatest(props.page);
  return useCore(() => {
    let alive = true;
    const instance = createPagination({ ...props, onChange: page => { callback.current(page); queueMicrotask(() => { if (alive) instance.setPage(controlled.current); }); } });
    return { element: instance.element, destroy() { alive = false; instance.destroy(); } };
  }, [props.page, props.totalPages, props.label]);
}
/** The owner must update open in response to onClose; the opener is the active element. */
export interface DialogProps extends DialogOptions { open: boolean }
export function Dialog(props: DialogProps): ReactElement {
  const callback = useLatest(props.onClose); const controlled = useLatest(props.open);
  return useCore(() => {
    let alive = true;
    const wrapper = document.createElement('div');
    const instance = createDialog({ ...props, onClose: () => {
      callback.current?.();
      queueMicrotask(() => { if (alive && controlled.current && wrapper.isConnected && !instance.element.open) instance.open(); });
    } });
    wrapper.append(instance.element);
    if (props.open) queueMicrotask(() => { if (alive && wrapper.isConnected) instance.open(); });
    return { element: wrapper, destroy() { alive = false; instance.destroy(); } };
  }, [props.title, props.description, props.closeLabel, props.open]);
}
export function Alert(props: AlertOptions): ReactElement {
  return useCore(() => {
    const instance = createAlert({ ...props, message: props.assertive ? '' : props.message });
    if (props.assertive) queueMicrotask(() => { if (instance.element.isConnected) instance.setMessage(props.message); });
    return instance;
  }, [props.message, props.tone, props.assertive]);
}
export function Toast(props: ToastOptions): ReactElement {
  const callback = useLatest(props.onDismiss);
  return useCore(() => createToast({ ...props, onDismiss: () => callback.current?.() }), [props.message, props.dismissLabel]);
}


/** Stable core table with optionally controlled selection, page and sort. */
export interface DataTableProps extends DataTableOptions {
  selectedIds?: readonly string[];
  page?: number;
  sort?: DataTableSort | null;
}
function tableSelection(props: DataTableProps): string[] {
  if (!Array.isArray(props.selectedIds)) throw new TypeError('selectedIds must be an array');
  const available = new Set(props.rows.map(row => row.id)), seen = new Set<string>();
  for (const id of props.selectedIds) { if (typeof id !== 'string' || seen.has(id)) throw new TypeError('selectedIds must contain unique strings'); seen.add(id); }
  return props.selectedIds.filter(id => available.has(id));
}
function tablePage(props: DataTableProps): number {
  if (!Number.isInteger(props.page) || (props.page ?? 0) < 1) throw new RangeError('page must be a positive integer');
  return Math.min(props.page as number, Math.max(1, Math.ceil(props.rows.length / (props.pageSize ?? 10))));
}
interface TableRestore { selected: string[]; page: number; sort: DataTableSort | null; focus: string | null; scrollLeft: number }
export function DataTable(props: DataTableProps): ReactElement {
  for (const name of ['onSelectionChange', 'onPageChange', 'onSortChange'] as const) {
    if (props[name] !== undefined && typeof props[name] !== 'function') throw new TypeError(`${name} must be a function`);
  }
  const host = useRef<HTMLDivElement>(null), latest = useLatest(props), instance = useRef<CoreDataTable | null>(null);
  const saved = useRef<TableRestore | null>(null), rowsVersion = useRef('');
  const applied = useRef<{ loading: boolean | undefined; selection: string | undefined; sort: string | undefined; page: number | undefined }>({ loading: undefined, selection: undefined, sort: undefined, page: undefined });
  const structure = JSON.stringify([props.label, props.columns, props.pageSize, props.selectable]);
  const rowsKey = JSON.stringify(props.rows), selectionKey = JSON.stringify(props.selectedIds), sortKey = JSON.stringify(props.sort);
  useEffect(() => {
    const root = host.current; if (!root) return;
    if (!structure) throw new Error('Table configuration cannot be serialized');
    let alive = true; let table: CoreDataTable;
    const queue = (operation: () => void): void => { queueMicrotask(() => { if (alive) operation(); }); };
    table = createDataTable({ ...latest.current,
      onSelectionChange(ids) { latest.current.onSelectionChange?.(ids); queue(() => { if (latest.current.selectedIds !== undefined) table.setSelectedIds(tableSelection(latest.current)); }); },
      onPageChange(page) { latest.current.onPageChange?.(page); queue(() => { if (latest.current.page !== undefined) table.setPage(tablePage(latest.current)); }); },
      onSortChange(sort) { latest.current.onSortChange?.(sort); queue(() => { if (latest.current.sort !== undefined) table.setSort(latest.current.sort); }); }
    });
    instance.current = table; root.append(table.element); rowsVersion.current = JSON.stringify(latest.current.rows);
    const previous = saved.current;
    if (previous) {
      const validIds = new Set(latest.current.rows.map(row => row.id));
      if (latest.current.selectable) table.setSelectedIds(previous.selected.filter(id => validIds.has(id)));
      if (previous.sort && latest.current.columns.some(column => column.id === previous.sort?.column && column.sortable)) table.setSort(previous.sort);
      table.setPage(Math.min(previous.page, Math.max(1, Math.ceil(latest.current.rows.length / (latest.current.pageSize ?? 10)))));
    }
    if (latest.current.selectedIds !== undefined) table.setSelectedIds(tableSelection(latest.current));
    if (latest.current.sort !== undefined) table.setSort(latest.current.sort);
    if (latest.current.page !== undefined) table.setPage(tablePage(latest.current));
    applied.current = { loading: latest.current.loading, selection: JSON.stringify(latest.current.selectedIds), sort: JSON.stringify(latest.current.sort), page: latest.current.page };
    if (previous) {
      const scroll = table.element.querySelector<HTMLElement>('.ds-data-table__scroll'); if (scroll) scroll.scrollLeft = previous.scrollLeft;
      if (previous.focus) {
        const candidates = [...table.element.querySelectorAll<HTMLElement>('button,input,[tabindex]')];
        const target = candidates.find(node => (node.dataset.rowId ? `row:${node.dataset.rowId}` : node.getAttribute('aria-label') ?? node.textContent) === previous.focus && !node.matches(':disabled'));
        (target ?? scroll)?.focus({ preventScroll: true });
      }
      saved.current = null;
    }
    return () => {
      alive = false;
      const active = document.activeElement instanceof HTMLElement && table.element.contains(document.activeElement) ? document.activeElement : null;
      saved.current = { selected: table.getSelectedIds(), page: table.getPage(), sort: table.getSort(), focus: active ? active.dataset.rowId ? `row:${active.dataset.rowId}` : active.getAttribute('aria-label') ?? active.textContent : null, scrollLeft: table.element.querySelector<HTMLElement>('.ds-data-table__scroll')?.scrollLeft ?? 0 };
      instance.current = null; table.destroy(); table.element.remove();
    };
  }, [structure, latest]);
  useEffect(() => {
    const table = instance.current; if (!table) return;
    const changedRows = rowsVersion.current !== rowsKey;
    if (changedRows) { table.setRows(props.rows); rowsVersion.current = rowsKey; }
    if (props.loading !== applied.current.loading) table.setLoading(props.loading ?? false);
    if (props.selectedIds !== undefined && (changedRows || selectionKey !== applied.current.selection)) table.setSelectedIds(tableSelection(props));
    if (props.sort !== undefined && sortKey !== applied.current.sort) table.setSort(props.sort);
    if (props.page !== undefined && (changedRows || props.page !== applied.current.page)) table.setPage(tablePage(props));
    if (changedRows && props.page !== undefined && tablePage(props) !== props.page) props.onPageChange?.(tablePage(props));
    applied.current = { loading: props.loading, selection: selectionKey, sort: sortKey, page: props.page };
  });
  return createElement('div', { ref: host, 'data-ds-react-host': '' });
}
