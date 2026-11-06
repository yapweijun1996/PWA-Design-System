# Studio workspace redesign and PWA Standard alignment

Status: Implementation integrated; final regression, independent visual review and release verification in progress. Physical/manual acceptance remains NOT VERIFIED. The latest user request authorizes KB auto-manager implementation and the supplied workspace review.
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
- [ ] WS-06 (P1): Independent functional/accessibility/visual regression, evidence-grounded 13-persona review, documentation, PR/CI/Pages and hosted artifact/offline/update verification. Human/device checks remain NOT VERIFIED without actual evidence.

Execution order: shared layout contract; Token and Component interaction changes; PWA engineering and route-specific defaults; independent verification and release. The user prioritizes layout/interaction over new colors or animation. Reported screenshot risks are not confirmed functional defects until reproduced. Existing PWA tasks below remain in scope; preserve their IDs and evidence boundaries.

## Current implementation evidence

- Integrated product checkpoint: `1ffccaf`; shared architecture and UI guide: [Unified Studio workspace](docs/UNIFIED-STUDIO-WORKSPACE.md).
- The compact Token Table renders one selected-token override editor, with readable value columns and deliberate table-local horizontal scrolling. Components uses one Inspector and separate Canvas content tabs; phone Canvas and Preview have distinct names.
- Independent review reproduced and fixed tablet values wrapping vertically, a short-window table header covering the app bar, stale pane drag origins after unblurred width input, and update notices disappearing during deep scrolling. Focused Token layout verification: 9/9 real Chrome before final PWA integration; the integrated132-case Studio suite passed. After final compact-label polish,22 targeted cases passed; a later native Menu lifecycle regression adds one case for final CI.
- Recovered-source unit/integration checks: 161/161. React6/6, production PWA5/5 and production first-frame/subpath/CSP checks passed before the bounded Menu lifecycle follow-up. Typecheck, lint, token/contract generation, SSOT and production artifact checks pass. These do not establish browser or device acceptance.
- PWA source implements measured sticky update/offline chrome, focus clearance, safe-area ownership, theme metadata, guarded activation and explicit Reload now. [Central exceptions](docs/PWA-STANDARD-EXCEPTIONS.md) retain the draft-safety reload policy and route-specific header defaults.
- Draft PR: [#9](https://github.com/yapweijun1996/PWA-Design-System/pull/9). All19 fresh Linux candidates were individually reviewed and accepted; the capture job was removed and strict visual comparison passed on `c061cf5`/CI42176891934. Independent13-perspective source/screenshot review and24 real Chrome journeys passed. Independent quality follow-up accepted the recovered Menu lifecycle fix; recovered-source WebKit39/39 passed. Recovered-source CI42177808402 passed324/324 (161 unit/integration,133 Studio,6 React,5 PWA,19 visual). PR#9 merged as `a046515`; main CI42178963197 and Pages42179274244 passed. Hosted build `bc33df665683dc92506b`:30 exact artifact files and29 precache digests verified. The new-client hosted upgrade journey and final evidence recording remain in progress.

A checked engineering item below means its implementation is present with the stated automation; acceptance involving actual OS/device/human observation remains open. No full PWA or WCAG conformance claim is made.

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
- [x] Measure iOS-facing input text sizes, including compact density; prevent unwanted focus zoom without disabling user zoom.
- [ ] Verify content and controls remain clear of the notch/home indicator and have no document horizontal overflow.

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
- [ ] Actual Android: installation, standalone launch, theme, touch and offline/update behavior.
- [ ] Real Safari and supported stable browser compatibility; keep WebKit and Firefox Nightly evidence labeled separately.
- [ ] VoiceOver/NVDA task interpretation, actual 200%/400% zoom, text enlargement and independent human visual approval.
- [ ] Record tester, device/OS/browser/assistive technology, build, date, screenshots/observations, findings and retests in the existing acceptance record.

Use [the existing manual checklist](docs/RELEASE-ACCEPTANCE.md). Owner/device access may be required; do not enable browser automation permissions automatically. Field Core Web Vitals remain a separate evidence task if production field-performance claims are intended; no telemetry backend is authorized here.

### PWA-08 — Regression, documentation and future release

Priority: P1. Dependency: Approved implementation of the preceding in-scope tasks.

- [x] Preserve JSON token SSOT, 21 component contracts, independent appearance axes and optional React boundaries.
- [x] Add focused browser coverage for new behavior and rerun relevant existing tests; retain strict visual/environment checks and individually review intentional baseline changes.
- [ ] Recheck cache freshness, mixed-version refusal, scoped cleanup, offline tools, import security, CSP and dependency advisories without weakening gates.
- [x] Update PWA/installation/acceptance documentation and maintain one central exception record for the update policy and route-specific DEFAULT exceptions.
- [ ] Complete normal feature-branch/PR/CI review before deployment under the existing session authorization; verify the actual hosted build, assets, console/network, offline and update journeys afterward.
- [ ] Report every standard item as PASS, FAIL, NOT VERIFIED or justified N/A with source/build evidence. Declare full conformance only after required evidence or documented exceptions exist.

## Recommended execution order

1. Confirm the PWA-03 update-policy exception/design while mapping safe areas and lifecycle ownership.
2. Implement PWA-01, PWA-02, PWA-03 and PWA-06 in controlled changes under the current implementation authorization.
3. Apply PWA-04 and PWA-05 only on relevant routes, with documented exceptions.
4. Complete PWA-07 and PWA-08; preserve existing working behavior and report unresolved verification limits.

## Inspected sources

- KB Skill: `pwa:product-standard` v1.0.0; registry reference `270d896a-12b0-40b4-856f-f6274d872c95:3f932f5e-8bc9-40c6-86e9-e676d47e1c52`.
- [Studio HTML](apps/studio/index.html), [manifest](apps/studio/public/manifest.webmanifest), [appearance bootstrap](apps/studio/public/theme-init.js), [shell styles](apps/studio/src/styles.css) and [routing](apps/studio/src/main.ts).
- [PWA lifecycle](apps/studio/src/features/pwa/index.ts), [update styles](apps/studio/src/features/pwa/styles.css), [worker template](apps/studio/src/features/pwa/sw-template.js), [build/version generation](apps/studio/vite.config.ts) and [PWA guide](apps/studio/src/features/pwa/README.md).
- [Production PWA tests](tests/pwa/pwa.spec.ts), [workspace verification](docs/COMPONENTS-WORKSPACE-VERIFICATION.md), [delivery evidence](docs/COMPONENTS-WORKSPACE-DELIVERY-2026-11-06.md) and [manual acceptance](docs/RELEASE-ACCEPTANCE.md).
