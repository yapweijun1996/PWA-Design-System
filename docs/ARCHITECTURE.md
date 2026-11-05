# Architecture

This document describes the implemented boundaries and known limitations. It is not a production-readiness, accessibility or compatibility certification.

## Structure and ownership

| Path | Responsibility |
| --- | --- |
| `packages/tokens/` | Authoritative JSON sources, shared validation/resolution engine, and generated CSS/JSON/TypeScript. |
| `scripts/tokens.mjs` | Token generation and freshness checking. |
| `packages/core/` | Framework-independent DOM components, ESM declarations and semantic-token styles. |
| `packages/react/` | Optional React adapters that delegate to core. |
| `packages/agent-contract/` | Component registry, strict design contract/schema, rules and generated standalone validator. |
| `scripts/check-component-contracts.mjs`, `scripts/build-agent-*.mjs` | Registry consistency and agent artifact generation/freshness checks. |
| `apps/studio/` | Vite shell, fragment routing, interactive tools, browser persistence and production PWA. |
| `examples/vanilla/`, `examples/react/` | Runnable local integration examples. |
| `tests/`, `apps/studio/tests/` | Unit, browser, integration and PWA checks for implemented behaviors. |
| `.github/workflows/` | Quality workflow and a prepared Pages workflow that is deliberately disabled. |

Core, tokens and React are private, unpublished packages. Core owns component behavior without depending on React, Studio routing, storage or PWA infrastructure. Consumers mount and remove factory elements and call `destroy()` to release component resources. The [core guide](../packages/core/README.md) and family guides describe the 21 implemented families, options and limitations.

The [React adapters](../packages/react/README.md) use core with React as a peer dependency and mount a block-level host for every family. Controlled and uncontrolled behavior and callback types follow the adapter documentation. Card, Tooltip and FormField do not offer arbitrary React-child composition. Import and server rendering avoid DOM access, but server output is an empty host until hydration; it does not provide server-rendered component content or an accessible no-JavaScript fallback. The [React example](../examples/react/README.md) is local and unpublished.

## Tokens, appearance and Studio

Repository JSON flows through the shared engine and deterministic compiler into generated artifacts. The engine validates types, aliases, references, cycles, forbidden keys and CSS-name collisions. It resolves 96 combinations: two resolved themes, eight palettes, two densities and three visual kits. System is a preference resolved to Light or Dark, not a third token theme. Components consume semantic CSS custom properties.

The Studio owns the application shell, navigation, token overrides and previews. Its component playground builds real core components and source examples from the same supported configuration; it does not expose every property or certify component states. The Layout Playground renders seven local examples in a sandboxed `srcdoc` iframe without script permission or external assets. Presets use 390, 768 and 1440 pixel widths, with an adjustable 320–1600 pixel width. Its table and dialog are static examples; the reusable Data Table is a separate core component.

Theme Builder updates the four independent appearance axes and synchronizes the existing top-bar theme selector. Light, blue, comfortable and default are the defaults; System follows the device only when selected. The classic `theme-init.js` validates stored selections and sets the appearance attributes before styles and token bootstrap. Its startup allowlist is checked against the token engine's axes. The application reapplies committed overrides when attributes change.

The token editor uses the same engine as the compiler. Semantic edits, imports and resets are staged; commit validates and saves to local storage before replacing the applied configuration. A failed write preserves the prior committed overrides. Theme-specific overrides take precedence over all-theme overrides, followed by the selected appearance combination. Imports are bounded to 64 KiB, checked for duplicate/forbidden keys, shape, names, values, aliases, bounds and cycles, and never executed. Selected text, focus and border contrast pairs are checked across combinations; this is not proof of WCAG conformance.

The Accessibility Lab computes relative luminance and contrast for two user-entered opaque sRGB colors. It exposes thresholds and manual-test reminders, not an automatic WCAG assessment. The Documentation page is built from trusted static text with DOM APIs. Both are lazy-loaded Studio features included in the production precache. Their [accessibility record](ACCESSIBILITY.md) marks manual screen-reader and device checks as **NOT VERIFIED**.

A second parser-blocking `token-prepaint.js` bundle validates saved overrides and emits a temporary style before the application starts. The application revalidates the data and removes that temporary style. A meta Content Security Policy limits scripts and network requests to the same origin, blocks objects and restricts base and form URLs. Dynamic token overrides and layout previews require inline styles, so the style policy permits them; it is not a complete defense against all injection. Meta policies cannot provide every response-header protection. The production preview test checks the first paint and blocks inline script and eval. See the [token editor guide](../apps/studio/src/features/tokens/README.md) for customization details.

## Agent contract

`component-contracts.json` records the component inventory, documented properties, states and test references. Its checker validates bounded shape, required identities, source declarations, package exports and test-call references. Those checks do not prove behavioral correctness, test coverage or accessibility.

`design-system.json` is generated from the registry, validation rules, package metadata and token axes, and checked against `design-system.schema.json`. The standalone Ajv-generated validator is built ahead of time and does not compile schemas at runtime. Imported JSON is size-bounded, scanned for duplicate and prototype-polluting keys, validated and compared with the current contract; it is not executed or applied as instructions. `npm run agent-validator:check` and `npm run agent-contract:check` verify generated artifact freshness. The [agent rules](AI-AGENT-RULES.md) explain usage and limitations.

The Studio exports the contract, resolved token CSS, agent instructions, component API reference and a local integration guide. Exports validate the current contract and committed token configuration, but cannot establish that an external application is configured correctly or conforms to accessibility requirements. A small approved text-glyph registry covers close, menu and settings; it is not a complete vector icon library. The existing string API and external applications are not statically constrained by that registry.

## PWA and update boundary

The production build emits a manifest, icons and service worker under `/PWA-Design-System/`. A deterministic build version and SHA-256 digests of final static files form the precache manifest. Installation bypasses the HTTP cache and verifies responses before caching; a missing, stale or modified asset rejects the installation and leaves the previous worker usable. The worker reads same-origin, query-free GETs from the versioned static caches and does not cache runtime requests or private API data. Version-aware cleanup retains caches needed by reporting clients and defers when client state is uncertain.

A waiting update is prepared only after the current token draft or import is finished and other Studio tabs are closed. Preparation does not reload the page. In-memory drafts guard route changes and request a browser confirmation on reload or closure; crashes, forced termination or suppressed prompts can still lose them. Client enumeration has limitations for frozen or unenumerated historical tabs. Storage and caches may be evicted by the browser. The [PWA guide](../apps/studio/src/features/pwa/README.md) describes lifecycle and limitations.

Local Chromium tests cover offline reload, previously unvisited Documentation and Accessibility Lab chunks, update, old lazy chunks, cache cleanup and mixed-version installation failures. The [hosted verification record](DEPLOYMENT-VERIFICATION.md) covers a bounded Chrome Pages check. OS installation, iOS standalone operation and other browsers' offline behavior remain **NOT VERIFIED**.

## Build and release boundary

Run `npm ci` and `npm run build:react` before checks that import built packages. `npm run build` emits Studio to `dist/studio/`; `npm run check:artifact` checks built paths and bootstrap order. `npm run test:production` requires the built Studio and a Playwright Chromium installation. `npm run test:pwa` builds two isolated versions; `npm run test:react:e2e` tests the React example. The [README](../README.md#checks) lists the current local checks.

The CI workflow runs lockfile installation, builds, typechecks, lint, unit and browser tests, generated-artifact checks and production validation. The separate Pages workflow deploys the artifact from the exact successful main push run, checking main before download and before publishing. The [deployment record](DEPLOYMENT-VERIFICATION.md) links observed CI, deployment and browser evidence. Publishing the development demo does not establish production release readiness.

Intended minimum versions are Chrome and Edge 114, Firefox 125, and Safari and iOS Safari 17; Tooltip and Menu require native Popover support. Targeted Chrome and Playwright WebKit runs do not verify all minimum versions, Firefox, iOS or assistive technologies. Manual screen-reader evidence, reviewed visual baselines, broader device and security review, remaining enterprise components and release gates are still required. See the [Phase 0 audit](PHASE-0-AUDIT.md) for initial research and risks.
