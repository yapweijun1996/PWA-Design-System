# Approved text glyphs

This private, unpublished package supplies a small, curated set of **text glyphs**, not a comprehensive vector icon library. `approved-icons.json` is the authoritative registry. Run `node scripts/icons.mjs` from the repository root after editing it and `node scripts/icons.mjs --check` to verify generated JS and TypeScript declarations; `npm run ssot:check` also enforces freshness.

To reuse it outside the repository, run `npm pack ./packages/icons` from the repository root, then install the resulting `pwa-design-system-icons-0.1.0.tgz` in the consuming project. It is not published to a registry.

```ts
import { getIcon } from '@pwa-design-system/icons';
import { createIconButton } from '@pwa-design-system/core/icon-button';

const settings = createIconButton({ label: 'Settings', icon: getIcon('settings') });
document.body.append(settings.element);
// On removal: settings.destroy(); settings.element.remove();
```

The current names and glyphs are available as `@pwa-design-system/icons/registry.json`. `getIcon` rejects unknown names, and `isApprovedIcon` checks a name. Glyphs inherit the user's font and may render differently across browsers or devices; consistent vector artwork and device-wide visual verification remain **NOT VERIFIED**. The accessible name must describe the action and is supplied separately on the component.

The existing `IconButton.icon: string` API remains compatible with caller-supplied plain text. The registry and repository checks do not inspect external projects or runtime strings, and do not claim that all application icons are automatically approved. Review custom icons and exceptions in the consuming project.
