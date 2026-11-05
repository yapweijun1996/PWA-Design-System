# React adapters

`@pwa-design-system/react` is a private, pre-release optional adapter for the framework-independent core. React, React DOM and `@pwa-design-system/core` are peer dependencies; core itself does not depend on React. Local development uses React 19.3.1. Load the generated token CSS and the relevant core CSS in the consuming application.

From the repository root run `npm ci` and `npm run build:react`, then `npm run dev:react-example`. For a clean consumer, pack `packages/core`, `packages/tokens` and `packages/react`, install the local tarballs together with compatible React and React DOM, and provide `@types/react` / `@types/react-dom` for TypeScript. No public registry release is implied.

```tsx
import { useState } from 'react';
import { Button, FormField } from '@pwa-design-system/react';
import '@pwa-design-system/tokens/tokens.css';
import '@pwa-design-system/core/foundation.css';
import '@pwa-design-system/core/forms.css';

function Profile() {
  const [name, setName] = useState('Alex');
  return <>
    <FormField label="Name" control={{ id: 'profile-name', value: name }} onValueChange={setName} />
    <Button label="Save" onClick={() => console.log(name)} />
  </>;
}
```

All 20 current core families have adapters: Button, IconButton, Badge, Card, Separator, Tooltip, Input, Textarea, Checkbox, RadioGroup, Switch, Select, FormField, Tabs, Breadcrumb, Menu, Pagination, Dialog, Alert and Toast. Each delegates construction and semantics to the core and cleans up its owned listeners on replacement/unmount. The adapters create a block-level host `<div>`, so do not place them where a block element is invalid.

`Input`, `Textarea`, `Select`, `RadioGroup` and `FormField` accept `onValueChange(value)`; Checkbox and Switch accept `onCheckedChange(checked)`. Button callbacks receive native `MouseEvent` rather than React synthetic events. Tabs and Pagination use their core callbacks. To control state, pass the corresponding value/checked/selectedIndex and update it in the callback. A controlled value is restored if its callback does not update the corresponding prop. Text controls retain their DOM node across prop updates and defer controlled restoration during IME composition. Uncontrolled input and choice state is retained on unrelated prop updates, including native form resets. An open menu and its focused item are restored after item options change. Do not switch an adapter between controlled and uncontrolled usage during its lifetime. Core options, errors, labels and keyboard behavior remain authoritative.

For controlled Dialog, pass `open` and update it to false in `onClose`; if the owner rejects dismissal by keeping `open` true, the dialog reopens and focus returns inside it. The currently active element is the opener; on platforms where clicking a button does not focus it, focus the invoking control before setting `open`. Card accepts plain `content` text, not arbitrary React children. Tooltip accepts a non-empty plain-text button label and text, not an arbitrary child trigger. FormField wraps a core text input specified by `control`, not an arbitrary React child. Menu and Tooltip require the core's native Popover API support. These are explicit limitations, not full arbitrary-composition parity.

Import and `renderToString` are server-safe: no DOM is accessed during import or server render. The server output is an empty block host; the actual interactive core element mounts in an effect after hydration. Thus the adapters do **not** provide server-rendered component content, no-JavaScript interaction, or an accessible SSR fallback. Applications needing those capabilities should use a separate server-rendered strategy.

For CI, run `npm ci` and `npm run build:react` before root typechecking and tests: the latter import the core and React package build outputs. `npm run typecheck:react` checks the adapter and `npx playwright test -c examples/react/playwright.config.ts` exercises the example in a real browser. Browser/assistive-technology combinations not explicitly tested remain unverified.
