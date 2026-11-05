# Phase 0: repository and architecture audit

Date: 2026-11-05. This document records the starting state; it is not a release report.

## Evidence and reuse

- The public repository's default branch was `main` at `aabccdc` (initial commit). Its only tracked file was `.gitattributes`; there were no application files, workflows, dependencies, or license. Work starts on `feat/design-system-foundation`.
- The local `PWA-DS-Admin-Panel` checkout was inspected read-only at `5ff92d9`. It demonstrates token source/generation, multiple appearance axes, a component registry, an admin shell, and PWA patterns. It has no LICENSE and its documentation says the license is undecided. It is an architectural reference only: no code or assets are copied. Its components couple playground behavior to application state and are not drop-in library primitives. Its historical tests are not evidence for this project.
- KB-MCP's active `ui:ssot-component-library` v1.0.0, `ui:design-tokens-theming` v0.2.0-verified-chrome, `ui:admin-panel-design-standard` v2.0.5 and `pwa:product-standard` v1.0.0 were reviewed. Their prior-project observations must be verified against this implementation. Adopt semantic tokens, independent appearance axes, accessible controls, responsive navigation, safe offline updates, and real browser verification. Do not treat a prior project's implementation-specific prohibition on native controls as a universal rule.
- The user-supplied global routing references `instruction-modules/investigation.md`, `architecture.md`, and `verification.md`, but these files were not found in the workspace. Apply the supplied core rules and document this gap.

## External research

- [Material Design foundations](https://m3.material.io/foundations/) emphasize shared foundations, interaction states, and accessible design.
- [Ant Design theme customization](https://ant.design/docs/react/customize-theme/?locale=en-US) illustrates seed, derivative, and semantic token layers. [Tailwind theme variables](https://tailwindcss.com/docs/theme) illustrate ordinary CSS custom properties as output. Neither framework is required by consumers.
- [shadcn/ui](https://ui.shadcn.com/docs/changelog/2025-10-new-components) illustrates transparent, project-owned component examples; the core here remains framework independent.
- The upstream repositories identify Vite and Vitest as MIT, TypeScript and Playwright as Apache-2.0, React as MIT, and axe-core as MPL-2.0. Actual locked versions, transitive licenses, and distribution obligations still need review. No third-party source is copied. Material Web is in maintenance mode and is not selected as a dependency.
- The [Vite build guide](https://vite.dev/guide/build#browser-compatibility) describes its current default browser targets; the project must pin its own versions, document its supported browsers, and test the actual runtime features. Bundling alone does not prove device compatibility.

## Architecture decisions

1. Author tokens as JSON and compile deterministically into CSS custom properties and machine-readable outputs. Validate aliases and generated-output freshness. Keep theme, palette, density and visual kit independently selectable; default to light, with system preference opt-in.
2. Keep accessible DOM primitives, styles, and behaviors in a framework-independent core. React adapters are optional wrappers over the same public contracts. Do not introduce a framework runtime into consumers of the core.
3. Keep Studio routing, local editing, persistence and service-worker lifecycle outside reusable packages. Preview and code output must share configuration; validate imports before committing state and never execute imported code.
4. Use a task-first responsive application shell. Navigation and dialog interactions must be keyboard accessible, with visible focus and restoration. Use native semantics where suitable and document any custom behavior.
5. Scope service-worker caching to versioned public assets; keep user drafts in local storage outside caches and make updates explicit. Validate offline reload and updates under the Pages subpath in a real browser.
6. Publish a machine-readable component and token contract, and validate its consistency against actual implementations. A CI gate only claims the specific checks it executes.

## Material risks and remaining evidence

- The requested scope is a complete product, not an initial gallery: behavior, tests, accessibility, security, packaging and documentation must mature together. Milestones cannot be declared complete from scaffolding alone.
- Contrast must be measured across 96 explicit theme/palette/kit/density combinations. Automated accessibility checks supplement, rather than replace, manual screen-reader and keyboard testing.
- GitHub Pages deployment requires repository configuration, successful CI, permissions, and verification of the live URL. None is established by this audit.
- PWA behavior, update safety, mobile and assistive-technology support, visual quality, dependency audit, component API completeness and release readiness are **NOT VERIFIED** at baseline.
- MIT is selected for original project code in `LICENSE`. Retain any required dependency notices before publication and confirm the exact resolved package licenses rather than assuming compatibility from upstream project names.

## Milestone acceptance

1. Foundation: reproducible install, deterministic validated tokens, theme selection, coherent workspace, and functioning local/CI checks.
2. Components: at least the first 20 documented families, consistent contracts, meaningful unit, keyboard and accessibility coverage.
3. Studio: working navigation, component playground, validated token editor and responsive layout playground.
4. Advanced: configurable themes, agent exports, optional React adapters and verified offline/update behavior.
5. Hardening: independent evidence-backed reviews, browser and visual tests, security and accessibility evidence, complete documentation, and verified deployment.
