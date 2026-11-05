# Studio token editor

The editor reads the repository's primitive, semantic and appearance JSON sources through the same pure validation and resolution engine used by the Node token compiler. Repository files and generated artifacts remain unchanged. Primitive values are shown read-only; semantic roles can be overridden in the current browser.

Choose **All themes**, **Light only** or **Dark only**, then enter a typed literal or a full alias such as `{semantic.color.primary}` or `{primitive.color.white}`. An empty field removes that scope's override. Preview changes are staged: **Commit changes** validates and saves them; **Cancel draft** restores the last committed values; **Reset draft to defaults** previews defaults until committed. Theme-specific overrides take precedence over all-theme overrides, which take precedence over the selected theme, palette, density and kit. Breakpoint tokens are reference values and do not rewrite CSS media queries.

A file import is limited to 64 KiB. Its object structure, version, unique keys, known token names, types, aliases and bounds are checked before preview. Representative text, control-border and focus color pairs must also pass contrast checks before an import or commit. These checks cover selected pairs across the 96 supported appearance combinations; they do not establish WCAG conformance. Invalid imports leave the current draft and saved settings intact. Editing, changing scope, resetting, canceling or committing while an import is still reading cancels that pending import, preserving newer work. If storage fails, committing leaves the previous applied and saved settings intact.

The versioned JSON export represents project overrides, not repository source files:

```json
{
  "schema": "pwa-design-system/token-overrides",
  "version": 1,
  "overrides": {
    "global": {},
    "light": { "color.surface": "#fafafa" },
    "dark": {}
  }
}
```

Exported CSS contains validated resolved semantic values for all combinations. Load it after the base generated token CSS. Theme selection is represented by `data-theme="light"` or `data-theme="dark"`; the application must resolve any system preference to one of those values. Palette, density and kit use `data-palette`, `data-density` and `data-kit`. Missing attributes resolve to light, blue, comfortable and default respectively.

On Studio startup, the blocking prepaint bootstrap uses the same parser, resolver and contrast checks before inserting generated CSS. The application initializer revalidates and adopts the saved data before removing the temporary style. Neither path evaluates imported JavaScript or accepts arbitrary CSS. Runtime custom properties and the temporary style are dynamic inline styles; a deployment Content Security Policy must account for this. Static GitHub Pages cannot pre-hash user-specific style contents. Keep script policy independently restrictive and test any CSP against customization and prepaint behavior.

Manual screen-reader testing, additional browser/device testing, contrast checks for all actual component states and review of focus indicator sizes remain release work.
