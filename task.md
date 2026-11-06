# Studio workspace redesign and PWA Standard alignment

Status: Authorized engineering delivery completed and product deployment verified. Physical/manual acceptance remains partly NOT VERIFIED; the full production-release definition of done is not claimed. The latest user request authorizes KB auto-manager implementation and the supplied workspace review.
Recorded: 6 November 2026.
Inspected baseline: `4b1b74566c5f05b2564c7cfa4e7a65ddd6994fe0`.

## Goal and scope

Bring the Studio into documented alignment with KB `pwa:product-standard` v1.0.0, updated 8 October 2026. The retrieved registry record is enabled but has no last-verification date and is flagged stale; it is a source of intended requirements, not evidence that this application meets them.

The current request supersedes the earlier documentation-only scope. Implement the approved workspace direction and in-scope PWA engineering, preserve existing contracts, verify independently, and use the existing authorized PR/CI/Pages delivery process. Browser permission expansion, physical-device access and human acceptance are not implied.

MUST requires implementation or a concrete documented exception. DEFAULT applies when the screen/navigation model makes it useful. CONDITIONAL depends on application capability. An unperformed device check is **NOT VERIFIED**, not a confirmed defect.

## Approved workspace review and implementation phases

- [x] WS-01 (P1): One shared resizable Explorer / Canvas / Inspector layout; initial widths 240px / remaining space / 300px, bounded by the recommended 220–260px and 280–320px ranges where desktop space permits. Mouse/touch and keyboard resizing; readable responsive fallbacks; explicit scroll ownership and no document overflow.
- [x] WS-02 (P1): Unified toolbar, selected state and editor action model. Place unsaved count next to Commit; separate Studio theme, canvas theme and editing scope. Preserve draft, undo, reset, cancel, import and commit semantics.
- [x] WS-03 (P2): Compact Token Table with category/search/modified filtering, selected-token Inspector, coherent color/HEX/inheritance display, visible dependency chain, and independent visual preview. Reuse token validation/resolution and stable component preview nodes.
- [x] WS-04 (P1): Components uses one property control center in Inspector; move Code/copy to a Canvas tab, clarify Examples in Usage, preserve all 21 supported component APIs and preview/code parity.
- [x] WS-05 (P2): Typography, spacing, lightweight navigation, hover/focus, empty/error states and accessible tabs/splitters. Review top/middle/bottom, active fields, both themes and responsive panel transitions in real browsers.
- [x] WS-06 (P1): Independent functional/accessibility/visual regression, evidence-grounded 13-persona review, documentation, PR/CI/Pages and hosted artifact/offline/update verification. Human/device checks remain NOT VERIFIED without actual evidence.

Execution order: shared layout contract; Token and Component interaction changes; PWA engineering and route-specific defaults; independent verification and release. The user prioritizes layout/interaction over new colors or animation. Reported screenshot risks are not confirmed functional defects until reproduced. Existing PWA tasks below remain in scope; preserve their IDs and evidence boundaries.

## Historical implementation evidence

- The authorized workspace and PWA engineering is implemented. [PR9](https://github.com/yapweijun1996/PWA-Design-System/pull/9) merged as `a046515`; [PR10](https://github.com/yapweijun1996/PWA-Design-System/pull/10) merged as `3163663` and adds accurate bundled help.
- Both pages reuse one resizable workspace. Tokens has one selected-token editor; Components has one property Inspector and independent Canvas tabs. Public component APIs, token resolution and React boundaries remain intact. A confirmed native Menu close-event race was corrected without an API change.
- Final product main CI [42180325282](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42180325282) passed 324/324: 161 unit/integration, 133 Studio E2E, 6 React, 5 PWA and 19 strict visual cases. Typecheck, lint, generated consistency, SSOT, build/artifact and production CSP checks passed.
- Supplemental evidence: 39 recovered-source WebKit cases, 24 independent Chrome route/width/theme journeys and 18 final hosted navigation/workspace journeys passed. Actual native Safari 27.0.1 UI and 200% zoom smoke is partial evidence, not full Safari/iOS acceptance.
- All 19 Linux visual candidates were individually inspected; the temporary capture job was removed. The environment and 0.001 comparison threshold remain unchanged.
- Final Pages run [42180666846](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42180666846) serves build `1170b641fcdfe7977a19`. All 30 files match its CI artifact and all 29 precache digests match. Actual old 652→A→B draft/other-tab/activation/reload guards, committed configuration preservation and offline reload/Code passed.
- [Architecture/workflow guide](docs/UNIFIED-STUDIO-WORKSPACE.md), [independent review](docs/UNIFIED-STUDIO-REVIEW-2026-11-06.md), [PWA exceptions](docs/PWA-STANDARD-EXCEPTIONS.md) and [full delivery report](docs/UNIFIED-STUDIO-DELIVERY-2026-11-06.md) record evidence, recovery and limitations.

A checked engineering item means its implementation is present with the stated verification. Physical installation, OS chrome/virtual keyboard, actual 400% zoom, manual assistive technology and independent human visual acceptance remain open. No complete PWA or WCAG conformance claim is made.

## Existing behavior to preserve

- [x] Record the existing manifest, repository subpath, standalone display metadata and installation icons.
- [x] Record deterministic build identity, versioned static caches, SHA-256 installation checks and mixed-deployment rejection.
- [x] Record the defined offline shell, documentation, component tools, token editing and theme preview.
- [x] Record visible waiting-worker notification, disabled duplicate preparation, timeout/error feedback and draft/import/other-tab protection.
- [x] Record the current explicit manual-reload policy and previous-version lazy-asset protection.
- [x] Record existing responsive, keyboard, contrast, reduced-motion and CSP checks.

These checkmarks mean baseline evidence was recorded, not that the complete PWA Standard passed. The prior release recorded 151 unit/integration, 118 Studio E2E, 6 React, 4 PWA and 17 visual cases, hosted upgrade/offline checks and an isolated Lighthouse sample. Those are historical baseline counts; new implementation verification must be recorded separately. See [delivery evidence](docs/COMPONENTS-WORKSPACE-DELIVERY-2026-11-06.md).

## Standard coverage and observed gaps

| Standard area | Inspected baseline evidence (before this amendment) | Task owner |
| --- | --- | --- |
| iOS-first / safe areas — MUST | Studio viewport metadata lacks `viewport-fit=cover`; no `safe-area-inset-*` use was found in Studio source. Physical iOS behavior is NOT VERIFIED. | PWA-01, PWA-07 |
| Solid theme-aware system chrome — MUST | Shell surfaces use semantic tokens. HTML and manifest theme colors are fixed white; appearance bootstrap sets root attributes without synchronizing theme-color metadata. Actual OS chrome is NOT VERIFIED. | PWA-02, PWA-07 |
| Smart top bar — DEFAULT | Shell top bar is sticky; no scroll-direction hide/reveal behavior was found. | PWA-04 |
| Contextual scroll-to-top — DEFAULT | No dedicated scroll-to-top control was found; route navigation currently resets document scroll. | PWA-05 |
| Explicit SW update — MUST | Waiting notification and preparation guards exist. Preparation intentionally leaves reload to the user. | PWA-03: preserve guards and resolve the standard difference explicitly |
| Update loader — MUST | Immediate status text and a disabled button exist; no dedicated updating loader/overlay or activation-complete reload control was found in the PWA feature. | PWA-03 |
| Versioned cache strategy — MUST | Version identity, digest validation and client-aware cleanup exist. Keeping the preceding cache is deliberate protection, not evidence of failed cleanup. | Preserve and regress in PWA-08; document freshness/retention rationale |
| Offline contract — MUST / CONDITIONAL | Scope is documented and prior Chromium offline editing/reload passed. No dedicated offline-state presentation was identified in the inspected PWA feature. | PWA-06, PWA-08 |
| Manifest / installed launch — MUST | Manifest, icons, start URL and scope exist. Actual OS installation and standalone launch are NOT VERIFIED. | PWA-07 |
| Responsive / accessibility — MUST | Prior browser checks exist. Full iOS input sizing, physical touch targets, actual zoom and manual assistive-technology acceptance remain unverified. | PWA-01, PWA-07, PWA-08 |
| Application lifecycle states — applicable MUST | Initial loading, update-available, checking, prepared and error messages exist. A complete visible offline/updating/reloading transition is not established. | PWA-03, PWA-06 |
| Security / privacy — MUST | CSP and static-only precaching exist; prior policy tests and dependency audit are recorded. | Preserve and rerun appropriate checks in PWA-08 |

## Ordered backlog

### PWA-01 — iOS layout and safe-area coverage

Priority: P1. Rule: MUST. Owner: Frontend engineer; physical validation by device tester.

- [x] Map safe-area ownership for the header, sidebar/drawer, content, update notice, overlays and future floating controls; prevent duplicate inset padding.
- [x] Add the required viewport integration and token-compatible safe-area handling during this implementation.
- [ ] Check virtual-keyboard open/closed behavior, portrait/landscape, focused fields and scroll-to-focused-control behavior.
  - [ ] PWA-01-K1: Actual iPhone Safari browser and installed mode: open/close the keyboard on component properties, Token override and search; retain visible focus and access to actions (case D3).
  - [ ] PWA-01-K2: Repeat on actual iPad Safari, including tablet window/split view and hardware keyboard when available (case D3).
  - [ ] PWA-01-K3: Rotate with a focused field and keyboard open, then close it; verify scroll recovery and reachable commit/navigation controls in both modes (case D3).
- [x] Implement and check a 16px minimum for representative Studio host fields, including compact host styles, without disabling user zoom. Core component previews retain their approved tokens; physical iOS focus zoom remains NOT VERIFIED.
- [ ] Verify content and controls remain clear of the notch/home indicator and have no document horizontal overflow.
  - [ ] PWA-01-S1: Actual iPhone browser/installed portrait and landscape: top/middle/bottom, drawer, Dialog, Menu and update notice clear system insets (case D2).
  - [ ] PWA-01-S2: Repeat on actual iPad browser/installed and tablet window sizes; distinguish intentional Canvas/code scrolling from document overflow (case D2).

Acceptance: Actual iPhone/iPad browser and installed-mode evidence, plus desktop/tablet/phone regression. CSS viewport emulation alone cannot close this task.

### PWA-02 — Solid Light/Dark system chrome

Priority: P1. Rule: MUST. Dependency: PWA-01 layout ownership.

- [x] Define opaque top/safe-area surfaces using existing semantic tokens.
- [x] Synchronize supported browser theme-color metadata with the resolved Light/Dark/System preference, before first paint and during runtime changes.
- [x] Review manifest fallback/startup colors and platform-specific status-bar behavior; document platform limitations rather than assuming metadata proves OS rendering.
- [x] Cover saved appearance, system changes and committed token overrides without incorrect-theme flashes.

Acceptance: Light/dark cold and warm launches, readable status icons and coherent shell/system surfaces on actual target devices.

### PWA-03 — Guarded update loader and reload policy

Priority: P1. Rule: MUST. Owner: PWA engineer.

The KB default describes user-confirmed update, loader, activation and reload. The existing Studio deliberately separates **Prepare update** from manual reload to protect editing. Do not silently replace this behavior.

- [x] Write the update-state contract and document the concrete draft/data-loss reason for any exception to the standard's reload sequence.
- [x] Prefer preserving the two-step flow, with an explicit safe reload action after preparation; finalize that design before implementation.
- [x] Show accessible immediate updating/loading feedback, block duplicate actions and expose success, failure, timeout and retry states.
- [x] Verify actual activation readiness before announcing success or enabling reload; a request-accepted message alone must not be treated as activation completion.
- [x] Preserve pending-import, valid/invalid draft, other-tab, unresponsive-client and previous-build asset protections; recheck unsafe work before any reload.
- [x] Reuse an approved loader only when its accessibility, license, dependencies and integration fit; an external loader dependency is not assumed necessary.

Acceptance: Real browser version N to N+1 tests covering notification, loader, activation, explicit reload, failures and preservation of committed configuration. No unsolicited refresh or weakened draft guards.

### PWA-04 — Smart top bar on relevant scrolling screens

Priority: P2. Rule: DEFAULT. Dependency: PWA-01 and PWA-02.

- [x] Identify the actual scroll owner per route and decide where hide-on-down/reveal-on-up is useful; record route-specific exceptions.
- [x] Use movement thresholds and stable geometry; prevent jitter and layout shifts.
- [x] Keep keyboard-focused controls and open navigation/overlays usable; reveal the bar when focus requires it.
- [x] Respect reduced motion and clean up listeners when ownership changes.

Acceptance: Top/middle/bottom, both scroll directions, route changes, keyboard focus, open drawer/dialog and reduced-motion checks. Do not apply hiding indiscriminately to a no-scroll utility.

### PWA-05 — Contextual return-to-top

Priority: P2. Rule: DEFAULT. Dependency: PWA-01.

- [x] Decide which long routes need it and which already provide an adequate return path; document N/A cases.
- [x] Where useful, provide a labeled keyboard-accessible control after meaningful document scrolling, hidden near the top.
- [x] Respect bottom/right safe areas, touch size, focused forms, update notices and reduced motion.
- [x] Keep Explorer, code and deliberate canvas scrolling independent; avoid an unnecessary additional scroll container.

Acceptance: Threshold, document-scroll ownership, focus destination, overlap, keyboard and reduced-motion checks across supported sizes.

### PWA-06 — Offline and lifecycle feedback

Priority: P1. Rule: Applicable MUST.

- [x] Map STARTING, READY, OFFLINE, UPDATE AVAILABLE, UPDATING, RELOADING and ERROR states to concise visible/accessibly announced feedback where useful.
- [x] Explain which local tools remain usable offline and distinguish unavailable offline support from a temporary loss of connectivity.
- [x] Avoid treating `navigator.onLine` alone as proof of service availability or announcing successful server transactions.
- [x] Preserve existing offline tools, saved appearance and token configuration; avoid disruptive overlays during normal local work.

Acceptance: First visit without a usable cache, controlled offline reload, reconnect, registration failure, interrupted update and locally persisted editing scenarios.

### PWA-07 — Manual and physical-device acceptance

Priority: P1 for release evidence. Status: NOT VERIFIED; missing evidence is not a product failure.

- [ ] Actual iPhone/iPad Safari: browser and home-screen installation, standalone launch, status bar, safe areas, keyboard, rotation and offline relaunch.
  - [ ] PWA-07-I1: Actual iPhone Safari browser and home-screen cold/warm launches, Light/Dark/System and status-bar readability (cases D1–D2).
  - [ ] PWA-07-I2: Actual iPad Safari browser/home-screen modes and tablet window sizes (cases D1–D3).
  - [ ] PWA-07-I3: Both devices: committed local editing, offline relaunch and controlled N→N+1 guarded update (cases D4–D5).
- [ ] Actual Android: installation, standalone launch, theme, touch and offline/update behavior.
  - [ ] PWA-07-A1: Actual Android Chrome browser and installed cold/warm launch, themes, touch, keyboard and rotation (cases D1–D3).
  - [ ] PWA-07-A2: Actual Android installed offline relaunch and controlled N→N+1, including draft/import/other-tab guards and retained committed configuration (cases D4–D5).
- [ ] Real Safari and supported stable browser compatibility; keep WebKit and Firefox Nightly evidence labeled separately.
  - [x] PWA-07-B1: Stable Chrome desktop primary flows with per-tab source/runtime identity and measured CSS viewport (case B1).
  - [ ] PWA-07-B2: Actual native Safari desktop flows, bounded console/network observation and per-tab runtime/viewport evidence; historical UI smoke is insufficient (case B1).
  - [ ] PWA-07-B3: Supported stable Firefox desktop flows, with exact version/channel; Nightly is supplementary and cannot close this subcase (case B1).
- [ ] VoiceOver/NVDA task interpretation, actual 200%/400% zoom, text enlargement and independent human visual approval.
  - [ ] PWA-07-H1: Native browser 200% zoom primary flows, actual CSS viewport and source/runtime identity (case Z1).
  - [ ] PWA-07-H2: Native browser 400% zoom primary flows with the same identity/geometry evidence; a 320px emulation alone does not close this (case Z1).
  - [ ] PWA-07-H6: Actual OS/browser text enlargement primary flows with recorded settings and restored starting values (case Z1); native page zoom does not close this subcase.
  - [ ] PWA-07-H3: Human-operated VoiceOver task interpretation and findings/retest (case H1).
  - [ ] PWA-07-H4: Human-operated NVDA task interpretation and findings/retest (case H1).
  - [ ] PWA-07-H5: Independent human visual decision across main tasks, themes and densities (case H2). AI review is separate evidence, not this approval.
- [ ] Record tester, device/OS/browser/assistive technology, build, date, screenshots/observations, findings and retests in the existing acceptance record.
  - [x] PWA-07-E1: Attach current-version desktop case evidence with SHA, runtime build, actual viewport/zoom, tester kind, steps and bounded console/network results.
  - [ ] PWA-07-E2: Attach executed physical-device records for each required platform and browser/installed mode.
  - [ ] PWA-07-E3: Attach actual human assistive-technology and visual decisions plus unresolved findings and retests. A prepared template does not close an execution record.

Supplemental actual desktop Safari 27.0.1 native checks verified narrow/wide panels, property→preview→code parity,200% reflow, invalid token blocking and Cancel restoration, without enabling Remote Automation. Zoom was restored to 100%; the task tab was closed. Per-tab build identity and exact viewport were not captured, so this is bounded smoke evidence rather than complete Safari acceptance. Current stable Firefox native200%/400% focused flows subsequently passed within the bounded scope in [desktop acceptance](docs/DESKTOP-ACCEPTANCE-2026-11-06.md). Native200 overlays, full zoom cross-product and text enlargement remain NOT VERIFIED; do not close the compound zoom/manual parent.

Use [the existing manual checklist](docs/RELEASE-ACCEPTANCE.md). Owner/device access may be required; do not enable browser automation permissions automatically. Field Core Web Vitals remain a separate evidence task if production field-performance claims are intended; no telemetry backend is authorized here.

### PWA-08 — Regression, documentation and future release

Priority: P1. Dependency: Approved implementation of the preceding in-scope tasks.

- [x] Preserve JSON token SSOT, 21 component contracts, independent appearance axes and optional React boundaries.
- [x] Add focused browser coverage for new behavior and rerun relevant existing tests; retain strict visual/environment checks and individually review intentional baseline changes.
- [x] Recheck cache freshness, mixed-version refusal, scoped cleanup, offline tools, import security, CSP and dependency advisories without weakening gates.
- [x] Update PWA/installation/acceptance documentation and maintain one central exception record for the update policy and route-specific DEFAULT exceptions.
- [x] Complete normal feature-branch/PR/CI review before deployment under the existing session authorization; verify the actual hosted build, assets, console/network, offline and update journeys afterward.
- [x] Report every standard item as PASS, FAIL, NOT VERIFIED or justified N/A with source/build evidence. Declare full conformance only after required evidence or documented exceptions exist.

## Delivery status by standard item

| Item | Engineering result | Remaining acceptance |
| --- | --- | --- |
| WS-01–WS-06 | PASS: shared layout/interaction, Token Table/Inspector, single Components editor, focused recovery, independent review, normal CI/PR/Pages and hosted verification | Independent human visual acceptance is NOT VERIFIED |
| PWA-01 | PASS for implemented viewport-fit/safe-area ownership, host input sizing and automated responsive/focus checks | Physical notch/home indicator, mobile virtual keyboard, rotation and standalone behavior are NOT VERIFIED |
| PWA-02 | PASS for opaque semantic surfaces and prepaint/runtime theme metadata | Actual installed OS/status-bar presentation is NOT VERIFIED; manifest light fallback is documented |
| PWA-03 | PASS: real activated readiness, loader/edit lock, timeout/retry, explicit Reload now, draft/import/other-tab protections, actual hosted A→B upgrade and offline recovery | Manual-reload editing-safety exception documented; no automatic refresh claimed |
| PWA-04 | PASS: Documentation hide/reveal with focus/reduced-motion/system-notice handling | Always-sticky editing routes are justified DEFAULT exceptions |
| PWA-05 | PASS: contextual document Back to top with safe areas/focus; local scrollers remain independent | N/A for short utilities and local Explorer/code scrolling |
| PWA-06 | PASS: local startup/offline/update/error feedback and useful cached tools | navigator.onLine is only a browser hint; no first-visit offline or service-availability claim |
| PWA-07 | PARTIAL: actual Safari 27.0.1 native UI and 200% zoom smoke passed, plus Chrome157 and WebKit27.2 evidence | Physical iOS/Android, Safari full-suite/console/offline/install, actual 400% zoom, manual screen reader and human visual approval remain NOT VERIFIED |
| PWA-08 | PASS for engineering regression/security review, reviewed strict visual baselines, documentation and product release provenance | Full conformance remains conditional on the manual evidence above |

Final engineering evidence: [Unified Studio delivery](docs/UNIFIED-STUDIO-DELIVERY-2026-11-06.md). Current acceptance execution: [Desktop acceptance](docs/DESKTOP-ACCEPTANCE-2026-11-06.md). The unchecked physical/manual subitems are deliberately retained. A passing engineering release does not certify every PWA Standard or WCAG requirement.

## Current acceptance execution order

This round starts from merge `40459855467830a988cb6bcf148e7ae4af21c8ce`. The preceding 324-case result belongs to its recorded historical product source; it is not a new result for this round. Use the [current-version matrix and execution packet](docs/RELEASE-ACCEPTANCE.md#current-version-acceptance-matrix) for case status and evidence. Parent checkboxes above remain unchecked until all required subcases pass.

1. Identify source/runtime build and browser environment; run available desktop primary flows, actual browser zoom, keyboard and automated accessibility checks. Fix only reproduced in-scope failures, then retest.
2. Obtain an independent AI review against actual code/browser evidence and record its tester kind. It cannot replace H1/H2 human approval.
3. Execute D1–D5 when actual iPhone, iPad and Android hardware is supplied; no real devices are currently available. Keep their results NOT VERIFIED until execution.
4. Execute H1/H2 with actual human testers. Keep missing human evidence NOT VERIFIED; do not label it N/A or infer a defect.
5. Reconcile evidence against the candidate SHA/runtime build; complete normal PR/CI/Pages and hosted verification when engineering changes require delivery. A documentation packet alone is not a production conformance claim.

## Inspected sources

- KB Skill: `pwa:product-standard` v1.0.0; registry reference `270d896a-12b0-40b4-856f-f6274d872c95:3f932f5e-8bc9-40c6-86e9-e676d47e1c52`.
- [Studio HTML](apps/studio/index.html), [manifest](apps/studio/public/manifest.webmanifest), [appearance bootstrap](apps/studio/public/theme-init.js), [shell styles](apps/studio/src/styles.css) and [routing](apps/studio/src/main.ts).
- [PWA lifecycle](apps/studio/src/features/pwa/index.ts), [update styles](apps/studio/src/features/pwa/styles.css), [worker template](apps/studio/src/features/pwa/sw-template.js), [build/version generation](apps/studio/vite.config.ts) and [PWA guide](apps/studio/src/features/pwa/README.md).
- [Production PWA tests](tests/pwa/pwa.spec.ts), [workspace verification](docs/COMPONENTS-WORKSPACE-VERIFICATION.md), [delivery evidence](docs/COMPONENTS-WORKSPACE-DELIVERY-2026-11-06.md) and [manual acceptance](docs/RELEASE-ACCEPTANCE.md).
