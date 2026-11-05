# Vanilla core examples

This page instantiates all 20 current core component families using built ESM, generated token CSS and the source package stylesheets. It is a development example within this repository, not a published package or PWA.

From the repository root, use the Node version specified in the root `package.json`, then run:

```sh
npm ci
npm run build:core
npx vite --host 127.0.0.1 --port 4207 --strictPort
```

Open `http://127.0.0.1:4207/examples/vanilla/`. The server command runs Vite from the repository root, not the Studio's subpath-configured Vite setup. If port 4207 is in use, select another port and adjust the URL. The generated token artifacts are checked in; after editing their JSON sources run `npm run tokens:build` first. Rebuild core when its TypeScript changes.

Each section demonstrates a named factory and its required options. Use the keyboard to operate the controls, menu, tabs and modal. The dialog example passes its triggering button to `open(opener)` so focus can return to it even if a pointer click does not focus buttons in the browser. Reset calls each component's `destroy()` before removing the example DOM; consumers own removal. See the [core guide](../../packages/core/README.md), [forms](../../packages/core/src/forms/README.md), [navigation](../../packages/core/src/navigation/README.md) and [feedback](../../packages/core/src/feedback/README.md) for the API and limits. Tooltip requires native Popover support. Several components have a single size or style, and dynamic tab content and configurable dialog actions are not built-in APIs. This page is not an accessibility certification or a complete interactive Studio.
