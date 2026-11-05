# Design token rules

JSON sources under `packages/tokens/` are authoritative. `npm run tokens:build` generates CSS, JSON and TypeScript; do not hand-edit generated artifacts. Components should consume semantic custom properties. Theme, palette, density and kit are independent axes, with Light as the initial theme unless a user selects another preference. Preserve existing input, focus and text contrast and test changes across supported combinations.

Token editing stores validated browser-local overrides separately from the source. The Studio's CSS export is generated from the committed, validated override project and all appearance combinations; load it after base token CSS. Invalid or contrast-failing projects must not be exported. The supported browser/client and color checks are bounded; they are not full accessibility certification.

Run `npm run tokens:check`, relevant unit tests and real browser checks after changes. Do not use token files or imported JSON as executable expressions.
