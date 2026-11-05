# Core components

Framework-independent DOM factories. This package and the tokens package are private development packages; they have not been published. Build core from the repository root with `npm run build:core` before consuming its ESM exports.

In a bundler that supports CSS imports, load the generated tokens first and then the styles for the component families you use:

```ts
import '@pwa-design-system/tokens/tokens.css';
import '@pwa-design-system/core/foundation.css';
import { createButton } from '@pwa-design-system/core/button';

const save = createButton({ label: 'Save', onClick: () => console.log('Save') });
document.body.append(save.element);
// When the component is no longer needed:
// save.destroy(); save.element.remove();
```

Other stylesheet exports are `forms.css`, `navigation.css`, and `feedback.css`. Load each through the core package subpath. `destroy()` releases owned listeners and timers; the caller removes the root element. The APIs and browser support remain under active development.

The Tooltip requires the native Popover API and throws an explicit error if it is unavailable. It stays in the trigger's DOM tree to retain scoped theme properties while the browser displays it in the top layer. Chromium tests cover transformed, clipped containers and a transformed native dialog; equivalent Firefox, WebKit and assistive-technology checks are separate evidence.
