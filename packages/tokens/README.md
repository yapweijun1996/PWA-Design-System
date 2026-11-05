# Design tokens

This private, pre-release package contains generated token artifacts for the design system. The authoritative sources are the JSON files in this repository; generate them with `npm run tokens:build` from the repository root and check them with `npm run tokens:check` before packing.

For local integration, first build the artifacts, then pack this directory with `npm pack ./packages/tokens` from the repository root. Install the resulting local tarball in your application with `npm install /path/to/pwa-design-system-tokens-0.1.0.tgz`. No public registry release is implied.

Import the CSS before component styles:

```ts
import '@pwa-design-system/tokens/tokens.css';
import '@pwa-design-system/core/forms.css';
```

The CSS provides semantic `--ds-*` variables. Set `data-theme` to `light` or `dark` on the root element; palette, density and visual kit use `data-palette`, `data-density` and `data-kit`. System theme preference is resolved by the consuming app. With no attributes, the defaults are light, blue, comfortable and default.

The package also exports `@pwa-design-system/tokens/tokens.json` for data consumers and `@pwa-design-system/tokens/tokens.ts` for TypeScript-aware bundlers. The latter is TypeScript source, not compiled JavaScript, and requires a toolchain that supports TS package sources. Node ESM JSON imports use `with { type: 'json' }` on supported Node versions. Consumers should not edit these generated artifacts.

The project is licensed under MIT; the repository root contains the license text. The package is private and is not yet a public npm release.
