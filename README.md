# PWA Design System

PWA Design System is an early-stage, framework-independent design-system project. It contains a token compiler, a core library with 20 component families, and a small Studio foundation. The core and token packages are **private and unpublished**; the project is not yet production-ready or an installable PWA.

## What is available

- JSON token sources and a deterministic compiler that emits CSS custom properties, JSON and TypeScript for 96 theme, palette, density and kit combinations.
- Framework-independent DOM factories for Button, Icon Button, Badge, Card, Separator, Tooltip, Input, Textarea, Checkbox, Radio Group, Switch, Select, Form Field, Tabs, Breadcrumb, Menu, Pagination, Dialog, Alert and Toast.
- A machine-readable component inventory with a check for required families, source exports, package entry points and unit/browser test-call references. This check does not prove behavior or test execution.
- A foundation-only Studio with token-role previews and light, dark or system theme selection. Light is the default; browser storage is used for the preference when available. Palette, density and kit controls are not yet exposed in the Studio.
- A [working Vanilla example](examples/vanilla/README.md) covering the 20 current families, plus unit tests and Playwright browser tests with scoped axe checks.

The Studio component playground, token editor, layout playground, AI agent exports, React adapters and offline installation/update features are **not implemented**. Several core components currently offer one size or style, and some interaction APIs are intentionally limited; see the [core guide](packages/core/README.md) and family guides. There is no verified WCAG conformance or production release.

## Getting started

The intended minimum browsers are Chrome and Edge 114, Firefox 125, and Safari and iOS Safari 17. Tooltip requires the native Popover API and reports an error if it is unavailable. These minimum versions have not all been verified on their actual releases or devices.

Use Node.js `^22.13.0 || >=24.0.0` and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The Studio uses `/PWA-Design-System/` as its base path. Build and preview it with:

```sh
npm run build
npm run preview
```

The build output is `dist/studio/`. The GitHub Pages deployment workflow is deliberately disabled pending the remaining release gates; the live target has **not been verified**.

## Core and examples

Build the private core package from its TypeScript sources:

```sh
npm run build:core
```

The [core guide](packages/core/README.md) describes its ESM and stylesheet entry points. The private token package exposes generated CSS, JSON and TypeScript. The [Vanilla example](examples/vanilla/README.md) shows how to serve the built core and generated styles locally; it does not require a framework. Package publication and stable versioned integration are not yet established.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run contracts:check
npm run build:core
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright's configuration starts a local Vite server. Browser installation may require network access and platform dependencies. The browser suite exercises selected interactions and scoped axe checks; these do not prove full accessibility, browser compatibility or visual quality. Visual regression baselines, manual assistive-technology evidence, complete responsive/state coverage and offline/update tests remain outstanding. See [Architecture](docs/ARCHITECTURE.md) for the exact boundaries.

## Tokens

The authoritative sources are in `packages/tokens/`: `primitives.json`, `semantics.json`, and the theme, palette, density and kit files. Edit these sources, not `packages/tokens/generated/`. Regenerate and verify after a source change:

```sh
npm run tokens:build
npm run tokens:check
```

The compiler validates token values and alias references, rejects cycles and CSS variable-name collisions, and emits a resolved matrix of 96 combinations. The output uses semantic CSS custom properties. Its Node compiler is not a browser-side import validator.

See the [Phase 0 audit](docs/PHASE-0-AUDIT.md) for research and risks. Original project code is available under the [MIT License](LICENSE); dependency notices and distribution obligations remain to be reviewed before release.
