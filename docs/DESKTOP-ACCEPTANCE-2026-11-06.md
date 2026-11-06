# Desktop acceptance execution — 6 November 2026

This round implements the remaining acceptance plan, rather than rebuilding the delivered Studio. Tested application source is merge `40459855467830a988cb6bcf148e7ae4af21c8ce`; the observed hosted runtime is `1170b641fcdfe7977a19`. This branch changes documentation and evidence only. Its local production output matches all 30 files of the preceding main CI artifact byte for byte; the artifact validator also passes all 29 precache digests. No new application version or N→N+1 update is implied by this packet.

All execution here is automated or AI-operated on macOS 27.0.1. There are no supplied physical devices or human testers. Full PWA Standard/WCAG conformance, human interpretation, physical installation and field performance remain **NOT VERIFIED**.

## Delivered changes

- Preserve the seven original incomplete parent tasks and split them into independently verifiable device, browser, zoom, text enlargement and human-signoff subcases.
- Add current-version evidence records and practical iPhone/iPad/Android, installation, safe-area, virtual-keyboard, rotation, offline/update and human VoiceOver/NVDA execution packets in [release acceptance](RELEASE-ACCEPTANCE.md).
- Correct the obsolete Architecture statement that Pages deployment was disabled; the actual workflow publishes only the exact successful main push artifact and rejects obsolete runs.
- Record an independent AI source/document/screenshot review, without presenting it as independent human approval.

## Current Chrome execution

Actual installed stable Google Chrome **157.0.8103.38** was launched in isolated contexts. Viewport-sized tests are desktop emulation, not physical mobile tests or native browser zoom.

| Execution | Result | Evidence and boundary |
| --- | --- | --- |
| Components/Tokens × six widths × Light/Dark × comfortable/compact | 48 journeys PASS | [Matrix records](evidence/desktop-acceptance-2026-11-06/chrome-matrix.json); widths 320/390/768/1280/1440/1920. Each records runtime, pane geometry and no document overflow. Components retain one Variant control and matching generated Code; Tokens retain one Inspector, draft feedback and visible focused editing. |
| Scoped automated accessibility | 48 scans with zero violations | Same matrix; WCAG 2 A/AA, 2.1 AA and 2.2 AA tags, scoped to `.ws-workspace`. These scans run **before** the editing steps; they do not establish invalid-state coverage or WCAG conformance. |
| Actual DOM viewport measurement | 12 probes PASS | [Geometry](evidence/desktop-acceptance-2026-11-06/chrome-geometry.json): both routes at all six widths, measured innerWidth/innerHeight/DPR, document width, CSS zoom and transform. |
| Hosted navigation/workspace/import | 19 journeys PASS | [Hosted records](evidence/desktop-acceptance-2026-11-06/chrome-hosted.json): ten routes, eight workspace width/theme journeys and one transactional import/commit/reload journey. Prototype-key import rejected; valid configuration previewed without early persistence, then committed and retained after reload. |
| Hosted overlay/offline follow-up | 3 journeys PASS | [Results](evidence/desktop-acceptance-2026-11-06/hosted-overlays-offline.json): Dialog Tab trap/Escape/focus restoration, Menu Escape/restoration, controlled offline reload retaining committed token override and cached Components Code. Whole journey page/console/HTTP ≥400 observation; desktop synthetic context, no installation claim. |
| Existing source keyboard/layout/accessibility tests using installed stable Chrome | 22 tests PASS | [Execution log](evidence/desktop-acceptance-2026-11-06/chrome-keyboard.log); Components/workspace and Token-workspace layout files, one worker. Covers panel focus recovery, keyboard/non-drag pane resizing, scoped dark-state axe, focus visibility, preview dialog Escape/restoration, local table scrolling and short-window header layering. Runs against local source via Vite, separately from hosted production journeys. |

Observation scope matters: all 48 matrix contexts capture page/console errors and HTTP responses ≥400. For the hosted record, console/page errors, HTTP ≥400 and external-request observation cover the **initial ten-route context**; the eight workspace contexts capture console/page errors, and the import context captures page errors only. Empty arrays are observations within those scopes, not a network audit of all 19 journeys. No private profile or customer data was used.

[Native headful Chrome baseline](evidence/desktop-acceptance-2026-11-06/chrome-native-baseline.json) also observed runtime `1170b641fcdfe7977a19`, CSS viewport 1280×729, DPR 2, default CSS zoom/transform and no document overflow. Native CUA then selected an unrelated existing Chrome instance with a leave-site prompt. The prompt was canceled; no Leave action or security/profile change was performed. Native Chrome 200%/400% interaction is **NOT VERIFIED** because the isolated QA window could not be safely selected. The QA-owned browser was closed through its own context.

Representative captures: [wide Components Code](evidence/desktop-acceptance-2026-11-06/components-1440-dark-compact-code.png), [320px Components Code](evidence/desktop-acceptance-2026-11-06/components-320-light-comfortable-code.png), [tablet Token Inspector](evidence/desktop-acceptance-2026-11-06/design-tokens-768-light-compact-inspector.png), [390px Token Inspector](evidence/desktop-acceptance-2026-11-06/design-tokens-390-dark-comfortable-inspector.png). All are AI-operated desktop captures, not physical-device signoff.

## Stable Firefox and native zoom

Official, signed/notarized **Firefox Stable 159.0.1**, build `20261102144711`, was tested from an independent temporary app copy with fresh synthetic profiles. Existing Nightly/personal profiles were not replaced. [Firefox report](evidence/desktop-acceptance-2026-11-06/firefox/report.md), [deduplicated summary](evidence/desktop-acceptance-2026-11-06/firefox/summary.json) and [native zoom provenance](evidence/desktop-acceptance-2026-11-06/firefox/native-zoom-provenance.json) retain exact source/runtime, vendor checksum, signature and observation boundaries.

The bounded run passed **81 unique atomic checks**. Including retries, there were 91 successful executions and five failed/interrupted assertions; retries are not extra unique passes. Coverage includes 40 route/theme/density/width combinations, component search/configuration/Code, Menu/Dialog keyboard recovery, Token draft validation/Cancel/Commit/persistence and separated editing/Canvas/Studio scopes. Requested 390px windows measured **500px** because of the native window clamp; these are not 390px or physical-phone results.

CUA operated the native browser zoom controls and observed the actual **200%** and **400%** reset-zoom indicators. These are not CSS zoom, page-scale or DPR overrides. Final focused flows passed **6/6 at each zoom**: search/select, Inspector→Code parity with local code scrolling, token editing, Commit and reload persistence. At 200% Light/comfortable, the actual CSS viewport was **720×394**, DPR 4. At 400% Dark/compact it was **384×210**, DPR 7.5; Firefox's returned geometry is retained rather than relabeled as 320px. An additional 400% Dark/comfortable run checked missing-alias blocking, focused input below the header and within the viewport, Undo, Cancel, Dialog Tab trapping and Escape restoration. [200% capture](evidence/desktop-acceptance-2026-11-06/firefox/native200-code.png) and [400% capture](evidence/desktop-acceptance-2026-11-06/firefox/native400-code.png) show the final Code states.

All five unsuccessful attempts remain recorded: temporary selector escaping, an incorrect whole-string Undo expectation for individually typed characters, an initial HTTP400 with unknown exact cause, driver scroll alignment putting Commit under the sticky header, and a premature fixed-delay reload assertion. A normal scroll-to-center before a real WebDriver click and a rendered-workspace wait corrected the latter harness assumptions; affected native 200%/400% flows then passed without application edits, bypassed clicks or weakened repository assertions. Undo correctly removes the last typed-character edit. No confirmed product defect was inferred from these attempts.

Firefox import/export, full console/HTTP/network coverage, native 200% overlays, the exhaustive zoom/theme/density cross-product and Firefox PWA offline/install/update remain **NOT VERIFIED**. Native zoom was restored to 100% and the QA-owned browser sessions were closed. These bounded passes do not close the full compound Z1 or stable three-browser acceptance requirement.

## Independent AI review

[Independent review](evidence/desktop-acceptance-2026-11-06/independent-review.md) examined actual source, current Chrome records and selected narrow/tablet/wide screenshots. No P0/P1 product defect was confirmed. Its P2 issue—combining native 200% zoom with text enlargement—was resolved by adding separate `PWA-07-H6`. The reviewer also identified the scoped-axe and hosted-observer boundaries, which are recorded above. Its Firefox follow-up independently recomputed the 81/91/5 counts and reviewed final native zoom captures/provenance; no additional P0/P1 was confirmed. Release delivery remains the primary agent's verification responsibility.

## Verification and limitations

TypeScript, lint, token consistency and 21 component-family contract checks passed. The first unchanged unit run returned 160 PASS and one 5-second timeout in the contract mutation test. Exact timeout cause is **NOT VERIFIED**; no defect or assertion was suppressed. The unchanged full suite rerun with one worker passed **161/161**. [First attempt](evidence/desktop-acceptance-2026-11-06/unit-first-attempt.json) and [retest](evidence/desktop-acceptance-2026-11-06/unit-retest.log) retain both outcomes. No timeout threshold was changed.

Production build and artifact validation passed. [Runtime parity](evidence/desktop-acceptance-2026-11-06/runtime-parity.json) records 30/30 byte-identical files. Historical 324-case CI and prior hosted upgrade/offline/Lighthouse results remain in the [previous delivery report](UNIFIED-STUDIO-DELIVERY-2026-11-06.md); they are not counted as new execution here. This round adds no new performance measurement, dependency or security-policy change.

Physical iPhone/iPad/Android browser and standalone behavior, actual safe areas/virtual keyboards/rotation, human VoiceOver/NVDA interpretation, independent human visual approval and actual text enlargement remain **NOT VERIFIED**. Safari's prior native UI/200% smoke remains historical and bounded; no fresh full Safari metadata/console/network/offline/install acceptance is claimed. Test packets make the missing evidence executable; they do not close those tasks.

Normal PR/main CI and official Pages deployment must still succeed before this branch is called delivered. The PR's checks/deployment records and final delivery response identify those exact runs; this file records the pre-release source/runtime acceptance evidence.
