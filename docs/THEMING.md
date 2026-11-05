# Tokens and theming

JSON sources in `packages/tokens/` are authoritative. Run `npm run tokens:build` after editing sources and `npm run tokens:check` to detect stale generated CSS, JSON and TypeScript. Components consume semantic CSS custom properties. Breakpoint tokens are reference values and do not rewrite CSS media queries.

Studio supports Light, Dark or explicit System preference, eight palettes, comfortable or compact density, and default, minimal or enterprise visual kits. System resolves to light or dark before paint; the default is light. The Theme Builder controls these axes independently and stores valid preferences locally when storage is available.

The Token Editor stages changes and imports until committed. Validated, committed overrides apply across the Studio and survive reload when browser storage is available. Invalid imports do not replace the active configuration; imports are bounded JSON and do not execute code. Load exported project token CSS after base token CSS. Precedence is theme-specific override, all-theme override, then the selected theme/palette/density/kit defaults. See the [token editor guide](../apps/studio/src/features/tokens/README.md) for formats and validation limits.
