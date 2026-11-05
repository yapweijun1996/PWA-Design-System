# PWA Design System

PWA Design System is an early-stage, framework-independent design system and Studio for developers building consistent interfaces. It combines reusable DOM components, a shared token compiler, interactive previews and a component inventory for tooling. The core and token packages are **private and unpublished**; this is not yet a production release or an installable PWA.

## What is available

- JSON token sources and a deterministic compiler generate CSS custom properties, JSON and TypeScript for 96 theme, palette, density and visual-kit combinations.
- The core library contains 20 component families: Button, Icon Button, Badge, Card, Separator, Tooltip, Input, Textarea, Checkbox, Radio Group, Switch, Select, Form Field, Tabs, Breadcrumb, Menu, Pagination, Dialog, Alert and Toast. The [core guide](packages/core/README.md) and family guides document their current APIs and limits.
- The Studio has hash-linked navigation, a responsive sidebar and mobile drawer, plus light, dark and system appearance. Its component catalog is searchable; the playground shows live components, supported property controls, API and keyboard notes, and code generated from the same preview configuration. Some properties and states are deliberately not editable in the playground.
- The token editor stages semantic overrides, previews them, and supports validated JSON import and JSON/CSS export. A Layout Playground previews seven local examples at selectable and adjustable iframe widths.
- A machine-readable component inventory and an automated check cover required family identities, source exports, package entry points and test-call references. They do not establish that the referenced behavior or tests are complete.
- A [Vanilla example](examples/vanilla/README.md), unit tests and Playwright tests with scoped axe checks exercise the current library.

The separate Theme Builder, Accessibility Lab, AI Agent Rules and Documentation Studio sections are pending. Agent rule exports, React adapters, PWA installation and offline/update behavior are not implemented. Layout Playground's Data Table is a **static HTML layout example**, not the planned enterprise Data Table component; its dialog example is also static. There is no verified WCAG conformance or production release.

## Getting started

Use Node.js `^22.13.0 || >=24.0.0` and npm:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Studio routes use URL fragments, for example `/PWA-Design-System/#components`, so deep links work under the configured GitHub Pages subpath. On desktop, the sidebar can be collapsed for the current session; tablet and mobile use their own responsive navigation. Theme selection is stored in the browser when storage is available, with Light as the default.

Build and preview the production assets locally:

```sh
npm run build
npm run preview
```

The output is `dist/studio/`. Vite may warn that the classic token prepaint script is not bundled as a module: the build emits that script separately so it can run before the stylesheet. The Pages deployment workflow is deliberately disabled pending release gates; the proposed live site has **not been verified**.

The intended minimum browser versions are Chrome and Edge 114, Firefox 125, and Safari and iOS Safari 17. Tooltip and Menu require the native Popover API and fail explicitly if it is unavailable. These minimum releases and devices have not all been verified.

## Using the Studio token editor

Open **Design Tokens**. Primitive values are read-only; semantic fields accept a valid value for their token type or a full alias such as `{semantic.color.primary}`. Choose **All themes**, **Light only** or **Dark only**. Theme-specific overrides take precedence over all-theme overrides, which take precedence over the selected theme, palette, density and visual kit. The current preview follows the Studio's appearance; breakpoint tokens are reference values and do not rewrite CSS media queries.

Edits and imports are staged in the preview. **Commit changes** validates and saves the project overrides in this browser; **Cancel draft** restores the committed configuration, and **Reset draft to defaults** previews a reset until it is committed. A failed storage write leaves the previous committed configuration in place. An import still being read is canceled if the draft is subsequently edited, reset, canceled or committed.

**Import token configuration** accepts the versioned override JSON format up to 64 KiB. Parsing checks its shape, duplicate or forbidden keys, known token names, types, aliases and bounds before applying it to the draft. Invalid imports do not replace the draft or committed settings. Representative text, focus and control-border contrast pairs are checked across the 96 combinations; this is not a complete accessibility audit. Imports are data: the editor does not execute imported JavaScript or evaluate expressions.

**Export JSON** downloads project overrides; **Export CSS** downloads validated resolved values for the supported combinations. Load exported CSS after the base generated tokens, and set the documented appearance attributes. Repository source JSON and checked-in generated artifacts are not changed by editor use. The [token editor guide](apps/studio/src/features/tokens/README.md) contains the format, precedence and Content Security Policy considerations.

## Core and examples

Build the private core package from TypeScript:

```sh
npm run build:core
```

Load generated token CSS before the core styles for the component families in use. The [core guide](packages/core/README.md) describes ESM and stylesheet entry points; the private token package exposes generated CSS, JSON and TypeScript. The [Vanilla example](examples/vanilla/README.md) shows how to serve the built core and generated styles locally without a framework. Publication and stable versioned package integration are not yet established.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run contracts:check
npm run build:core
npm run build
npm run check:artifact
npx playwright install chromium
npm run test:e2e
npm run test:production
```

`test:e2e` starts a local Vite server. `test:production` requires a current Studio build and starts a local production preview for first-frame and subpath checks. Browser installation may require network access and platform dependencies. Automated tests and scoped axe checks do not prove full accessibility, browser compatibility or visual quality. Manual assistive-technology checks, reviewed visual baselines, broader device coverage and offline/update tests remain outstanding.

## Token sources

The authoritative repository sources are in `packages/tokens/`: `primitives.json`, `semantics.json`, and theme, palette, density and kit files. Edit those sources, not `packages/tokens/generated/`. Regenerate and verify after a source change:

```sh
npm run tokens:build
npm run tokens:check
```

See [Architecture](docs/ARCHITECTURE.md) for boundaries and remaining work, and the [Phase 0 audit](docs/PHASE-0-AUDIT.md) for initial research. Original project code is available under the [MIT License](LICENSE); dependency notices and distribution obligations remain to be reviewed before release.
