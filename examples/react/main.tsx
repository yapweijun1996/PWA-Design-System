import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Checkbox, Dialog, FormField, Tabs } from '@pwa-design-system/react';
import '../../packages/tokens/generated/tokens.css';
import '@pwa-design-system/core/foundation.css';
import '@pwa-design-system/core/forms.css';
import '@pwa-design-system/core/navigation.css';
import '@pwa-design-system/core/feedback.css';
import './styles.css';

function Example() {
  const [name, setName] = useState('Alex');
  const [notifications, setNotifications] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  return <main>
    <h1>React adapter example</h1>
    <p>Core components managed by React; no network or account is required.</p>
    <FormField label="Name" control={{ id: 'example-name', value: name }} onValueChange={setName} description="Your display name" />
    <p>Preview: <strong data-testid="name-preview">{name}</strong></p>
    <Checkbox id="example-updates" label="Receive updates" checked={notifications} onCheckedChange={setNotifications} />
    <p>Updates: <span data-testid="updates-preview">{notifications ? 'on' : 'off'}</span></p>
    <Tabs label="Example views" tabs={[{ label: 'Summary', content: 'Summary panel' }, { label: 'Details', content: 'Details panel' }]} selectedIndex={tab} onChange={setTab} />
    <Button label="Open dialog" onClick={() => setOpen(true)} />
    <Dialog open={open} title="Example dialog" description="Close this dialog to return to the example." onClose={() => setOpen(false)} />
  </main>;
}
const root = document.getElementById('root');
if (!root) throw new Error('Example root is missing');
createRoot(root).render(<StrictMode><Example /></StrictMode>);
