# Foundation component API

These framework-independent DOM factories are exported from `@pwa-design-system/core` and their named package subpaths. Load `@pwa-design-system/tokens/tokens.css` followed by `@pwa-design-system/core/foundation.css`. Each returns `{ element, destroy() }`. Append the element yourself; `destroy()` releases owned resources and the caller removes the root element. The [vanilla examples](../../../../examples/vanilla/README.md) demonstrate all six families in a runnable page.

## Button and Icon Button

- `createButton({ label, size?, variant?, type?, disabled?, loading?, onClick? })` creates a native button with a required non-empty text label.
- `createIconButton({ label, icon, size?, variant?, type?, disabled?, loading?, onClick? })` creates a native button whose required non-empty `label` is its accessible name. `icon` is a required plain-text glyph, hidden from the accessible name; it is not HTML or an icon registry.
- Both default to `size: 'medium'`, `variant: 'primary'`, `type: 'button'`, enabled and not loading. Sizes are `small`, `medium`, `large`; variants are `primary`, `secondary`, `ghost`; types are `button`, `submit`, `reset`. `onClick` is optional.
- `disabled` or `loading` disables activation; loading additionally sets `aria-busy="true"`. No spinner or runtime state setter is supplied. Native Tab, Enter and Space behavior applies when enabled. Small controls can require additional target spacing in the host layout.

## Badge

`createBadge({ label, variant? })` creates noninteractive text. `label` must be non-empty; `variant` is `neutral` (default), `primary`, `success` or `danger`. There is one size; disabled and loading states are not applicable. Communicate meaning in the text rather than color alone.

## Card

`createCard({ label?, variant? })` creates a noninteractive `<section>`. The optional non-empty `label` provides an accessible name; `variant` is `outlined` (default) or `elevated`. There is one size and no loading or disabled state. The caller adds content and owns its semantics and keyboard behavior.

## Separator

`createSeparator({ orientation? })` creates a horizontal native `<hr>` by default or a noninteractive vertical separator with `orientation: 'vertical'`. Both have one size and style; loading and disabled states do not apply. Separators are not keyboard controls.

## Tooltip

`createTooltip({ trigger, text })` wraps the caller's focusable `HTMLElement` trigger and a plain-text tooltip. `text` must be non-empty. Focus or hover shows it; Escape dismisses it. The trigger receives an `aria-describedby` reference, which is removed on `destroy()` while unrelated references are preserved. It has one size/style and no loading or disabled state. Tooltip text supplements the trigger's accessible name; provide that name separately.

Tooltip requires the browser's native Popover API and throws if unavailable. It remains in the trigger's DOM tree to inherit scoped theme values and is positioned in the top layer. Browser and assistive-technology support must be verified for the consuming application; the package does not claim WCAG conformance. Test long labels, zoom and narrow viewports in the host layout for all families.
