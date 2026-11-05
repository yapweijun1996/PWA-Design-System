import { Component, StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Checkbox, Dialog, Input, Menu, Tabs, Tooltip } from '@pwa-design-system/react';

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>Tooltip rejected</p> : this.props.children; }
}
function Fixture() {
  const [ime, setIme] = useState('A');
  const [size, setSize] = useState<'md' | 'lg'>('md');
  const [disabled, setDisabled] = useState(false);
  Object.assign(window, { resizeUncontrolled: () => setSize('lg'), disableSecond: () => setDisabled(true) });
  return <main><h1>Adapter regressions</h1>
    <Input id="reject" ariaLabel="Rejected input" value="fixed" onValueChange={() => {}} />
    <Checkbox id="rejected-check" label="Rejected check" checked={false} onCheckedChange={() => {}} />
    <Tabs label="Rejected tabs" selectedIndex={0} tabs={[{ label: 'First tab', content: 'One' }, { label: 'Second tab', content: 'Two' }]} onChange={() => {}} />
    <Input id="ime" ariaLabel="IME input" value={ime} onValueChange={setIme} />
    <form><Input id="reset" ariaLabel="Reset input" size={size} /></form>
    <Menu label="Actions" items={[{ label: 'First item', onSelect() {} }, { label: 'Second item', disabled, onSelect() {} }]} />
    {location.search === '?dialog' && <Dialog title="Rejected dialog" description="Stay open" open onClose={() => { Object.assign(window, { dialogCloseCalls: ((window as unknown as { dialogCloseCalls?: number }).dialogCloseCalls ?? 0) + 1 }); }} />}
    <div id="tooltip-boundary"><Boundary><Tooltip label=" " text="Help" /></Boundary></div>
  </main>;
}
const root = document.getElementById('root'); if (!root) throw new Error('Missing fixture root');
createRoot(root).render(<StrictMode><Fixture /></StrictMode>);
