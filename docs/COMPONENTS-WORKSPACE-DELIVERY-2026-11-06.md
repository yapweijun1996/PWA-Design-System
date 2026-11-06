# Components workspace delivery — 6 November 2026

| Record | Value |
| --- | --- |
| Repository | [PWA-Design-System](https://github.com/yapweijun1996/PWA-Design-System) |
| Live Studio | [Components](https://yapweijun1996.github.io/PWA-Design-System/#components) |
| Feature PR | [#7](https://github.com/yapweijun1996/PWA-Design-System/pull/7) |
| Feature merge | `6edf8008e0e666c39355913862302d0eee039688` |
| Final feature head | `d5422c25592408396a0a0d1fa3f894790baadaed` |
| PR CI | [42165197590](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42165197590) |

The existing Vite/TypeScript Studio continues to consume framework-independent DOM factories, JSON-authoritative semantic tokens and the component contract registry. This amendment is a Studio UI change; it adds no dependencies or core API changes. Desktop shows Explorer, Preview and Properties; tablet retains Preview/Properties with collapsible Explorer; phones switch panels. Search/category counts derive from the 21-family registry. Configuration, supported quick options, rendered preview and generated snippet share the existing validation path. The route heading receives keyboard navigation/skip focus; compact update details preserve existing safeguards.

PR CI passed 151 unit/integration tests, 118 Studio E2E, 6 React E2E, 4 PWA tests and 17 strict visual comparisons. Typecheck, lint, generated-token/contract checks, SSOT, artifact validation, production subpath/first-frame behavior and CSP inline/eval rejection passed. Independent WebKit 10/10 and two additional Chrome/WebKit journeys passed; actual Firefox Nightly geometry is recorded with its real 500px narrow viewport. Actual installed Chrome was 157.0.8103.38; WebKit 27.2 and Firefox 160.0a1 are distinct from stable Safari/Firefox certification.

The initial full local Chrome run had 113 passes, one obsolete breakpoint assertion and four 30-second timeouts under concurrent unrelated rendering load. The assertion was updated to enforce all 699/700/1000/1001px boundaries. All five affected scenarios passed a focused single-worker rerun with unchanged timeouts/assertion strength; the subsequent complete PR CI passed 118/118 without retries. No unrelated process was stopped.

Independent QA identified and retested C-01 resize focus loss and C-02 dark selected-text contrast. Dark active text changed from 2.18:1 to 8.11:1 through semantic link tokens; selected borders also use link, and keyboard rings retain focus tokens. The 96-appearance-combination unit check validates selected text contrast and keyboard ring contrast. Existing negative import/security tests remain.

`npm audit --json` on 6 November 2026 reported 0 known vulnerabilities across all severities. No dependency/lockfile changes were introduced. This is an advisory snapshot, not proof of absence of vulnerabilities. Production policy checks blocked inline scripts and eval; browser-local synthetic data was used for validation.

Canvas 390/768/1440 choices set real CSS canvas width; they do not emulate browser media queries or portaled-overlay viewport behavior. Packages remain private and unpublished. Manual screen-reader interpretation, real Safari, actual browser zoom, independent human visual approval, physical-device/iOS installation and field Core Web Vitals remain NOT VERIFIED. These are release-readiness limits; deploying this development Studio does not certify WCAG conformance or production readiness.

## Deployment and browser evidence

The complete [main CI](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42165434139) and [Pages deployment](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42166381156) succeeded for merge `6edf8008e0e666c39355913862302d0eee039688`. The main visual job spent several minutes installing browser dependencies, then passed all 17 comparisons. It was not cancelled, retried or bypassed.

Hosted build `652cf8a00c538fb7b036` was checked against the actual `studio-build` artifact from that main CI run: root HTML, explicit `index.html`, `sw.js` and all 29 precache entries matched artifact bytes. Every precache SHA-256 also matched. These are 32 served-body comparisons: the three explicit URLs plus 29 manifest entries, which also include `index.html`.

Five fresh installed-Chrome contexts exercised actual hosted widths 1920, 1440, 768, 390 and 320px. Registry counts, combined category/search/empty states, label and variant configuration-to-code parity, actual 390/768/1440px canvas widths, keyboard information tabs, phone panel/focus retention and desktop Dialog/Menu Escape restoration passed. Scoped axe found zero violations in these bounded states. No page/console errors, failed requests, HTTP errors or external requests were recorded. Actual screenshots were inspected for desktop, dark tablet and active phone Inspector.

A separate isolated context retained build `2770362a08cd6927577f` and an unsaved synthetic token draft before deployment. Against the actual new waiting worker, the draft blocked preparation without loss; committing it then opening a second Studio tab blocked preparation; closing the second tab allowed preparation while the old document stayed loaded. Manual reload selected build `652cf8a00c538fb7b036` and preserved `color.surface = #fafafa`. Offline reload worked, a new `#f8fafc` override committed and survived another offline reload, and the new Components lazy route and synchronized size/code controls worked offline. Both old/new caches were observed at the immediate checkpoint; no claim of immediate hosted old-cache removal is made. Cache cleanup and mixed-version refusal are separately covered by the four PWA tests. The fresh compact notice's actual waiting-worker behavior is covered by those production PWA tests; the retained old document displayed its old notice as expected.

Evidence retained outside the repository under `/tmp/pwa-workspace-v2/`: `hosted-artifact.json`, `hosted-ui.json`, `hosted-upgrade-before.json`, `hosted-upgrade-after.json`, `hosted-*.png`, `main-ci.log`, `final-pr-ci.log` and `npm-audit.json`. These local paths are temporary evidence, not published downloadable artifacts. All task browser contexts were closed after the upgrade check.

Related records: [workspace guide](COMPONENTS-WORKSPACE.md), [independent QA and visual review](COMPONENTS-WORKSPACE-VERIFICATION.md), and [manual release acceptance](RELEASE-ACCEPTANCE.md). The [isolated hosted Lighthouse sample](COMPONENTS-WORKSPACE-PERFORMANCE-2026-11-06.md) scored Performance 97 and automated Accessibility 100, with FCP/LCP 1274.37ms, TBT 2ms, CLS 0 and Speed Index 4697.25ms. Run warnings and audit execution errors were zero. It used Chrome 157 and is not a strict comparison with the earlier Chrome 156 sample; field measurements remain NOT VERIFIED.
