# Testing

Use Node.js `^22.13.0 || >=24.0.0` and a reproducible `npm ci`. Build the private packages before tests that consume their compiled output:

```sh
npm ci
npm run build:react
npm run typecheck
npm run typecheck:react
npm run lint
npm test
npm run tokens:check
npm run contracts:check
npm run ssot:check
npm run agent-validator:check
npm run agent-contract:check
npm run build
npm run check:artifact
npx playwright install chromium
npm run test:e2e
npm run test:react:e2e
npm run test:pwa
npm run test:production
```

Vitest exercises token validation, state and contracts; Playwright covers selected Studio and component browser flows. The separate PWA suite builds isolated releases, verifies offline reload, update safeguards, and rejects stale build assets. `check:artifact` verifies bootstrap order and precache digests. Browser installation may require system packages and network access. On supported macOS setups, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point at an installed Chrome for local browser checks.

Current tests are targeted evidence, not proof of complete browser support, visual quality or WCAG conformance. The [visual workflow](../tests/visual/README.md) uses sixteen agent-reviewed baselines and a strict Linux comparison. Independent human visual review, manual assistive-technology evidence and final cross-device release verification remain **NOT VERIFIED**. See [ACCESSIBILITY.md](ACCESSIBILITY.md) and the [Token Editor amendment evidence](TOKEN-EDITOR-AMENDMENT.md).
