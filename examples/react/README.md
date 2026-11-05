# React example

From the repository root, run `npm ci`, `npm run build:react`, then `npm run dev:react-example`. Open the local URL printed by Vite. The example uses the packaged adapter's exports, the core component styles and the generated token stylesheet. It demonstrates controlled text, checkbox and tab state plus a controlled dialog.

For the isolated browser regression run `npx playwright test -c examples/react/playwright.config.ts` after building. The example is a local development artifact, not a deployed site.
