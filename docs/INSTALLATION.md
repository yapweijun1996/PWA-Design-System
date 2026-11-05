# Installation and reuse

Core, tokens and React adapters are private and unpublished. Use Node.js `^22.13.0 || >=24.0.0`, clone the repository, and run:

```sh
npm ci
npm run build:react
npm run dev
```

For local tarball installation into a separate Vite project, export `INTEGRATION.md` from Studio's AI Agent Rules. That guide includes version-specific `npm pack` and install commands, working TypeScript and the required CSS imports. The [Vanilla example](../examples/vanilla/README.md) and [React guide](../packages/react/README.md) describe local use. Load `@pwa-design-system/tokens/tokens.css` before the relevant `@pwa-design-system/core` family CSS. Core factories return an element and a `destroy()` cleanup; remove the element when the view is disposed.

Studio builds for `/PWA-Design-System/` with `npm run build`; `npm run preview` serves the local production build. Other projects must configure their own deployment base.

For the development demo, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. Merge changes through a pull request. The complete main CI must pass before the separate Pages workflow downloads that run's validated `studio-build` artifact and publishes it. An obsolete CI run is rejected if its commit is no longer the main head. Failed CI and pull-request runs cannot deploy. The deploy job uses only the required read, Pages and OIDC permissions.

After deployment, verify the [hosted subpath](https://yapweijun1996.github.io/PWA-Design-System/), console, network requests, navigation and PWA behavior in a real browser. A successful deployment job alone is not browser evidence. Manual accessibility, real-device installation and other remaining release checks still apply to a production release.
