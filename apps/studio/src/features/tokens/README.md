# Studio token editor

The editor reads the repository's primitive, semantic and appearance JSON sources through the same pure validation and resolution engine used by the Node token compiler. Repository files and generated artifacts remain unchanged. Primitive values are shown read-only; semantic roles can be overridden in the current browser.

Choose **All themes**, **Light only** or **Dark only**, then enter a typed literal or a full alias such as `{semantic.color.primary}` or `{primitive.color.white}`. An empty field removes that scope's override. Preview changes are staged: **Commit changes** validates and saves them; **Cancel draft** restores the last committed values; **Reset draft to defaults** previews defaults until committed. Theme-specific overrides take precedence over all-theme overrides, which take precedence over the selected theme, palette, density and kit. Layout breakpoints are read-only build-time constants, not live CSS overrides. The separate viewport presets are example widths. Change these values in repository token JSON, then run `npm run tokens:build` and `npm run tokens:check`; media conditions are generated or checked against that source. Existing saved breakpoint overrides are ignored with a notice, while other valid overrides remain active and stored data is not rewritten until a new commit. New imports cannot override build-time breakpoints.

A file import is limited to 64 KiB. Its object structure, version, unique keys, known token names, types, aliases and bounds are checked before preview. Representative text, control-border and focus color pairs must also pass contrast checks before an import or commit. These checks cover selected pairs across the 96 supported appearance combinations; they do not establish WCAG conformance. The editor prepares a validated, isolated snapshot of the repository sources when opened, then validates each draft against all 96 combinations; imports and commits still run the full validation path. Invalid imports leave the current draft and saved settings intact. Editing, changing scope, resetting, canceling or committing while an import is still reading cancels that pending import, preserving newer work. If storage fails, committing leaves the previous applied and saved settings intact.

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

## Visual workspace

**Editing scope** chooses which override map is changed. **Preview theme** is local to this workspace; it does not change the top-bar theme, root appearance or saved preference. A mismatch notice offers to preview the editing theme. Default values come from the current palette/density/kit with no project overrides; Resolved values include the draft in the selected preview theme. A resolution error labels the retained last-valid preview explicitly; contrast-invalid but resolvable drafts remain visible and cannot be committed or exported.

Search matches names, types, declared aliases, raw overrides and resolved preview values. Category and **Modified only** filters never alter the project. Modified only includes saved overrides in the selected editing scope and pending removals. The unsaved count and **Review changes** compare all three draft scopes to the last successful commit. Undo retains at most 50 whole-draft actions; filtering, scope, view and preview selection are not undo actions. A successful commit or cancel clears the history. Failed storage keeps the draft and undo history. Reset stages removal of all overrides across every scope and can be undone before commit.

Color swatches show resolved preview colors; the native **Choose HEX** picker replaces the selected-scope override only when explicitly changed. Opening or refreshing the UI does not replace aliases. The comparison view uses the same draft in both themes. Button states, Input, Card, Alert, Dialog and Data Table examples reuse core factories and retain their DOM while token inputs change; all examples are destroyed when leaving the editor. Ratio labels use unrounded thresholds despite displaying two decimal places.

On narrow screens, **Editor** and **Preview** switch between one-column surfaces without losing the draft. Desktop shows the editor and a bounded sticky preview rail together. Primitive source categories and build-time breakpoint explanations are read-only disclosures. Copy actions report actual clipboard failure. Source/direct-use details list immediate semantic references and project aliases, not a transitive dependency graph.

The import status announces reading and validation before preview. Committing during a pending read explicitly cancels that import and saves the current validated draft; a later file response cannot replace it. A contrast-invalid project shows an example failing theme/palette/density/kit combination for each reported pair. This bounded diagnostic pass reuses the existing contrast checker only after the project is known to fail. A valid HEX can pass the selected preview and still block project-wide saving because another combination fails; it remains syntactically valid, with the blocking status associated with overridden fields.
