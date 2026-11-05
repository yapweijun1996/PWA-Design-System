// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataTable, type DataTableOptions } from '../../packages/core/src/table/index';

const columns = [{ id: 'name', label: 'Name', sortable: true }, { id: 'team', label: 'Team' }];
const rows = [
  { id: 'one', cells: { name: 'B', team: 'Ops' } },
  { id: 'two', cells: { name: 'A', team: 'IT' } },
  { id: 'three', cells: { name: 'A', team: 'HR' } }
];
function make(extra: Partial<DataTableOptions> = {}) { const item = createDataTable({ label: 'People', columns, rows, pageSize: 2, selectable: true, ...extra }); document.body.append(item.element); return item; }
function buttons(root: HTMLElement) { return [...root.querySelectorAll('button')]; }
function click(root: HTMLElement, name: string) { const button = buttons(root).find(node => node.textContent === name || node.getAttribute('aria-label') === name); if (!button) throw new Error(`Missing ${name}`); button.click(); }
afterEach(() => document.body.replaceChildren());

describe('DataTable', () => {
  it('renders semantic, text-only cells, stable sorting and page-preserving navigation', () => {
    const sorted = vi.fn(), paged = vi.fn(); const item = make({ onSortChange: sorted, onPageChange: paged });
    expect(item.element.querySelector('caption')?.textContent).toBe('People');
    click(item.element, 'Next'); expect(paged).toHaveBeenCalledWith(2);
    click(item.element, 'Sort by Name'); expect(sorted).toHaveBeenCalledWith({ column: 'name', direction: 'ascending' });
    expect(item.element.querySelector('th[aria-sort]')?.getAttribute('aria-sort')).toBe('ascending');
    expect(item.element.querySelector('tbody')?.textContent).toBe('BOps');
    click(item.element, 'Sort by Name'); expect(item.element.querySelector('th[aria-sort]')?.getAttribute('aria-sort')).toBe('descending');
    expect(item.element.querySelector('tbody')?.textContent).toBe('AHR');
    item.setRows([{ id: 'safe', cells: { name: '<img src=x onerror=alert(1)>', team: 'Safe' } }]);
    expect(item.element.querySelector('tbody img')).toBeNull(); expect(item.element.querySelector('tbody')?.textContent).toContain('<img'); item.destroy();
  });
  it('selects current page, preserves IDs through sorting and prunes removed rows', () => {
    const changed = vi.fn(); const item = make({ onSelectionChange: changed });
    const all = item.element.querySelector<HTMLInputElement>('thead input'); if (!all) throw new Error('Missing select all'); all.click();
    expect(item.getSelectedIds()).toEqual(['one', 'two']); click(item.element, 'Next');
    expect(all.checked).toBe(false); all.click(); expect(item.getSelectedIds()).toEqual(['one', 'two', 'three']);
    click(item.element, 'Sort by Name'); expect(item.getSelectedIds()).toEqual(['one', 'two', 'three']);
    item.setRows([rows[2]]); expect(item.getSelectedIds()).toEqual(['three']); expect(changed).toHaveBeenLastCalledWith(['three']);
    expect(item.element.querySelector('[aria-live="polite"]')?.textContent).toBe('Page 1 of 1'); item.destroy();
  });
  it('supports individual selection, mixed select-all and retains focus', () => {
    const item = make(); const checkbox = item.element.querySelector<HTMLInputElement>('tbody input'); if (!checkbox) throw new Error('Missing checkbox');
    checkbox.focus(); checkbox.click(); const all = item.element.querySelector<HTMLInputElement>('thead input'); expect(all?.indeterminate).toBe(true);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Select one'); item.destroy();
  });
  it('supports empty and loading states while preserving rows, selection and page', () => {
    const item = make(); item.setPage(2); const checkbox = item.element.querySelector<HTMLInputElement>('tbody input'); if (!checkbox) throw new Error('Missing checkbox'); checkbox.click();
    const sort = buttons(item.element).find(button => button.getAttribute('aria-label') === 'Sort by Name'); if (!sort) throw new Error('Missing sort button'); sort.focus();
    item.setLoading(true); expect(document.activeElement?.getAttribute('aria-label')).toBe('People table scroll area'); expect(item.element.querySelector('[aria-busy]')?.getAttribute('aria-busy')).toBe('true');
    expect(item.element.querySelector('[role=status]')?.textContent).toBe('Loading rows…'); expect(buttons(item.element).every(button => button.disabled)).toBe(true);
    item.setLoading(false); expect(item.getSelectedIds()).toEqual(['three']); expect(item.element.querySelector('[aria-live=polite]')?.textContent).toBe('Page 2 of 2');
    item.setRows([]); expect(item.element.querySelector('[role=status]')?.textContent).toBe('No rows to display.'); expect(item.getSelectedIds()).toEqual([]); item.destroy();
  });
  it('validates inputs and applies row replacement transactionally', () => {
    const item = make();
    expect(() => item.setRows([rows[0], rows[0]])).toThrow(/Duplicate row/);
    expect(() => item.setRows([{ id: 'x', cells: { name: 'X' } }])).toThrow(/Missing text cell/);
    expect(item.element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(() => item.setPage(0)).toThrow(); expect(() => item.setLoading(undefined as unknown as boolean)).toThrow();
    expect(() => make({ columns: [columns[0], columns[0]] })).toThrow(/Duplicate column/);
    expect(() => make({ pageSize: 0 })).toThrow(); expect(() => make({ rows: [{ id: '__proto__', cells: { name: 'X', team: 'Y' } }] })).toThrow();
    item.destroy(); item.destroy(); expect(() => item.setPage(1)).toThrow(/destroyed/);
  });
  it('releases listeners on destroy and leaves removal to the caller', () => {
    const onSortChange = vi.fn(); const item = make({ onSortChange }); item.destroy(); click(item.element, 'Sort by Name');
    expect(onSortChange).not.toHaveBeenCalled(); expect(item.element.isConnected).toBe(true);
  });
  it('programmatically controls selection, sort and page without user callbacks', () => {
    const selection = vi.fn(), sorting = vi.fn(), paging = vi.fn(); const item = make({ onSelectionChange: selection, onSortChange: sorting, onPageChange: paging });
    item.setSelectedIds(['one', 'three']); item.setSort({ column: 'name', direction: 'descending' }); item.setPage(2);
    expect(item.getSelectedIds()).toEqual(['one', 'three']); expect(item.getSort()).toEqual({ column: 'name', direction: 'descending' }); expect(item.getPage()).toBe(2);
    const sort = item.getSort(); if (!sort) throw new Error('Missing sort'); sort.direction = 'ascending'; expect(item.getSort()?.direction).toBe('descending');
    expect(selection).not.toHaveBeenCalled(); expect(sorting).not.toHaveBeenCalled(); expect(paging).not.toHaveBeenCalled();
    expect(() => item.setSelectedIds(['one', 'one'])).toThrow(); expect(() => item.setSelectedIds(['missing'])).toThrow();
    expect(item.getSelectedIds()).toEqual(['one', 'three']); expect(() => item.setSort({ column: 'team', direction: 'ascending' })).toThrow();
    item.setSort(null); expect(item.getSort()).toBeNull(); item.destroy();
  });

});
