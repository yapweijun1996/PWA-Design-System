# Unified Studio and PWA amendment delivery

Recorded 6 November 2026 after product release B. Authorized engineering work is delivered; the development Studio is not certified production-release-ready under the complete original definition of done. Physical/manual acceptance remains open in [task.md](../task.md).

## 1. Repository

[PWA-Design-System](https://github.com/yapweijun1996/PWA-Design-System). Baseline `4b1b74566c5f05b2564c7cfa4e7a65ddd6994fe0`. Normal feature branches, PRs, strict CI and official Pages deployment were retained; no force-push, owner browser security expansion or unrelated repository modification was used.

## 2. Live Studio and provenance

[Live Studio](https://yapweijun1996.github.io/PWA-Design-System/), [Components](https://yapweijun1996.github.io/PWA-Design-System/#components), [Design Tokens](https://yapweijun1996.github.io/PWA-Design-System/#design-tokens).

| Release | Source | Main CI | Pages | Hosted build |
| --- | --- | --- | --- | --- |
| A: unified workspace/PWA | `a04651567456c6d11415c1083dfabdf8fa633c2e` | [42178963197](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42178963197) PASS | [42179274244](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42179274244) PASS | `bc33df665683dc92506b` |
| B: bundled usage help | `3163663ce123b4c91abe79879f60972a107dc803` | [42180325282](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42180325282) PASS | [42180666846](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42180666846) PASS | `1170b641fcdfe7977a19` |

For each release, all 30 served files matched the downloaded CI artifact byte-for-byte, all 29 service-worker precache SHA-256 digests matched, and canonical index/worker responses also matched. Deployment is established by these hosted checks, not merely a build result. This evidence document is a later documentation-only change; its own merge provenance is available in repository history.

## 3. Architecture

The private Studio Workspace host owns panel layout, bounded resizing, optional width preferences, responsive transitions and cleanup. Components and Tokens reuse it. Core remains framework-independent DOM factories; React stays optional. JSON token sources/resolution, transactional token model, component adapters, package exports and dependency lockfile were preserved. One bounded Menu native-dialog lifecycle handler was corrected; its public API did not change.

Wide layout starts at 240px Explorer / flexible Canvas / 300px Inspector, bounded to 220–260 and280–320. Actual available width must fit all panes. Compact layouts collapse Explorer; phones switch panels while retaining edits/focus. Pointer/keyboard splitters and non-drag number/step controls coexist. See [architecture and workflow guide](UNIFIED-STUDIO-WORKSPACE.md).

## 4. Completed features

- Shared workspace, full-width editing routes, readable pane sizing and explicit document/list/table/code scroll ownership.
- Compact 48-row Token Table, one selected-token override editor, category/search/modified filters, default/resolved/override status, color/HEX/inheritance grouping and visible dependency chains. Canvas Tokens/Preview/Info separates concerns; actual component preview nodes remain stable.
- Components has one Inspector and Canvas Preview/Code/Usage/API/Accessibility tabs. Code/copy uses the validated preview configuration. Usage demonstrations are independent. Real CSS canvas widths have measured output and documented viewport/portal limitations.
- Adjacent unsaved count/Commit/Cancel/Undo; Studio theme, Canvas theme and Editing scope have distinct responsibilities. Existing reset/import/export and invalid-draft protections remain.
- Safe-area/viewport integration, opaque semantic system chrome and prepaint/runtime theme metadata, browser-offline hint, route-specific smart header and contextual Back to top.
- Sticky update/offline notices with measured focus clearance; loader/edit lock, actual activated readiness, failure/timeout/retry and an explicit guarded Reload now. Draft/import/other-tab/unknown-client and old-lazy-asset safeguards remain. [Policy exceptions](PWA-STANDARD-EXCEPTIONS.md) explain manual reload and editing-route defaults.
- Accurate bundled help, independent 13-perspective review and reviewed strict visual baselines.

## 5. Test counts and gates

Final product main CI 42180325282 passed all 324 enumerated cases:

| Scope | Passed |
| --- | ---: |
| Unit/integration | 161/161 |
| Studio E2E | 133/133 |
| React E2E | 6/6 |
| Production PWA | 5/5 |
| Strict Linux visual | 19/19 |
| Total | 324/324 |

TypeScript/core/React checks, lint, generated token/breakpoint/contract/validator consistency, SSOT, production build and deployment artifact checks passed. Production checks verified first-frame validation, subpath navigation and script CSP blocking inline execution/eval. No timeout/assertion/visual threshold was weakened. Retained failure traces/screenshots were added to quality CI.

Supplemental evidence is separate from that total: 24 independent Chrome route/width/theme journeys; recovered-source Playwright WebKit 27.2 **39/39**; focused post-polish Chrome **22/22**; native-close/Documentation Chromium 156 author repeat **15/15** and full related **28/28**. These scopes overlap and must not be summed into a fabricated unique-test total.

All 19 Linux candidates were individually inspected. Final capture source 67f0f53/run 42176233841 used Ubuntu 24.04, Playwright 1.64.1, Chromium 156.0.8078.4 and unchanged font digest `19046633cf2be18efb8fa0520dddec60dfbc95b30d719c47533fb2d8df22b5f4`. Strict 0.001 comparison remains; the temporary capture job was removed.

## 6. Browser and hosted verification

Chrome 157.0.8103.38 independently checked both workspaces at 320/390/768/1280/1440/1920px in light/dark:24 journeys with no document overflow, page/console errors or failed resources. On the final hosted B build,18 navigation/workspace journeys covered all 10 routes plus 390/1440px light/dark workspaces; all 18 had no page/console errors. The 10-route navigation context additionally recorded zero HTTP error responses and external requests; those network observers were not attached to the eight separate workspace contexts. Generated code/property parity and invalid token blocking/cancellation were exercised.

Actual hosted service workers completed:

`652cf8a00c538fb7b036 → bc33df665683dc92506b → 1170b641fcdfe7977a19`.

The new-client A→B journey observed actual checking→activating→ready states, busy loader and inert editing, deep-scroll notification visibility, unsafe draft rejection, other-tab rejection, actual activated readiness, no automatic reload, post-ready draft rejection at Reload now, explicit reload, committed `color.surface` preservation and offline reload/Components Code access. No fake worker/registration state was used.

Actual native Safari 27.0.1 `(22625.1.29.11.28)` was checked through existing Computer Use, without enabling Remote Automation: narrow/wide pane transitions retained a changed label, actual preview/code matched, native page-menu 200% reflow worked and was restored to 100%, a missing token alias disabled Commit, and Cancel restored zero changes. The task tab was closed. This was bounded native UI smoke: exact per-tab build metadata and CSS viewport width were not captured during the A/B rollout; there is no full Safari console/network/offline/install claim. Evidence is in the Computer Use transcript, not separate persisted Safari screenshots. Native 400% zoom remains **NOT VERIFIED**; the observed menu listed up to 300%.

One initial hosted navigation pass remained at Loading AI Agent Rules beyond the harness's 5 second expectation. A fresh diagnostic mounted its actual page in approximately 527ms with no request/page errors; the unchanged 5 second full smoke, strengthened to require the real export control and reject generic load-error content, then passed 18/18. No application change or larger timeout was used. The initial failure is retained; its precise transient cause was not established.

## 7. Accessibility and independent review

Automated keyboard/focus, responsive geometry and selected axe checks passed; native Safari exposed named controls, semantic table content and invalid-draft feedback. Confirmed issues were fixed: phone field visibility after feedback/resize, tablet character-wrapped values, table-header stacking over the app bar, hidden deep-scroll update notices, pane drag jumps after an unblurred width edit, ambiguous outer Preview naming and 320px label wrapping. Linux CI additionally exposed a native queued Dialog close event closing a reopened Menu; a current-open-state guard and real native-event regression resolved it. The Documentation test now waits for lazy-route readiness before its original scroll assertions.

Three independent read-only agents covered 13 perspectives and actual source/screenshots, with a further independent Menu/help follow-up. [Review evidence](UNIFIED-STUDIO-REVIEW-2026-11-06.md) records findings, severity, impact, fix and verification. No confirmed unresolved P0 or release-blocking P1 remains in the scoped engineering review. This is not human visual approval or WCAG certification.

## 8. Security and dependency review

No runtime/development dependencies or lockfile changes were introduced. `npm audit` returned 0 known advisories on 6 November 2026. Existing strict bounded JSON import validation, prototype-pollution rejection, safe DOM rendering, non-executable agent contracts, static-only verified precaching and production CSP checks remain. No API key/backend/authentication requirement was added. The confirmed Menu fix and helper UI do not expand application or browser permissions. Unperformed penetration testing is **NOT VERIFIED**; zero advisories does not prove absence of vulnerabilities.

## 9. Performance and layout measurements

Final hosted Components route: Lighthouse 13.6.0, Chrome 157, mobile 412×823 simulation with simulated throttling, single isolated navigation at 2026-11-06T07:44:29Z:

| Measurement | Observed |
| --- | ---: |
| Performance score |100/100 |
| Automated accessibility score |100/100 |
| FCP |1034.656ms |
| LCP |1274.656ms |
| Total Blocking Time |3ms |
| CLS |0.0160137864 |
| Speed Index |1034.656ms |

No run warnings. This is one lab sample, not field Core Web Vitals, field INP, complete interaction latency or WCAG conformance.

At the same 1440×900 Chrome viewport, the Token page main region changed from 13262px high to 1058px; overall input/select/textarea count changed 73→14, including hidden/preview controls. The selected-token override editor count is 48→1. These are observed layout/DOM measurements, not a claim about CPU latency. The comparable 390×900 main height changed 13327→1265px. Baseline build 652 and measured product build 5100ff209bb8678d4cd8 retain their source identity; later changes were the bounded Menu lifecycle correction and static help, with strict visual regression retained.

## 10. Known limitations

- Physical iPhone/iPad/Android installation, standalone launch, safe areas, OS/status-bar presentation, virtual keyboard and rotation: **NOT VERIFIED**.
- Manual VoiceOver/NVDA interpretation, actual 400% zoom and independent human visual acceptance: **NOT VERIFIED**. Actual Safari 200% is only the bounded smoke above.
- Full stable-Firefox and complete native-Safari coverage, field performance and production-release certification: **NOT VERIFIED**.
- Token tables intentionally scroll horizontally when available width is insufficient. Bulk mutation/virtualization, additional component API properties, media-query device emulation and package publication are not claimed.
- A first uncached visit still needs connectivity; browser storage can be unavailable/evicted. In-memory drafts cannot be guaranteed across crashes or forced termination.

## 11. Remaining work

Complete the unchecked physical/manual items in [task.md](../task.md) and [release acceptance](RELEASE-ACCEPTANCE.md), recording tester/device/browser/build/observations. Do not mark the complete original production definition of done or full PWA/WCAG conformance achieved before that evidence exists. The engineering amendment, automated gates and product deployment are complete.

Raw Chrome/upgrade/artifact/Lighthouse JSON and images are retained locally under `/tmp/pwa-studio-next/`; these paths are not permanent hosted download links. GitHub CI/Pages runs above and committed visual baselines are inspectable provenance. No raw customer/business data was used.

## 12. Commits and pull requests

- [PR 9: unified workspace and PWA](https://github.com/yapweijun1996/PWA-Design-System/pull/9), merge `a04651567456c6d11415c1083dfabdf8fa633c2e`; final PR CI [42177808402](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42177808402).
- [PR 10: bundled help and documentation](https://github.com/yapweijun1996/PWA-Design-System/pull/10), merge `3163663ce123b4c91abe79879f60972a107dc803`; final PR CI [42179905320](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42179905320).
- Key reviewed product checkpoints: shared workspace 32c7481/17da63e, Components e40a8ec/ccbb39e, Tokens ab130f8/4e027ef, PWA f15e3af/6067180, layout/readability d427e5e/24e308a, native Menu lifecycle 1ffccaf and help clarification 8a1ac33.

This later evidence-only documentation follows the same PR/CI/Pages process. Its runtime artifact must remain byte-identical to verified B; its final merge hash is reported in the delivery message rather than invented inside its own pre-merge document.
