import type { Component } from '../types.js';
import { createPagination, type Pagination } from '../navigation/index.js';

export interface DataTableColumn { id: string; label: string; sortable?: boolean }
export interface DataTableRow { id: string; label?: string; cells: Readonly<Record<string, string>> }
export interface DataTableSort { column: string; direction: 'ascending' | 'descending' }
export interface DataTableOptions {
  label: string;
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  pageSize?: number;
  selectable?: boolean;
  loading?: boolean;
  onSelectionChange?(ids: readonly string[]): void;
  onPageChange?(page: number): void;
  onSortChange?(sort: DataTableSort): void;
}
export interface DataTable extends Component<HTMLElement> {
  setRows(rows: readonly DataTableRow[]): void;
  setLoading(loading: boolean): void;
  setPage(page: number): void;
  getSelectedIds(): string[];
  setSelectedIds(ids: readonly string[]): void;
  getPage(): number;
  getSort(): DataTableSort | null;
  setSort(sort: DataTableSort | null): void;
}
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
function label(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be non-empty text`);
}
function identifier(value: unknown, name: string): asserts value is string {
  label(value, name);
  if (forbidden.has(value)) throw new TypeError(`${name} is not permitted`);
}
function bool(value: unknown, name: string): void { if (value !== undefined && typeof value !== 'boolean') throw new TypeError(`${name} must be boolean`); }
function callbacks(options: DataTableOptions): void {
  for (const name of ['onSelectionChange', 'onPageChange', 'onSortChange'] as const) if (options[name] !== undefined && typeof options[name] !== 'function') throw new TypeError(`${name} must be a function`);
}
/** Native table with stable row IDs, current-page selection, sorting and pagination. */
export function createDataTable(options: DataTableOptions): DataTable {
  label(options.label, 'Table label'); callbacks(options); bool(options.selectable, 'selectable'); bool(options.loading, 'loading');
  if (!Array.isArray(options.columns) || !options.columns.length) throw new RangeError('At least one column is required');
  const columnIds = new Set<string>();
  const columns = options.columns.map(column => {
    if (!column || typeof column !== 'object') throw new TypeError('Invalid column');
    identifier(column.id, 'Column ID'); label(column.label, 'Column label'); bool(column.sortable, 'sortable');
    if (columnIds.has(column.id)) throw new Error('Duplicate column ID'); columnIds.add(column.id);
    return { id: column.id, label: column.label, sortable: column.sortable ?? false };
  });
  const pageSize = options.pageSize ?? 10;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new RangeError('pageSize must be an integer from 1 to 1000');
  function copyRows(input: readonly DataTableRow[]): DataTableRow[] {
    if (!Array.isArray(input)) throw new TypeError('Rows must be an array');
    const seen = new Set<string>();
    return input.map(row => {
      if (!row || typeof row !== 'object') throw new TypeError('Invalid row');
      identifier(row.id, 'Row ID'); if (row.label !== undefined) label(row.label, 'Row label');
      if (seen.has(row.id)) throw new Error('Duplicate row ID'); seen.add(row.id);
      if (!row.cells || typeof row.cells !== 'object' || Array.isArray(row.cells)) throw new TypeError('Row cells must be an object');
      const cells: Record<string, string> = Object.create(null);
      for (const key of Object.keys(row.cells)) if (!columnIds.has(key)) throw new Error('Unknown column in row');
      for (const column of columns) {
        if (!Object.hasOwn(row.cells, column.id) || typeof row.cells[column.id] !== 'string') throw new TypeError(`Missing text cell: ${column.id}`);
        cells[column.id] = row.cells[column.id];
      }
      return { id: row.id, label: row.label, cells };
    });
  }
  let rows = copyRows(options.rows), page = 1, loading = options.loading ?? false, sort: DataTableSort | undefined;
  let sortedRows: DataTableRow[] | undefined;
  function changeSort(next: DataTableSort | undefined): void {
    if (sort?.column !== next?.column || sort?.direction !== next?.direction) sortedRows = undefined;
    sort = next;
  }
  const selected = new Set<string>(); const controller = new AbortController(); let destroyed = false;
  const element = document.createElement('section'); element.className = 'ds-data-table'; element.setAttribute('aria-label', options.label);
  const heading = document.createElement('h2'); heading.className = 'ds-data-table__heading'; heading.textContent = options.label;
  const scroll = document.createElement('div'); scroll.className = 'ds-data-table__scroll'; scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', `${options.label} table scroll area`);
  const table = document.createElement('table'); table.className = 'ds-data-table__table';
  const caption = document.createElement('caption'); caption.textContent = options.label;
  const head = document.createElement('thead'), headRow = document.createElement('tr'), body = document.createElement('tbody');
  let selectAll: HTMLInputElement | undefined;
  if (options.selectable) {
    const cell = document.createElement('th'); cell.scope = 'col';
    selectAll = document.createElement('input'); selectAll.type = 'checkbox'; selectAll.setAttribute('aria-label', 'Select all rows on this page'); cell.append(selectAll); headRow.append(cell);
  }
  const headers = new Map<string, { cell: HTMLTableCellElement; button: HTMLButtonElement; indicator: HTMLSpanElement }>();
  for (const column of columns) {
    const cell = document.createElement('th'); cell.scope = 'col';
    if (column.sortable) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'ds-data-table__sort'; button.textContent = column.label; button.setAttribute('aria-label', `Sort by ${column.label}`);
      button.addEventListener('click', () => {
        const nextSort: DataTableSort = { column: column.id, direction: sort?.column === column.id && sort?.direction === 'ascending' ? 'descending' : 'ascending' };
        changeSort(nextSort);
        render(); options.onSortChange?.({ ...nextSort });
      }, { signal: controller.signal });
      const indicator = document.createElement('span'); indicator.setAttribute('aria-hidden', 'true');
      headers.set(column.id, { cell, button, indicator }); cell.append(button, indicator);
    } else cell.textContent = column.label;
    headRow.append(cell);
  }
  head.append(headRow); table.append(caption, head, body); scroll.append(table);
  const message = document.createElement('p'); message.className = 'ds-data-table__message'; message.setAttribute('role', 'status');
  const controls = document.createElement('div'); controls.className = 'ds-data-table__controls';
  element.append(heading, message, scroll, controls);
  let pagination: Pagination;
  const totalPages = (): number => Math.max(1, Math.ceil(rows.length / pageSize));
  function makePagination(): Pagination {
    return createPagination({ page, totalPages: totalPages(), label: `${options.label} pagination`, onChange(next) { page = next; render(); options.onPageChange?.(page); } });
  }
  pagination = makePagination(); controls.append(pagination.element);
  function orderedRows(): DataTableRow[] {
    if (!sort) return rows;
    if (sortedRows) return sortedRows;
    const { column, direction } = sort; const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    sortedRows = rows.map((row, index) => ({ row, index })).sort((a, b) => (direction === 'ascending' ? 1 : -1) * collator.compare(a.row.cells[column], b.row.cells[column]) || a.index - b.index).map(item => item.row);
    return sortedRows;
  }
  function visibleRows(): DataTableRow[] { return orderedRows().slice((page - 1) * pageSize, page * pageSize); }
  function notifySelection(): void { options.onSelectionChange?.([...selected]); }
  selectAll?.addEventListener('change', () => {
    for (const row of visibleRows()) { if (selectAll?.checked) selected.add(row.id); else selected.delete(row.id); }
    render(); notifySelection();
  }, { signal: controller.signal });
  body.addEventListener('change', event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return;
    const id = target.dataset.rowId; if (id === undefined || !rows.some(row => row.id === id)) return;
    if (target.checked) selected.add(id); else selected.delete(id);
    render(); notifySelection();
  }, { signal: controller.signal });
  function render(): void {
    const active = document.activeElement;
    const focusedId = active instanceof HTMLInputElement && body.contains(active) ? active.dataset.rowId : undefined;
    const visible = visibleRows(); const fragment = document.createDocumentFragment();
    for (const row of visible) {
      const tr = document.createElement('tr');
      if (selectAll) {
        const td = document.createElement('td'), input = document.createElement('input'); input.type = 'checkbox'; input.dataset.rowId = row.id; input.checked = selected.has(row.id); input.disabled = loading; input.setAttribute('aria-label', `Select ${row.label ?? row.id}`); td.append(input); tr.append(td);
      }
      for (const column of columns) { const td = document.createElement('td'); td.textContent = row.cells[column.id]; tr.append(td); }
      fragment.append(tr);
    }
    body.replaceChildren(fragment);
    if (focusedId !== undefined) {
      const next = [...body.querySelectorAll<HTMLInputElement>('input')].find(input => input.dataset.rowId === focusedId && !input.disabled);
      (next ?? scroll).focus({ preventScroll: true });
    }
    for (const [id, header] of headers) {
      header.cell.removeAttribute('aria-sort');
      const column = columns.find(item => item.id === id); if (!column) continue;
      header.indicator.textContent = sort?.column === id ? ` (${sort.direction})` : '';
      if (sort?.column === id) header.cell.setAttribute('aria-sort', sort.direction);
      header.button.disabled = loading;
    }
    if (selectAll) {
      const count = visible.filter(row => selected.has(row.id)).length;
      selectAll.checked = count > 0 && count === visible.length; selectAll.indeterminate = count > 0 && count < visible.length; selectAll.disabled = loading || !visible.length;
    }
    scroll.setAttribute('aria-busy', String(loading));
    message.textContent = loading ? 'Loading rows…' : rows.length ? `Showing ${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + visible.length} of ${rows.length} rows. ${selected.size} selected.` : 'No rows to display.';
    pagination.setPage(page);
    if (loading) for (const button of pagination.element.querySelectorAll('button')) button.disabled = true;
  }
  render();
  function ensureAlive(): void { if (destroyed) throw new Error('Data table is destroyed'); }
  return {
    element,
    setRows(input) {
      ensureAlive(); const replacement = copyRows(input); const nextIds = new Set(replacement.map(row => row.id));
      const before = selected.size; for (const id of selected) if (!nextIds.has(id)) selected.delete(id);
      rows = replacement; sortedRows = undefined; page = Math.min(page, totalPages());
      const oldPagination = pagination; const activeButton = pagination.element.contains(document.activeElement) ? [...pagination.element.querySelectorAll('button')].indexOf(document.activeElement as HTMLButtonElement) : -1;
      pagination = makePagination(); oldPagination.element.replaceWith(pagination.element); oldPagination.destroy(); render();
      if (activeButton >= 0) { const button = pagination.element.querySelectorAll('button')[activeButton]; if (button && !button.disabled) button.focus(); else scroll.focus(); }
      if (selected.size !== before) notifySelection();
    },
    setLoading(value) {
      ensureAlive(); if (typeof value !== 'boolean') throw new TypeError('loading must be boolean');
      const active = document.activeElement; loading = value; render();
      if (value && active instanceof HTMLElement && element.contains(active) && active.matches(':disabled')) scroll.focus({ preventScroll: true });
    },
    setPage(value) { ensureAlive(); if (!Number.isInteger(value) || value < 1 || value > totalPages()) throw new RangeError('Invalid page'); page = value; render(); },
    getSelectedIds() { return [...selected]; },
    setSelectedIds(ids) {
      ensureAlive(); if (!Array.isArray(ids)) throw new TypeError('Selection must be an array');
      const available = new Set(rows.map(row => row.id)), next = new Set<string>();
      for (const id of ids) {
        if (typeof id !== 'string' || !available.has(id) || next.has(id)) throw new Error('Selection contains an unknown or duplicate row ID');
        next.add(id);
      }
      if (!options.selectable && next.size) throw new Error('Row selection is not enabled');
      selected.clear(); for (const id of next) selected.add(id); render();
    },
    getPage() { return page; },
    getSort() { return sort ? { ...sort } : null; },
    setSort(value) {
      ensureAlive();
      if (value !== null && (!value || typeof value !== 'object' || !columns.some(column => column.sortable && column.id === value.column) || !['ascending', 'descending'].includes(value.direction))) throw new Error('Invalid sort');
      changeSort(value ? { column: value.column, direction: value.direction } : undefined); render();
    },
    destroy() { if (destroyed) return; destroyed = true; controller.abort(); pagination.destroy(); }
  };
}
