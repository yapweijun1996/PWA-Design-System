# Components workspace v2 — independent verification

This record covers the approved Explorer / Live Preview / Properties workspace and its responsive alternatives. Checks were performed on 6 November 2026 against the feature branch based on `0237373f5711e3a9dcdebdc61ee45a51a88e9055`.

Final independently checked playground source SHA-256:

- `index.ts`: `9875298a57bceae8c42d4572e12634537cc60574bd00e51ddbc283fd5502a7a1`
- `playground.css`: `27b6072a00dd923eb76d6447ca9081249ef02a92bb142e257b6ea4e7152aa16b`

An agent-operated browser check is not human accessibility, physical-device, or production-release certification. Final release commit, hosted artifact provenance and deployment verification belong to the release report.

## Results

| Check | Independent result |
| --- | --- |
| WebKit workspace Playwright suite | **10/10 passed**, 10.5s; five viewport cases, two focus/resize regressions, three dark accessibility cases. |
| Installed Chrome 157.0.8103.38 and Playwright WebKit 27.2 | **2/2 additional browser journeys passed**: native Dialog/Menu open, keyboard dismissal and focus restoration; hidden mobile panel exclusion; dark axe; mobile top/middle/bottom; active Inspector editing and retained focus/value after resize. No page JavaScript errors. |
| Desktop/tablet/phone geometry | Chrome and WebKit measured 1920, 1440, 768, 390 and 320px. No document horizontal overflow. Three desktop columns visible; tablet 768px keeps Preview and Inspector while Explorer collapses; phone panels are exclusive. |
| Explorer | 21 real families; category counts 6 Foundation, 7 Forms, 4 Navigation, 3 Feedback and 1 Data. Forms filtering, combined search, empty result, clearing and selection were exercised. |
| Canvas and configuration | Actual canvas widths 390/768/1440px measured. Oversized canvas scrolls inside its bounded region; Fit uses available width. Browser media queries and portaled overlays remain on the Studio viewport, explicitly disclosed in “About canvas sizing.” Edited label/variant, rendered component and generated code agree. |
| Clipboard | Chrome and WebKit real clipboard action reported “Code copied.” during the geometry/configuration journey. The Playwright suite additionally verifies the success path with a controlled clipboard implementation. |
| Dark selected foreground | Corrected computed text `#93c5fd` against `#1e293b`: approximately **8.11:1**. Zero axe violations in the final additional dark journeys and the three WebKit dark workspace cases. |
| Firefox Nightly 160.0a1 | Actual Firefox through geckodriver 0.37.1; final geometry checked separately. Requested narrow window clamps to 500px: this is **not** a 390px Firefox result. |
| Source-author evidence | Separately reported 24/24 Chrome Components cases before the contrast correction, 3/3 added dark cases after it, 17/17 playground unit cases including 96 theme combinations, 9/9 shell cases and 4/4 actual-update PWA cases. These counts are not added to the independent 10-test count. |
| Production release | Merge, deployed artifact/source identity, hosted subpath behavior and live PWA verification remain owned by the release manager. This document alone does not claim deployment success. |

## Findings and recovery

| ID | Severity | Confirmed evidence and user impact | Verified resolution |
| --- | --- | --- | --- |
| C-01 | P1 | Open Explorer at 390px, resize to desktop, edit Inspector, return to 390px. A stale Explorer-open flag hid the focused Inspector and dropped focus to the document body. The edited value survived, but keyboard context was lost. | Entering phone layout now reconciles the visible panel with the focused descendant. The added Playwright regression and independent Chrome/WebKit journeys retain visible input, focus and edited value. |
| C-02 | P1 | Actual dark theme selected text `#1d4ed8` on `#1e293b` measured **2.18:1**. axe 4.14 reported serious `color-contrast` failures for the Preview tab and active phone panel in both Chrome and WebKit. The shared style also affected active categories, catalog and quick options. | Active text now uses the theme-aware semantic link token; indicator borders use the focus token. Final measured foreground is 8.11:1. Dark cases cover Explorer-active and Preview-active states at 390/768/1440px. |

The tablet policy was clarified during implementation: phone below 700px, tablet 700–1000px, desktop above 1000px. Breakpoint generation and tests were updated to preserve that policy.

## Before and after evidence

Baseline hosted build: `2770362a08cd6927577f`.

- At 1920 × 1080, baseline main was 1320px wide at x=425; amended Components main spans the available 1670px at x=250. Other documentation routes retain their reading width.
- Pointer route navigation focused baseline `main` without an outline; keyboard route navigation produced a blue 2px outline around `main`. Shell author verification now targets the page heading and retains visible keyboard focus and Skip to Content.
- Baseline 390 × 844 Properties began at y=497 after the catalog reached its closed state. Amended phone navigation switches Explorer / Preview / Properties without discarding edits.
- Screenshots were visually inspected for desktop 1920/1440, tablet 768, phone 390, corrected dark active states and the active Inspector input. Compact foundation previews are centered; wide enterprise previews retain natural layout.

Local QA artifacts under `/tmp/components-v2-qa/` include:

- `baseline-desktop.png`, `baseline-keyboard.png`, `baseline-mobile.png`, `baseline.json`.
- `after-chrome-{1920,1440,768,390,320}-top.png` and equivalent WebKit captures.
- `after-{chrome,webkit}-mobile-{top,middle,bottom,input,dark}.png`.
- `verification.json`, `journeys.json`, `webkit-tests.json`, `firefox.json` and Firefox screenshots with **requested**, not assumed, viewport sizes in their names.
- `dark-contrast-before.json` preserves the failed contrast evidence; `edge-focus.png` records C-01 before its correction.

These temporary local files are QA evidence, not permanent hosted links or release assets. A harness context setup issue and an immediate-resize synchronization issue were corrected before final measurements; neither was reported as a product defect.

## Evidence boundaries

Only the Explorer list is a bounded vertical catalog scroller; page documentation follows document scrolling. Canvas/code scrolling is intentional. Top, middle, bottom, hidden panels, Escape dismissal and active inputs were exercised rather than checking only initial screenshots.

Canvas width presets do not emulate browser device media queries or an operating system. Playwright WebKit is distinct from actual Safari. Safari Remote Automation was not enabled or changed. Actual Safari, manual screen-reader interpretation, independent human visual approval, physical-device installation, OS-level keyboard behavior and actual browser zoom remain **NOT VERIFIED** by this QA. Narrow CSS viewport checks do not prove those capabilities. Automated axe results do not establish WCAG conformance.

The compact update change preserves existing draft/import/other-tab checks and manual reload policy; source review and the shell author's actual-update suite support that statement. This independent workspace run does not claim a second complete service-worker upgrade certification. Existing core APIs, 21 component contracts and token resolution were preserved; broader static, unit, production, PWA and release gates are recorded separately by the release manager.

## Reviewed Linux visual candidates

Release-manager visual review used capture run [42164854770](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42164854770), source `45754aae6a48bffb1cbc041706def57278e4053c`: **17/17 capture scenarios passed**. The recorded Ubuntu 24.04 / Playwright 1.64.1 / Chromium 156.0.8078.4 environment and font digest match the existing reviewed environment exactly.

Seven intended Components screenshots changed and one phone Properties screenshot was added. Each of these eight PNGs was individually inspected: disabled Button, open Menu, open Dialog, desktop workspace, dark tablet workspace, phone Preview, phone Explorer and phone Properties. Nine Theme Builder / Token Editor screenshots were byte-identical to their existing baselines. The changes show the intended workspace, controls, focused search, native overlays and corrected dark text without document overflow. This is an agent visual review; independent human visual approval remains NOT VERIFIED.

Only those eight PNGs were adopted. The temporary candidate-capture CI job was removed after review. The required visual job, exact environment comparison and `maxDiffPixelRatio: 0.001` threshold remain unchanged; passing capture does not replace the subsequent strict comparison gate.
