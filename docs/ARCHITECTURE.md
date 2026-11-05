# Architecture

This document describes the current implementation and planned boundaries. It is not a production-readiness or compatibility certification.

## Current structure

| Path | Responsibility |
| --- | --- |
| `packages/tokens/` | Authoritative JSON sources, generated CSS/JSON/TypeScript and private token package metadata. |
| `scripts/tokens.mjs` | Node-based token validation, alias resolution, generation and freshness checking. |
| `packages/core/` | Private, unpublished framework-independent DOM component package with ESM and stylesheet exports. |
| `packages/agent-contract/component-contracts.json` | Current component inventory: factory identities, option types, documented states and test references. |
| `scripts/check-component-contracts.mjs` | Checks inventory shape, required identities, source exports, package entries and test-call references. |
| `apps/studio/` | Vite application, initial theme selection and a foundation page; it is not the completed Studio. |
| `examples/vanilla/` | Runnable local examples using the built core and generated tokens. |
| `tests/unit/`, `apps/studio/tests/`, `tests/e2e/` | Unit tests and Playwright browser tests, including selected scoped axe checks. |
| `.github/workflows/` | Quality checks and a prepared, deliberately disabled Pages deployment workflow. |

Tokens flow in one direction: JSON sources → compiler → generated artifacts → core/Studio styles. Typed semantic tokens can refer to primitive or semantic tokens. The compiler validates references, value types, cycles, forbidden keys and CSS-name collisions, then resolves 96 appearance combinations. Generated artifacts are not edited manually. The compiler runs in Node and is not a validator for future browser imports.

## Component and application boundaries

The core currently provides 20 component families: six foundation, seven form, four navigation and three feedback families. Core owns DOM behavior and semantic-token styling without a React runtime. Factories return an element and `destroy()`; callers own mounting and removal. Some handles expose additional methods or elements. Family guides and the [Vanilla example](../examples/vanilla/README.md) document actual APIs, defaults and limitations. Some families currently expose only one size/style; Tabs accept plain-text panel content, and Dialog has no built-in custom action API.

The component inventory is configuration, not executable code. Its gate validates bounded shape, fixed family identities and paths, source declarations, package re-exports and the presence of factory calls in unit and browser test files. It cannot determine whether those tests pass, whether their assertions cover each state, or whether documented behavior and accessibility are correct.

Studio routing, browser storage, future editing and service-worker behavior belong to the application rather than reusable packages. The current Studio resolves a saved light, dark or system theme before its main application runs; storage failure does not promise persistence. Token output models palette, density and kit independently, but the Studio does not yet offer controls for them. React adapters, browser-side theme import/export, agent rule exports and PWA installation/offline updates remain planned.

## Build and release boundary

`npm run build:core` emits the private core's ESM and declarations; `npm run build` builds the Studio under the configured `/PWA-Design-System/` base into `dist/studio/`. CI is configured to install the lockfile, typecheck, lint, run unit tests, check token and component contracts, build core and Studio, run Chromium Playwright tests and inspect the deployment artifact. The separate Pages deployment job is deliberately disabled until required production gates exist. Configuration alone does not establish a hosted CI result or live deployment.

The intended minimum browsers are Chrome and Edge 114, Firefox 125, and Safari and iOS Safari 17. Tooltip requires the native Popover API and fails explicitly where it is unavailable. The Vite target reflects these minimums, but a build target is not proof of runtime compatibility. Browser, keyboard, assistive-technology and device verification remains necessary. Automated tests and representative contrast checks do not prove WCAG conformance.

## Remaining work

Complete the Studio's component playground, token editing, layout playground and theme customization; finish machine-readable design and agent export contracts; add optional React integration and safe PWA offline/update behavior; and close remaining component API, responsive and accessibility gaps. Add reviewed visual regression baselines, broader browser and device evidence, manual assistive-technology checks, security review and the full SSOT and release gates before enabling deployment. See the [Phase 0 audit](PHASE-0-AUDIT.md) for initial research and risks.
