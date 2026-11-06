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

The Studio uses the shared Explorer / Canvas / Inspector workspace. Desktop pane widths are adjustable with pointer or keyboard separators when three readable panes fit. The category Explorer collapses at intermediate widths; phones switch Categories / Workspace / Token details panels. Resizing and switching panels retain the selected token and draft.

The Canvas starts with a compact table of all 48 editable semantic tokens. Search matches names, types, declared sources, resolved values and overrides. Category and Modified only filters combine without changing the draft or selected Inspector token. Modified only includes saved overrides and pending removals in the current scope. A selected token outside the current filter remains editable and is explicitly identified as outside the results. The table owns one bounded vertical/horizontal scroll region with a sticky header; selecting a bottom row brings its Inspector into the editing path.

Only one override input and one applicable color picker are mounted in the Inspector. Selecting a table name changes that editor's token identity. Default is the selected appearance preset; Resolved includes the current draft; an empty Override inherits. The Inspector groups these values and the resolved color swatch next to the literal/alias input and explicit picker. Choosing a color replaces an alias with a literal; simply viewing or changing themes does not. The selected token's dependency chain is visible without opening a disclosure; semantic links select another token without discarding drafts. The optional source disclosure includes direct and transitive dependents. This is declaration inspection using the existing layer order, not a second resolver; cycles/missing references remain diagnosable while the authoritative engine blocks invalid saving.

**Editing scope** chooses which override map changes. **Canvas theme** affects only the workspace preview and values; it does not change Studio theme, root appearance or the saved preference. Scope/theme context and a mismatch action remain explicit. Unsaved count, Commit, Cancel and Undo share the toolbar. Review changes lists cross-scope differences; Reset previews removal of all overrides until Commit. Nothing writes repository token JSON.

Canvas tabs **Tokens**, **Preview** and **Info** support Left/Right, Home and End with roving tab focus. Preview holds real Button states, Input, Card, Alert, Dialog and Data Table examples. These scene nodes remain mounted when values change, preserving focused controls, sorted table state and open dialogs. The comparison checkbox shows both themes; comparison layout adapts to actual canvas space. Hiding Preview dismisses its open dialogs. Ratio labels use unrounded thresholds despite displaying two decimal places and cover only selected contrast pairs, not WCAG conformance.

Info contains read-only primitive categories, build-time breakpoint explanations and token-override guidance. Copy actions report clipboard failure. Inspector inputs retain accessible descriptions for purpose, type, inherited/default/resolved values and blocking validation without relying on closed disclosure text.

The import status announces reading and validation before preview. Committing during a pending read explicitly cancels that import and saves the current validated draft; a later file response cannot replace it. Persistent draft validation has its own associated diagnostic, so clipboard feedback, pending/rejected imports and navigation warnings cannot replace the blocking reason. A contrast-invalid project or rejected import shows an example failing theme/palette/density/kit combination for each pair using that configuration's resolved values. A valid HEX can pass the local preview and still block project-wide saving because another combination fails; its syntax remains valid and the blocking diagnostic stays associated with the selected overridden field.
