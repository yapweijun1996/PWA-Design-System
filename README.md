# PWA Design System

PWA Design System is an in-development, framework-independent component library and interactive Studio for teams building consistent interfaces. It combines reusable DOM components, a token source of truth, live customization and exportable rules for coding agents. The core, tokens and optional React packages are **private and unpublished**. This is not a production release.

## What is available

- JSON token sources and a deterministic compiler generate CSS, JSON and TypeScript for 96 combinations of resolved theme, palette, density and visual kit.
- The [core library](packages/core/README.md) provides 21 component families: Button, Icon Button, Badge, Card, Separator, Tooltip, Input, Textarea, Checkbox, Radio Group, Switch, Select, Form Field, Tabs, Breadcrumb, Menu, Pagination, Dialog, Alert, Toast and Data Table. Family guides describe their supported APIs and limitations.
- The Studio offers responsive navigation, a searchable component catalog and a playground with previews, supported controls, API notes and code generated from the same configuration. It also provides a transactional token editor and a Layout Playground with seven local examples.
- **Theme Builder** independently controls Light, Dark or System; eight palettes; comfortable or compact density; and default, minimal or enterprise visual kits. The top-bar theme selector stays synchronized. Valid selections are restored before the first render when browser storage is available, and committed token overrides remain active.
- **AI Agent Rules** exports `design-system.json`, `tokens.css`, `AGENTS.md`, `COMPONENT-API.md` and `INTEGRATION.md`. Its strict schema and checks tie the contract to the component registry and token axes. Uploaded contracts are bounded, validated as data and never executed. See the [agent rules](docs/AI-AGENT-RULES.md).
- **Accessibility Lab** checks contrast for two opaque sRGB colors and lists manual checks; **Documentation** provides local guidance on installation, components, themes and offline use. Neither establishes WCAG conformance.
- The optional [React adapters](packages/react/README.md) wrap all 21 current core families. Core has no React dependency. The [Vanilla example](examples/vanilla/README.md) and [React example](examples/react/README.md) run locally.
- A production build includes a manifest and service worker for a previously installed application shell and documentation to work offline. See [Offline support](#offline-support).

The Layout Playground's table and dialog are static HTML layout examples; the reusable Data Table is a separate core component. There is no verified WCAG conformance, production release or live deployment.

## Getting started

Use Node.js `^22.13.0 || >=24.0.0` and npm:

```sh
npm ci
npm run build:react
npm run dev
```

Open the URL printed by Vite. Routes use fragments, for example `/PWA-Design-System/#components`, and the build is configured for the repository subpath. Light, blue, comfortable and default are the appearance defaults; System follows the device only when explicitly selected. Local storage failures are reported in the Studio.

Build and preview the production assets locally:

```sh
npm run build
npm run check:artifact
npm run preview
```

The output is `dist/studio/`. The classic theme and token bootstrap scripts run before application rendering; Vite may warn that a classic script is not bundled as a module. The Pages deployment workflow is deliberately disabled pending release gates. The proposed [live URL](https://yapweijun1996.github.io/PWA-Design-System/) is **NOT VERIFIED** and must not be treated as an active deployment.

The intended minimum browsers are Chrome and Edge 114, Firefox 125, and Safari and iOS Safari 17. Tooltip and Menu require the native Popover API. Targeted Chrome and Playwright WebKit checks have run; minimum releases, Firefox, iOS devices and assistive-technology combinations remain **NOT VERIFIED**. Browser targets and automated tests do not establish compatibility or WCAG conformance.

## Tokens and appearance

The authoritative sources are in `packages/tokens/`. Edit those JSON sources rather than generated files; use `npm run tokens:build` to regenerate and `npm run tokens:check` to verify them. The [token editor guide](apps/studio/src/features/tokens/README.md) documents types, aliases, scope precedence and import/export details.

Studio stages semantic token edits and imports in a preview. Commit validates and saves overrides in browser storage; cancel restores the committed configuration. Invalid imports cannot overwrite the draft or committed settings. JSON input is bounded and treated as data; no imported JavaScript is executed. Selected contrast pairs are checked across the supported combinations, but that is not a complete accessibility audit. Exported CSS contains resolved overrides and should load after the base generated tokens. Layout breakpoints are build-time values generated from the token sources; they are read-only in the Studio. Viewport presets are separate example widths. Older saved breakpoint overrides are ignored with a notice while other valid overrides remain active.

## Core and React examples

From the repository root, `npm run build:core` builds the core ESM and declarations. Load generated token CSS before the relevant core styles; see the [core guide](packages/core/README.md) and [Vanilla example](examples/vanilla/README.md).

For React, run `npm run build:react` followed by `npm run dev:react-example`, then open the local URL. The [React guide](packages/react/README.md) documents package peers and integration. Each adapter mounts a block-level host; Card content, Tooltip triggers and FormField controls have limited composition. Server rendering produces an empty host until hydration, not accessible server-rendered component content. These adapters are private pre-release packages, not public registry releases.

## Offline support

The first visit requires a connection. After service-worker installation and a subsequent controlled navigation, the production build can serve its cached shell and existing Studio tools, including Documentation and Accessibility Lab, offline. The build records SHA-256 digests of final static assets; installation bypasses the HTTP cache and verifies the files before accepting the new version. Runtime requests and private API data are not added to the cache.

When an update is waiting, finish any pending import, commit or cancel a token draft, and close other Studio tabs before choosing **Prepare update**. Preparation does not reload the page. Unsaved drafts are held in memory: route changes are guarded and the browser is asked to confirm reload or closure, but a crash, forced termination or suppressed prompt can still lose a draft. Browser storage and caches may be evicted. The [PWA guide](apps/studio/src/features/pwa/README.md) explains update and cache cleanup limits.

Local Chromium tests cover offline reload and version updates. An actual OS installation, iOS standalone behavior, offline operation in other browsers and the deployed Pages site are **NOT VERIFIED**.

## Checks

After `npm ci`, build the local packages before tests that import their output:

```sh
npm run build:react
npm run typecheck
npm run typecheck:react
npm run lint
npm test
npm run tokens:check
npm run contracts:check
npm run ssot:check
npm run agent-validator:check
npm run agent-contract:check
npm run build
npm run check:artifact
npx playwright install chromium
npm run test:e2e
npm run test:react:e2e
npm run test:pwa
npm run test:production
```

`test:e2e` starts the development server; `test:react:e2e` exercises the React example. `test:pwa` builds two isolated versions and checks offline/update behavior. `test:production` requires a current Studio build and checks production preview behavior. Installing browsers may require network access and platform dependencies. [Visual fixtures](tests/visual/README.md) use six agent-reviewed Linux baselines and a strict CI comparison. The checks cover specific behaviors; they do not replace manual screen-reader, device, visual, security or release review.

See [Installation](docs/INSTALLATION.md), [Component API](docs/COMPONENT-API.md), [Theming](docs/THEMING.md), [PWA](docs/PWA.md), [Accessibility](docs/ACCESSIBILITY.md), [Testing](docs/TESTING.md), [Architecture](docs/ARCHITECTURE.md), [Contributing](CONTRIBUTING.md), [Changelog](CHANGELOG.md) and the [Phase 0 audit](docs/PHASE-0-AUDIT.md) for current behavior and open work. Original project code is available under the [MIT License](LICENSE); the generated agent validator includes Ajv-derived code, with its notice in [AJV-LICENSE.txt](packages/agent-contract/AJV-LICENSE.txt).
