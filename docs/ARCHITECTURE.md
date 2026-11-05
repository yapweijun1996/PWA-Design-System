# Architecture

This document describes the current implementation and its boundaries. It is not a production-readiness or compatibility certification.

## Current structure

| Path | Responsibility |
| --- | --- |
| `packages/tokens/` | Authoritative JSON sources, a shared pure resolution and validation engine, generated CSS/JSON/TypeScript and private package metadata. |
| `scripts/tokens.mjs` | Node file I/O for token generation and freshness checking. |
| `packages/core/` | Private, unpublished framework-independent DOM component package with ESM, declarations and stylesheet exports. |
| `packages/agent-contract/component-contracts.json` | Component inventory containing factory identities, option metadata, documented states and test references. |
| `scripts/check-component-contracts.mjs` | Checks inventory shape, required identities, source exports, package entries and test-call references. |
| `apps/studio/` | Vite application shell, hash routing, component playground, token editor and layout playground. |
| `examples/vanilla/` | Runnable local examples using the built core and generated tokens. |
| `tests/unit/`, `apps/studio/tests/`, `tests/e2e/` | Unit tests and Playwright browser tests, including selected scoped axe checks. |
| `.github/workflows/` | Quality checks and a prepared, deliberately disabled Pages deployment workflow. |

Tokens flow from repository JSON sources through the shared compiler to generated artifacts, then to core and Studio styles. Typed semantic tokens may reference primitive or semantic tokens. The engine validates references, value types, cycles, forbidden keys and CSS-name collisions, and resolves 96 combinations. Generated artifacts are not edited manually.

## Component and Studio boundaries

Core currently provides 20 component families: six foundation, seven form, four navigation and three feedback families. Core owns DOM behavior and semantic-token styling without a React runtime. Factories return an element and `destroy()`; callers own mounting and removal. Some handles expose additional methods or elements. Family guides and the [Vanilla example](../examples/vanilla/README.md) describe current APIs and limits. Several families expose only one size or style; Tabs accept plain-text panel content, and Dialog has no built-in custom action API.

The component inventory is configuration, not executable code. Its gate validates bounded shape, fixed family identities and paths, source declarations, package re-exports and factory-call references in unit and browser test files. It cannot determine whether tests pass, whether assertions cover every state, or whether documented behavior and accessibility are correct. Full machine-readable design rules and agent-rule exports are not yet implemented.

The Studio owns routing, editing, preview and browser storage rather than adding those concerns to core. The shell provides ten fragment-linked sections, a desktop sidebar, tablet layout, mobile modal drawer and light/dark/system selection. It mounts the component, token and layout views on demand and invokes their cleanup on navigation; the separate Theme Builder, Accessibility Lab, AI Agent Rules and Documentation views remain pending. The component playground uses the core factories and component inventory, with supported controls, API/keyboard notes and generated code based on the preview configuration. It does not expose every property or certify every component state.

The Layout Playground renders seven local examples in a sandboxed `srcdoc` iframe without script permission or external assets. Presets set actual 390, 768 and 1440 pixel iframe widths; the adjustable control accepts widths from 320 to 1600 pixels. A containing region scrolls horizontally when necessary. The Data Table is a native HTML layout example, not the planned enterprise Data Table component; the dialog example is static. Preview token values follow the Studio's current appearance.

## Token overrides and prepaint

The browser token editor uses the same pure engine as the Node compiler. Primitive source values are read-only in Studio. Semantic changes, imports and resets are staged in a draft; committing validates and saves versioned project overrides to local storage before changing the applied configuration. A failed storage write leaves the prior committed configuration in place. Scope precedence is theme-specific override → all-theme override → selected theme/palette/density/kit. The editor does not modify repository JSON or generated artifacts.

Imports are limited to 64 KiB and pass a bounded JSON scan and schema, key, type, alias, range and cycle validation before the draft is replaced. Duplicate and forbidden keys are rejected. Selected text, control-border and focus contrast pairs are checked across the 96 appearance combinations; this is not proof of WCAG conformance or of every component state. An edit or other draft action while an import is pending cancels that read's result. Exported JSON contains project overrides; exported CSS contains validated resolved semantic values and should be loaded after the base token stylesheet. Imported configuration is not executed as JavaScript or treated as arbitrary CSS.

The classic theme initializer runs before the stylesheet. A second, parser-blocking `token-prepaint.js` bundle uses the same parser, resolver and contrast checks to produce a temporary style for valid saved overrides. Vite serves this bundle in development and emits it during production builds; the application initializer revalidates the data, applies the committed values and removes the temporary style. Bootstrap references and ordering are checked in the built artifact, and a production-preview browser check exercises first-frame behavior. Dynamic custom properties and the temporary style are inline styles, so a deployment Content Security Policy must be designed and tested for customization; a static precomputed style hash cannot cover arbitrary user choices. A Vite build warning about the classic prepaint script does not by itself prove that the emitted asset works; the artifact and browser checks provide the relevant evidence.

## Build and release boundary

`npm run build:core` emits the private core's ESM and declarations. `npm run build` builds Studio under `/PWA-Design-System/` into `dist/studio/`. `npm run check:artifact` validates built resource paths and prepaint ordering. `npm run test:production` starts a local preview and checks first-frame token handling and subpath assets; it requires the built Studio and a Playwright Chromium installation. CI is configured to install the lockfile, typecheck, lint, run unit tests, check tokens and component contracts, build core and Studio, validate the artifact and run Chromium browser checks. The separate Pages deployment job is deliberately disabled until required production gates exist. Configuration alone does not establish a hosted CI result or live deployment.

The intended minimum browsers are Chrome and Edge 114, Firefox 125, and Safari and iOS Safari 17. Tooltip and Menu require the native Popover API and fail explicitly when it is unavailable. These build targets are not proof that the actual minimum releases or devices have been tested. Browser, keyboard, assistive-technology and device verification remains necessary. Automated tests and representative contrast checks do not prove WCAG conformance.

## Remaining work

Complete the pending Studio sections and broader theme customization, full machine-readable design and agent export contracts, optional React integration and safe PWA installation/offline/update behavior. Complete the planned enterprise components and address remaining component API, responsive and accessibility gaps. Add reviewed visual regression baselines, broader browser/device evidence, manual assistive-technology checks, security review and the full SSOT and release gates before enabling deployment. See the [Phase 0 audit](PHASE-0-AUDIT.md) for initial research and risks.
