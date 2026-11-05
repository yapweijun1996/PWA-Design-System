# Architecture

This document describes the current foundation and planned boundaries. It is not a production-readiness or compatibility certification.

## Current structure

| Path | Responsibility |
| --- | --- |
| `packages/tokens/` | Authoritative JSON token sources and generated CSS, JSON and TypeScript. |
| `scripts/tokens.mjs` | Node-based token validation, alias resolution, artifact generation and freshness checking. |
| `apps/studio/` | Vite application, initial theme selection and responsive foundation page. |
| `tests/unit/` and `apps/studio/tests/` | Token/compiler and theme-preference unit tests. |
| `.github/workflows/` | Foundation CI and a prepared, deliberately disabled Pages deployment workflow. |

Tokens flow in one direction: JSON sources → compiler → generated artifacts → Studio CSS. Token definitions have typed values; semantic tokens can refer to primitive or semantic tokens. The compiler validates references, value types, cycles, forbidden keys and CSS-name collisions. It resolves the supported appearance combinations and checks whether generated files are current. Consumers should not edit generated output.

The token compiler currently runs in Node. It is not a browser-side import validator; a future editor must validate untrusted input before committing it. The Studio initializes a saved theme preference before its main application runs and updates the resolved theme for a system preference. Storage failure leaves the current session usable without claiming persistence.

## Planned package boundaries

The reusable core is intended to own framework-independent components and behavior. Optional React adapters should wrap the same public contracts; they must not be a dependency of the core. Studio navigation, browser storage, editing and future service-worker behavior belong to the application, not the reusable packages. A future agent-contract package should publish machine-readable, validated design and component rules. These packages and APIs do not yet exist.

The token data models light/dark theme, palette, density and kit separately. Generated CSS can express these axes on the document root. The current Studio offers a theme control only; interactive palette, density and kit controls are planned. Imported theme configurations, token exports and component APIs are also planned.

## Build and release boundary

Vite is configured with `/PWA-Design-System/` as its base and writes to `dist/studio/`. CI is configured to install from the lockfile, typecheck, lint, test, check generated tokens, build and inspect the artifact. A separate workflow is prepared to deploy a successful main-branch build using GitHub Pages actions, but its deploy job is deliberately disabled until required production gates exist. Neither a hosted CI result nor a live deployment is established by these files alone.

The Vite build targets Chrome 107, Edge 107, Firefox 104 and Safari 16, but the target configuration is not proof of runtime compatibility. Browser, keyboard, assistive-technology and device verification remains necessary. Automated tests and representative contrast checks do not prove WCAG conformance.

## Remaining work

Implement and document the component families, accessible interactions and integration examples; add Studio editing and preview tools; establish strict import and agent contracts; implement installation, offline support and safe updates; and add the requested security, accessibility, end-to-end and visual release gates. Validate those features in real browsers before enabling deployment or calling the project release-ready. See the [Phase 0 audit](PHASE-0-AUDIT.md) for research and risks.
