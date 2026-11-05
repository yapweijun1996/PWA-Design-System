# Installation and reuse

Core, tokens and React adapters are private and unpublished. Use Node.js `^22.13.0 || >=24.0.0`, clone the repository, and run:

```sh
npm ci
npm run build:react
npm run dev
```

For local tarball installation into a separate Vite project, export `INTEGRATION.md` from Studio's AI Agent Rules. That guide includes version-specific `npm pack` and install commands, working TypeScript and the required CSS imports. The [Vanilla example](../examples/vanilla/README.md) and [React guide](../packages/react/README.md) describe local use. Load `@pwa-design-system/tokens/tokens.css` before the relevant `@pwa-design-system/core` family CSS. Core factories return an element and a `destroy()` cleanup; remove the element when the view is disposed.

Studio builds for `/PWA-Design-System/` with `npm run build`; `npm run preview` serves the local production build. Other projects must configure their own deployment base. GitHub Pages deployment remains **NOT VERIFIED**; the deployment workflow is disabled until release gates are met.

After the project meets its release gates, a repository administrator can select **Settings → Pages → Build and deployment → Source → GitHub Actions** and review the prepared workflow before enabling deployment. This documentation does not enable Pages or claim a successful deployment. Verify the hosted subpath, console, network requests, navigation and PWA behavior after any authorized deployment.
