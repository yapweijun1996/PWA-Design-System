# PWA Design System

PWA Design System is an early-stage, framework-independent design-system project. Its goal is to provide reusable UI foundations and an interactive Studio for developers and AI coding agents. The current repository contains a token compiler and a small Studio foundation; it is not yet a production component library or an installable PWA.

## What is available

- JSON token sources and a deterministic compiler that emits CSS custom properties, JSON and TypeScript.
- Light, dark and system theme selection in the Studio. Light is the default; system follows the browser preference. The selection is saved locally when browser storage is available.
- Generated token values for eight palettes, two densities and three visual kits, in addition to light and dark themes. The current Studio exposes only the theme selector; the other axes are not yet user-configurable there.
- A small responsive foundation page, token-role previews and local quality checks.

The intended component library, component playground, token editor, layout playground, AI agent exports, React adapters and offline installation/update features are **not implemented**. There is no verified WCAG conformance or production release.

## Getting started

Use Node.js `^22.13.0 || >=24.0.0` and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The application uses the `/PWA-Design-System/` base path, including during local development. Build and preview the production assets with:

```sh
npm run build
npm run preview
```

The build output is `dist/studio/`. Preview it through the printed Vite URL rather than opening `index.html` directly. The configured deployment target is the GitHub Pages repository subpath `/PWA-Design-System/`; deployment is disabled pending the required release gates and the live site has **not been verified**.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
```

The tests cover token generation, validation, representative contrast pairs and theme preference logic. These checks do not establish accessibility conformance, browser compatibility or complete visual quality. Automated accessibility, browser end-to-end, visual regression and offline-update gates remain to be added.

## Tokens

The authoritative sources are in `packages/tokens/`: `primitives.json`, `semantics.json`, and the theme, palette, density and kit files. Edit these sources, not the files under `packages/tokens/generated/`. Regenerate and verify after a source change:

```sh
npm run tokens:build
npm run tokens:check
```

The compiler validates token values and alias references, rejects cycles and CSS variable-name collisions, and emits a resolved matrix of 96 theme, palette, density and kit combinations. The generated CSS uses semantic custom properties; generated JSON and TypeScript provide resolved values. These files are foundation artifacts, not yet a published package with a stable public API.

See [Architecture](docs/ARCHITECTURE.md) and the [Phase 0 audit](docs/PHASE-0-AUDIT.md) for decisions, boundaries and remaining risks. Project source is available under the [MIT License](LICENSE); dependency notices and distribution obligations must be reviewed before release.
