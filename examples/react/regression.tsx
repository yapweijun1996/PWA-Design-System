import { Component, StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Checkbox, DataTable, Dialog, Input, Menu, Tabs, Tooltip, type DataTableProps } from '@pwa-design-system/react';

class Boundary extends Component<{ children: ReactNode; fallback?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>{this.props.fallback ?? 'Tooltip rejected'}</p> : this.props.children; }
}
function Fixture() {
  const [ime, setIme] = useState('A');
  const [size, setSize] = useState<'md' | 'lg'>('md');
  const [disabled, setDisabled] = useState(false);
  const [tableLabel, setTableLabel] = useState('Uncontrolled people');
  const [extraRow, setExtraRow] = useState(false);
  const [invalidCallback, setInvalidCallback] = useState(new URLSearchParams(location.search).get('invalid-table') ?? '');
  const columns = [{ id: 'name', label: 'Name', sortable: true }];
  const rows = [{ id: 'a', cells: { name: 'Ada' } }, { id: 'b', cells: { name: 'Bea' } }, ...(extraRow ? [{ id: 'c', cells: { name: 'Cleo' } }] : [])];
  Object.assign(window, { resizeUncontrolled: () => setSize('lg'), disableSecond: () => setDisabled(true), updateTableRows: () => setExtraRow(true), updateTableLabel: () => setTableLabel('Updated people'), setInvalidTableCallback: (name: string) => setInvalidCallback(name) });
  return <main><h1>Adapter regressions</h1>
    <Input id="reject" ariaLabel="Rejected input" value="fixed" onValueChange={() => {}} />
    <Checkbox id="rejected-check" label="Rejected check" checked={false} onCheckedChange={() => {}} />
    <Tabs label="Rejected tabs" selectedIndex={0} tabs={[{ label: 'First tab', content: 'One' }, { label: 'Second tab', content: 'Two' }]} onChange={() => {}} />
    <Input id="ime" ariaLabel="IME input" value={ime} onValueChange={setIme} />
    <form><Input id="reset" ariaLabel="Reset input" size={size} /></form>
    <Menu label="Actions" items={[{ label: 'First item', onSelect() {} }, { label: 'Second item', disabled, onSelect() {} }]} />
    {location.search === '?dialog' && <Dialog title="Rejected dialog" description="Stay open" open onClose={() => { Object.assign(window, { dialogCloseCalls: ((window as unknown as { dialogCloseCalls?: number }).dialogCloseCalls ?? 0) + 1 }); }} />}
    <DataTable label="Controlled people" columns={columns} rows={rows} pageSize={1} selectable selectedIds={[]} page={1} sort={null} />
    <DataTable label={tableLabel} columns={columns} rows={rows} pageSize={1} selectable />
    {location.search.startsWith('?invalid-table') && <Boundary fallback="Invalid callback rejected"><DataTable label="Callback validation" columns={columns} rows={rows} {...({ [invalidCallback]: invalidCallback ? 'not a function' : undefined } as unknown as Partial<DataTableProps>)} /></Boundary>}
    <div id="tooltip-boundary"><Boundary><Tooltip label=" " text="Help" /></Boundary></div>
  </main>;
}
const root = document.getElementById('root'); if (!root) throw new Error('Missing fixture root');
createRoot(root).render(<StrictMode><Fixture /></StrictMode>);
