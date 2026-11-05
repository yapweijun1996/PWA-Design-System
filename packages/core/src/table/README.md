# Data Table

Import `createDataTable` from `@pwa-design-system/core/table`, together with token CSS and `@pwa-design-system/core/table.css`. The factory creates a native table and returns `{ element, setRows, setLoading, setPage, getPage, getSelectedIds, setSelectedIds, getSort, setSort, destroy }`; the caller appends and removes `element` and calls `destroy()` when finished. The table has one visual size/style.

```ts
import { createDataTable } from '@pwa-design-system/core/table';
import '@pwa-design-system/tokens/tokens.css';
import '@pwa-design-system/core/table.css';

const table = createDataTable({
  label: 'People', pageSize: 10, selectable: true,
  columns: [{ id: 'name', label: 'Name', sortable: true }, { id: 'team', label: 'Team' }],
  rows: [{ id: 'person-1', label: 'Ada', cells: { name: 'Ada', team: 'Design' } }],
  onSelectionChange(ids) { console.log(ids); }
});
document.body.append(table.element);
// On removal: table.destroy(); table.element.remove();
```

Each column has a unique `id`, non-empty `label`, and optional `sortable` (default false). Each row has a stable unique `id`, an optional non-empty accessible `label` (defaults to its ID), and exactly one string cell per column. Cells are text, not HTML. Duplicate or missing IDs/cells and invalid options are rejected. `label`, `columns` and `rows` are required. `pageSize` defaults to 10 and accepts integers 1–1000; `selectable` and `loading` default to false. Optional `onSelectionChange(ids)`, `onPageChange(page)` and `onSortChange({column, direction})` receive user actions. `setRows` additionally reports a selection change if it removes selected IDs; programmatic `setPage` and page clamping do not invoke `onPageChange`.

Sorting uses locale-aware text comparison with numeric ordering and stable ties. A newly sorted column starts ascending and toggles descending; sorting retains the current one-based page and selected IDs. Select-all affects the current page only. Selection spans pages and sorting. `setRows` validates the entire replacement before applying it, retains selection for IDs still present, prunes missing IDs, and clamps the current page. `setLoading(true)` disables sorting, selection and pagination while retaining state; `setLoading(false)` restores it. `setSelectedIds` accepts existing unique IDs (and requires `selectable` for a non-empty selection); `setSort` accepts a sortable column and ascending/descending direction, or null to clear sorting. These programmatic setters and `setPage` do not emit user-action callbacks. An empty dataset shows a message with disabled selection and pagination. The focusable scroll region permits keyboard horizontal scrolling on narrow screens.

There is no virtualization, resizing, pinned columns, inline editing, arbitrary cell markup, selectable per-row disabling, external sorting or server pagination. Screen-reader and additional browser combinations beyond the documented test evidence remain unverified. This is not a WCAG conformance certification.
