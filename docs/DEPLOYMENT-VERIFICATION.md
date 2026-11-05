# Pages verification record

For the later Components/Token usability amendment, see [5 November delivery evidence](STUDIO-DELIVERY-2026-11-05.md). The record below describes the earlier PR #2 deployment.

Observed on 2026-11-05 at [PWA Design System Studio](https://yapweijun1996.github.io/PWA-Design-System/). This is a development preview. Production release readiness and WCAG conformance remain unverified.

- Source commit: `3aea88305247ecfa65b2230b559365d43a65b22c`, merged through [PR #2](https://github.com/yapweijun1996/PWA-Design-System/pull/2).
- [Main CI 41973362328](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/41973362328): quality and visual-regression jobs succeeded.
- [Pages deployment 41973535265](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/41973535265): succeeded using that CI run's `studio-build` artifact.
- Hosted build version: `6a27f40478a3380a3ccd`.
- Independent artifact check: `studio-build` artifact `13390872303` matched the source repository, run and commit. Hosted root HTML, `index.html` and `sw.js` matched its bytes; all 27 precache responses returned 200 and matched the recorded SHA-256 digests.
- Browser: real Chrome 156 through Chrome DevTools MCP, isolated context; 1440×900 desktop, 768×1024 tablet and 390×844 mobile viewport emulation. These are simulated viewport sizes, not physical device tests.

| Observed scenario | Result |
| --- | --- |
| HTTPS page and repository subpath | Page rendered; page, bootstrap, CSS, JavaScript and fetched manifest returned 200. |
| Runtime console and network | No online console errors or warnings in the observed routes; 34 listed page requests were successful, all under the repository subpath. |
| Component navigation and Dialog | Component catalog and preview loaded. Tab stayed inside the open Dialog; Escape closed it and restored focus to its opener. |
| Theme persistence | Emerald palette, compact density and dark theme persisted across reload; the top-bar theme matched the builder. |
| Mobile navigation | Drawer opened, Shift+Tab wrapped to Settings, and Documentation navigation closed the drawer and focused the page. The top-bar theme had an accessible name. |
| Responsive layout | No document overflow in the observed desktop/mobile views; the tablet preview was approximately 497px wide. Desktop and mobile screenshots were inspected in the browser session. |
| Manifest and service worker | Manifest scope and start URL matched `/PWA-Design-System/`; the worker activated at that scope, a subsequent reload was controlled, and a versioned static cache existed. |
| Offline documentation | With DevTools network set to Offline, Documentation reloaded and rendered. An uncached query-string fetch failed, independently confirming network unavailability; `navigator.onLine` still reported true in this harness. |
| Offline token editing | Token Editor loaded offline, blocked a low-contrast draft, committed a valid light-scope `color.surface` override of `#fafafa`, and retained it after offline reload. After returning online and selecting Light, the computed surface matched the saved value. |

All test settings were confined to the isolated browser context. The intentional uncached offline probe produces an expected network failure. The online console check was recorded separately.

The first deployment has no preceding hosted version. Automated PWA tests cover version upgrades, old chunks, cache cleanup and mixed-version installation rejection. Actual OS installation, iOS standalone operation, Firefox, manual screen-reader workflows and independent human visual approval remain **NOT VERIFIED**. See [ACCESSIBILITY.md](ACCESSIBILITY.md) and the [role-based review](REVIEW-13-PERSONAS.md).
