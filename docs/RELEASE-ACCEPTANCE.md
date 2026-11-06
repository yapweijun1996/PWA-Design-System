# Release acceptance evidence and owner checklist

Recorded on 5 November 2026. Automated checks and agent-operated browser evidence do not substitute for manual assistive-technology, physical-device or independent human approval. An unavailable check is **NOT VERIFIED**, not an observed application failure.

## Remaining-task matrix

| Task | Status | Evidence or missing prerequisite |
| --- | --- | --- |
| T4 Manual screen reader | **NOT VERIFIED** | No human VoiceOver/NVDA session or interpreted assistive-technology output was supplied. Complete the checklist below. |
| T5 Physical devices and installation | **NOT VERIFIED** | Desktop viewport emulation is available; actual phone/iPad hardware, iOS home-screen installation and OS launch behavior were not accessed. |
| T6 Independent human visual approval | **NOT VERIFIED** | Coding-agent screenshots/model reviews are evidence, not independent human acceptance. An owner/designer must record a decision. |
| T7 Performance measurement | Lab measurement complete; field data **NOT VERIFIED** | Lighthouse 13.6.0 measured baseline Components and candidate production Components/Tokens; details below. Field Core Web Vitals remain **NOT VERIFIED**. |
| T8 Firefox / real Safari | Partial | Installed Firefox Nightly final-corrected-source smoke passed 10/10 via geckodriver at `175c2d253a668f632bccef632a2b971bfe7f789b`; targeted Playwright WebKit passed 46/46 on the same source. Actual Safari WebDriver remains blocked by its existing Remote Automation setting. |

## Available browser environment

- macOS 27.0.1; installed Google Chrome 156, Firefox Nightly 160.0a1 and Safari 27.0.1.
- geckodriver 0.37.1 can launch a fresh headless Firefox Nightly session. This is actual installed Firefox, not Chromium emulation.
- The cached Playwright Firefox build failed to launch with `Could not find profile folder`, including a bounded retry with a different temporary directory. This is a harness limitation; no application compatibility conclusion follows from it.
- `safaridriver` reported `Included with Safari 27.0.1 (22625.1.29.11.28)`. Creating a session returned `session not created`: the owner must enable **Allow remote automation** in Safari's Developer settings. No browser/security preference was changed. Real Safari remains **NOT VERIFIED**. Playwright WebKit results, if recorded elsewhere, are a separate engine check.

## Firefox baseline browser evidence

On the preceding hosted build `34d9c458c7422cf21e2a`, an isolated headless installed Firefox Nightly 160.0a1 session passed **8/8** critical smoke assertions: 21-family inventory; component search/Dialog Escape; preview/code label parity; local preview theme independence; Components mobile document width; copy control presence after scrolling; token commit/reload persistence; Tokens mobile document width. The browser window was requested at 1440×900 and then 390×844; the baseline did not record the actual clamped inner viewport. Do not treat this as a verified 390px Firefox viewport. This is a bounded WebDriver journey, not the complete Playwright suite, stable-Firefox certification, or a physical-device test. Initial harness failures selected a hidden dialog child or reused search state; selectors/navigation were corrected and the same intended scenarios passed. No source behavior was changed to accommodate the harness.

## Candidate Firefox browser evidence

On frozen source `6968e399962fa2f7c12801c6412e1efdc43d4b7c`, actual installed headless Firefox Nightly 160.0a1 with geckodriver 0.37.1 passed **10/10** smoke assertions against an isolated localhost server on port 4193. The eight baseline assertions were repeated; two additional checks exercised the new mobile Choose component flow: selection closed the catalog and focused the detail heading, and reopening then pressing Escape closed the catalog and restored toggle focus. No source changes were made by QA. The geometry probe showed the headless browser clamped the requested 390×844 window to **outer 500×844 / inner 500×759** at device scale 1. The narrow-layout checks therefore cover 500 CSS pixels, not a verified 390px Firefox viewport or a physical device. Firefox-internal sandbox/Remote Settings warnings appeared in driver stderr; this journey does not claim a clean browser console. JSON and screenshot evidence were retained outside the repository. This does not claim stable Firefox or full-suite coverage.

## Corrected-source Firefox and WebKit acceptance

After the candidate review fixes, QA repeated the installed Firefox Nightly journey against frozen source `175c2d253a668f632bccef632a2b971bfe7f789b`: **10/10 passed**. The final measured narrow geometry again was inner **500×759**, outer **500×844**, device scale 1. The same bounds and limitations above apply; this is not a full Firefox suite or a verified 390px Firefox viewport.

On the same frozen source and QA-owned localhost port 4193, Playwright WebKit passed **46/46** tests in 27.1 seconds using one worker across `components-usability`, `playground`, `token-discovery`, `token-editor-workspace` and `token-editor` specs. This covers existing component configuration/code parity, copy-error feedback, new mobile picker/resize focus behavior, compact Token rows/reference browsing, transactional editing/imports, stale-read guards and scoped axe checks. The Chromium-only native accessibility-tree assertion is conditional and was not exercised by WebKit. WebKit is separate engine evidence, not real Safari or iOS standalone validation. No source/tests were edited by QA and no assertion/timeout was weakened.

The final hosted Lighthouse rerun is pending deployment; the earlier candidate measurements below retain their original source/build identity and must not be relabeled as measurements of these corrected sources.

## Baseline Lighthouse lab measurement

The manager approved an ephemeral pinned CLI download; repository dependencies and lockfile were not changed. The baseline measured the hosted Components route before this amendment, at Studio build `34d9c458c7422cf21e2a` (preceding source `fe5b6f0`).

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx --yes lighthouse@13.6.0 \
  'https://yapweijun1996.github.io/PWA-Design-System/#components' \
  --only-categories=performance,accessibility \
  --chrome-flags='--headless=new' \
  --output=json --output=html --output-path=/tmp/pwa-release-qa/baseline-components
```

| Sample | Performance | Automated accessibility | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hosted baseline, 2026-11-05 10:05:52 UTC | 99 | 100 | 1,192 ms | 1,394 ms | 2 ms | 0.00515 | 2,862 ms |

Lighthouse 13.6.0 used headless Chrome 156, mobile emulation at 412×823 / device scale 1.75, simulated throttling (150ms RTT, 1638.4Kbps throughput and 4× CPU slowdown), with storage reset. There were no run warnings or audit errors. JSON/HTML evidence was retained outside the repository during review.

This is one baseline lab sample, not an improvement claim or a release performance budget. Scores vary with environment; report the metrics and conditions together. A Lighthouse accessibility score of 100 does not establish WCAG conformance. Lighthouse navigation does not measure all user interactions or field INP. Google distinguishes [lab and field data](https://web.dev/articles/lab-and-field-data-differences), and explains [performance score variability](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring). Field Core Web Vitals require real-user evidence; no telemetry backend was added.

## Candidate production Lighthouse lab measurement

Frozen feature source `6968e399962fa2f7c12801c6412e1efdc43d4b7c` was built by the manager, yielding Studio build `a136e87db3344bcef522`. QA served the production output with Vite preview on isolated localhost port 4196 and ran the same pinned Lighthouse command sequentially for `#components` and `#design-tokens` (substitute the localhost URL and final report paths). Both runs used the same mobile/CPU/network simulation settings described above, with storage reset; both had no run warnings or audit errors.

| Final production route / UTC time | Performance | Automated accessibility | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Components / 2026-11-05 10:15:14 | 100 | 100 | 1,017 ms | 1,717 ms | 59 ms | 0 | 1,017 ms |
| Design Tokens / 2026-11-05 10:15:43 | 97 | 100 | 1,001 ms | 1,748 ms | 185 ms | 0.01551 | 1,001 ms |

The baseline ran against hosted HTTPS, while these candidate samples ran against localhost; system load and browser benchmark conditions can also vary. Therefore these numbers **are not an apples-to-apples before/after improvement claim**. They establish that the measured candidate routes were measured, with retained JSON/HTML reports, rather than establishing real-user Core Web Vitals or complete accessibility. No performance threshold was weakened and no new runtime dependency or telemetry service was added. T7's lab-measurement work is complete; field performance remains **NOT VERIFIED**.

## Manual screen-reader acceptance

The tester records browser/OS/assistive-technology versions, build version, date, findings, and pass/fail for each flow:

1. Reach Skip to Content and navigate page headings/landmarks. Confirm current sidebar destination is understandable.
2. Search/select a component using the keyboard; identify its preview, supported properties, code and copy result without relying on visual position.
3. Open Dialog/Menu, check announcements and focus containment, dismiss with Escape and verify focus restoration.
4. In Tokens, distinguish Editing scope from Preview theme and Default/Resolved/Override. Change a value, inspect unsaved count/diff, undo and cancel.
5. Enter an invalid alias and a contrast failure. Confirm the error is understandable and stays associated with the field after Copy, rejected Import and blocked navigation.
6. Import a valid configuration, preview it and commit; verify success announcements, persisted value and error recovery. Confirm hidden mobile panels do not appear in the reading order.

Record unresolved release blockers and retest the same scenarios after correction. Do not mark this checklist passed from axe or DOM inspection alone.

## Physical-device, installation and human visual acceptance

On at least one actual iPhone/iPad and one actual Android phone, record model, OS/browser, app build and installation state. Check portrait/landscape, expanded navigation, keyboard open/closed, top/middle/bottom scrolling, selected controls, dark mode and text enlargement. Install the PWA using the platform flow; fully close and relaunch it, then check offline editing/reload and the protected update flow with saved and unsaved work. A desktop browser's private context cannot establish OS installation.

An independent human reviewer should inspect the accepted desktop/tablet/mobile screenshots and actual primary tasks in light/dark and compact/comfortable modes. Record reviewer, date, accepted scope and remaining issues. Acceptance fields intentionally remain empty until evidence exists:

- Assistive-technology tester / date / build / evidence:
- Physical-device tester / devices / build / evidence:
- Independent visual reviewer / decision / evidence:
- Real Safari tester / version / build / evidence:

Subsequent review corrected a CSS-before-resize focus race and native accessibility description/name gaps. The measurements above retain their exact original source/build identity; they do not claim to measure later revisions. Latest CI and hosted checks are recorded in the delivery PR.

## Hosted follow-up completed

The feature was subsequently merged and deployed as build `2770362a08cd6927577f`. Hosted Lighthouse and actual Firefox checks were completed on that build. See [hosted QA](HOSTED-QA-2026-11-05.md) and [delivery evidence](STUDIO-DELIVERY-2026-11-05.md) for final results, exact source/CI/Pages identities and remaining owner-only acceptance. Earlier measurements retain their original source identities.


## Unified workspace follow-up — 6 November 2026

Product releaseB is source `3163663ce123b4c91abe79879f60972a107dc803`, hosted build `1170b641fcdfe7977a19`. See the [complete delivery record](UNIFIED-STUDIO-DELIVERY-2026-11-06.md) for 324 CI cases,39 WebKit cases,24 independent Chrome layout journeys,18 final hosted journeys and real old→A→B guarded/offline update evidence. These replace no historical results above; each retains its own source identity.

Actual native Safari 27.0.1 (22625.1.29.11.28) was additionally exercised through the existing Computer Use surface without enabling Remote Automation. Narrow/wide panels, property→preview→code parity, native 200% reflow, invalid-token Commit blocking and Cancel restoration passed.100% zoom was restored and the task tab closed. Exact per-tab build metadata/viewport were not captured during the rollout, and Safari console/network/offline/install/full-suite results remain NOT VERIFIED. This is bounded native Safari evidence, separate from Playwright WebKit 27.2.

Physical iOS/Android installation/standalone/safe-area/keyboard/rotation, manual VoiceOver/NVDA, actual 400% zoom, independent human visual approval and field Core Web Vitals remain NOT VERIFIED. Do not mark those acceptance rows complete based on these agent/automated observations.
