# Release acceptance evidence and owner checklist

Recorded on 5 November 2026. Automated checks and agent-operated browser evidence do not substitute for manual assistive-technology, physical-device or independent human approval. An unavailable check is **NOT VERIFIED**, not an observed application failure.

## Current-version acceptance matrix

Prepared on 6 November 2026 for the acceptance round starting at merge `40459855467830a988cb6bcf148e7ae4af21c8ce`. This matrix is separate from the historical results below. Record the tested candidate's actual SHA and runtime build in every result; do not assume a prior hosted build identifies a current tab. Current execution is recorded in [desktop acceptance](DESKTOP-ACCEPTANCE-2026-11-06.md); completed observations below are scoped separately from missing evidence.

Allowed result statuses: **PASS**, **FAIL**, **NOT VERIFIED**, or **N/A** with a concrete applicability reason. Missing hardware, human reviewers, browser versions or permissions means NOT VERIFIED, not N/A or an application failure. PASS covers only the stated case/environment. A failed required case needs a finding and same-scenario retest after correction. AI reviews and automated accessibility trees cannot establish human interpretation or physical installation.

| Case | Required evidence / relationship to task.md | Current result | Prerequisite or scope |
| --- | --- | --- | --- |
| B1 | Stable Chrome, actual native Safari and stable Firefox desktop primary flows; PWA-07-B1–B3 | PASS for recorded Chrome scope; full three-browser case NOT VERIFIED | Chrome 19 hosted + 3 overlay/offline journeys and 22 local source tests; stable Firefox 81 unique atomic checks passed within bounded scope. Full Firefox import/network and fresh complete native Safari evidence remain missing; see desktop record. |
| B2 | Desktop responsive/keyboard/axe at measured CSS widths 320/390/768/1280/1440/1920, Light/Dark and comfortable/compact | PASS for 48 Chrome journeys/48 pre-edit scoped axe scans and 22 local keyboard/layout tests | Twelve additional actual DOM geometry probes; desktop emulation only. Full OS System appearance/text-enlargement acceptance remains NOT VERIFIED. |
| Z1 | Real browser 200% and 400% zoom plus text enlargement; PWA-07-H1–H2/H6 | Bounded Firefox native 200%/400% flows PASS; full case NOT VERIFIED | Native indicators and actual720×394 /384×210 recorded. Each focused run6/6; native200 overlays, all-combination matrix and actual text enlargement remain missing. |
| R1 | Independent AI code/browser/visual review | PASS within recorded review scope | Source/Chrome records, selected screenshots and final Firefox/zoom follow-up reviewed; no confirmed P0/P1 product defect. Cannot close H1/H2 or physical cases. |
| D1 | iPhone, iPad and Android browser + installed launch/theme | NOT VERIFIED | No actual devices are currently supplied |
| D2 | Physical safe areas, touch, scrolling and orientation; PWA-01-S1–S2 | NOT VERIFIED | Actual iPhone/iPad/Android, both browser and installed modes |
| D3 | Physical keyboard, focused-field visibility and rotation; PWA-01-K1–K3 | NOT VERIFIED | Actual devices; iPad tablet window/split view and hardware keyboard when available |
| D4 | Physical offline relaunch and committed local editing | NOT VERIFIED | Actual devices with completed online cache; record offline method |
| D5 | Real version N→N+1 update, guards and committed-state preservation | NOT VERIFIED | Controlled real versions and actual devices; do not publish an unreviewed build just to create an update |
| H1 | Human VoiceOver and human NVDA interpretation; PWA-07-H3–H4 | NOT VERIFIED | Human testers and actual AT sessions not arranged |
| H2 | Independent human visual decision; PWA-07-H5 | NOT VERIFIED | AI review requested; independent human signoff not supplied |
| E1 | Completed evidence and findings/retests; PWA-07-E1–E3 | Desktop records attached; aggregate NOT VERIFIED | Current Chrome/AI evidence and the initial unit timeout/retest are recorded. Required physical/human execution records are absent; templates do not close E2/E3. |

### Evidence record template

Create one record per case/environment/mode; link only evidence that exists. Record partial scope explicitly and leave unexecuted assertions NOT VERIFIED. Do not commit private profile or customer data. Keep captures and observations tied to the same source/runtime identity.

```text
Case / result (PASS | FAIL | NOT VERIFIED | N/A + reason):
Source SHA / candidate branch / runtime build observed in this tab:
URL / route / deployment or local artifact source path:
Date/time with timezone / tester name or agent / tester kind (automated | AI | human):
Physical device model or desktop emulation / OS version:
Browser exact version and channel / installed or browser mode / AT version:
Actual CSS viewport (innerWidth × innerHeight) / native browser zoom / OS text size:
Theme preference + resolved theme / density / orientation / keyboard state:
Preconditions and exact steps:
Expected result / observed result:
Evidence source paths (screenshots, recording, console/network logs, test report):
Console and network observation method, time span and scope / unobserved areas:
Finding ID / severity / user impact / owner / fix SHA:
Same-scenario retest date / tested SHA + runtime build / result / evidence:
Remaining limitation or missing prerequisite:
```

A screenshot can support visual observations; it cannot by itself prove keyboard order, screen-reader interpretation, offline networking or an upgrade. For unavailable Safari console/network capture, state the specific gap instead of reporting clean logs. Do not change browser automation/security preferences to obtain access without authorization.

### Desktop and independent-review execution packet

| Case | Exact steps | Expected result |
| --- | --- | --- |
| B1 | In a dedicated synthetic-data profile, record per-tab build identity and measured viewport. Open Overview, Components, Tokens, Layout, Theme, Accessibility, Agent Rules, Documentation and Settings. Search/select Button and Dialog; change supported properties and inspect matching Code; open/close Dialog and Menu. In Tokens edit, undo, cancel, commit/reload; reject invalid import; preview and commit a valid bounded configuration. Repeat in each named browser. Observe console/network for these journeys and record the method/scope. | Pages load under the repository subpath; configuration/code agree; focus returns after overlays; invalid input/import cannot replace committed state; saved changes survive reload; no reproduced application error within the observed log scope. |
| B2 | Repeat Components/Tokens at each matrix width and theme/density pair; record actual viewport rather than requested window size. Keyboard through skip link, navigation, Explorer, Canvas tabs, Inspector, non-drag resize controls and overlays. Check top/middle/bottom, hidden panels and deliberate local scrolling; run scoped axe. Select System and change OS preference separately. | No unintended document overflow; usable responsive panels and reachable controls; logical focus, visible indicator, working Escape/restoration, hidden panels absent from interaction order; scoped axe findings recorded, not converted to full WCAG certification. |
| Z1 | At normal browser zoom record source/build and actual viewport. Set 200% using the browser's native menu; record displayed zoom and actual CSS viewport. Complete search/select/edit/Code/Token commit/cancel and overlay operations. Repeat at native 400%, then OS/browser text enlargement where supported. Restore starting settings. | Text and controls reflow and remain operable with visible focus/actions; no clipped required content or unintended horizontal page scrolling. Any necessary two-dimensional preview scrolling is identified separately. A 320px viewport alone is not zoom evidence. |
| R1 | An independent AI reviewer inspects actual source, current screenshots and recorded journeys for layout, keyboard, states, token/component parity, import/update safety and evidence boundaries. Record findings, severity, paths and verification; retest confirmed defects. | Review is grounded in available evidence and explicitly labeled AI; unresolved manual/device gaps remain visible and no human approval is inferred. |

### Physical-device execution packet

Run D1–D5 independently on **an actual iPhone with Safari**, **an actual iPad with Safari**, and **an actual Android phone with stable Chrome**. Record a separate browser and installed-mode result for each device. iPhone evidence does not close iPad acceptance. Use synthetic local configuration, record initial saved state and avoid clearing personal profiles. Device access is currently unavailable; these are instructions, not performed tests.

| Case | Exact steps | Expected result |
| --- | --- | --- |
| D1 | Online, open the candidate repository-subpath URL and record SHA/runtime. Visit offline-supported tools to finish caching. Install using Safari Add to Home Screen or Chrome's available install flow. Fully close and cold-launch from the OS icon; background/return for warm launch. In browser and installed mode select Light, Dark, then System and change OS appearance. Repeat on iPad in full-screen and supported split/window sizes. | Correct app name/icon/scope and standalone presentation where supported; cold/warm launches work; saved appearance persists; shell/status icons remain readable without incorrect-theme flash. Record actual OS status-bar behavior, not metadata assumptions. |
| D2 | In browser and installed portrait/landscape, visit top/middle/bottom of Documentation and the Components/Tokens workspace. Open sidebar/mobile panels, Dialog, Menu and a genuine waiting-update notice when available. Touch primary controls; inspect notch, status area and home indicator. On iPad resize the app window/split view. Measure document overflow separately from intentional Canvas/code/table scrollers. | Important content and controls avoid system occlusion, remain touch-operable and do not cause unintended document horizontal overflow; scroll owners stay predictable. A missing genuine update notice is NOT VERIFIED for that substep. |
| D3 | On Components focus Label/search; on Tokens focus selected Override/search at top and after scrolling. Open the virtual keyboard, type, rotate while focused, dismiss the keyboard and rotate back. Reach Undo/Cancel/Commit and navigation. Repeat browser/installed and iPad window modes; test hardware Tab/Shift+Tab/Escape if a keyboard is supplied. Record focus zoom behavior without disabling zoom. | Active field and actions remain reachable, focus is not hidden behind keyboard/system UI, draft text and selected object survive rotation, scrolling recovers after dismissal. Unavailable hardware-keyboard coverage stays NOT VERIFIED. |
| D4 | Commit a distinct valid token override and appearance; record the saved values. With caching complete, disable network using the device's real controls and document the method. Fully close/relaunch installed app; reload browser mode. Open previously cached Documentation, Components Code, Tokens and theme preview; make/commit a local edit and relaunch. Restore network. | Cached shell/tools and saved local configuration remain useful; edits persist; offline hint is understandable; recovery is nondisruptive. First-ever uncached offline access is not promised. Confirm offline via the recorded network condition, not a screenshot alone. |
| D5 | Start real version N and record its runtime and saved configuration. Make a valid draft, then invalid draft, and separately stage a valid import. Make reviewed N+1 available using the normal controlled release/test process; observe the genuine waiting worker. Try preparation during each unsafe state, then resolve it. Open another N tab and test the other-tab guard; close it. Prepare once safely, observe progress until actual activation, then choose explicit Reload now and verify N+1 runtime. Repeat offline reload and compare committed values. Record timeout/retry or unresponsive-client subcases only if safely exercised. | Draft/import/other-tab guards explain and block unsafe updates; no automatic refresh or lost work; duplicate preparation prevented; readiness reflects activation, explicit reload reaches N+1; saved configuration survives and offline tools work. Missing failure-path exercises remain NOT VERIFIED. |

### Human interpretation and signoff packet

| Case | Exact steps | Expected result |
| --- | --- | --- |
| H1 | A human tester uses actual VoiceOver, then a human tester uses NVDA with recorded OS/browser/AT versions. Run the six manual screen-reader flows in the historical checklist below against the current candidate: landmarks/skip/navigation; component selection/properties/Code/copy; Dialog/Menu; scope/default/resolved/override and draft actions; invalid alias/contrast/import; valid import/commit/persistence. Include hidden mobile panels and dynamic status/error announcements. Record what the tester heard/interpreted, task success and focus recovery; retest findings. | Names, states, errors and live feedback are understandable; reading/focus order supports each task; hidden panels are absent; overlays and recovery remain operable. AX-tree or axe-only output is supplementary, not a human interpretation pass. |
| H2 | An independent human reviewer executes primary Components/Tokens tasks and inspects current desktop/tablet/mobile captures in Light/Dark and comfortable/compact, including empty/error/loading/selected states. Judge hierarchy, density, scrolling and editing clarity. Record accepted scope, explicit decision, findings and retests. | A named human records an evidence-based decision. AI visual review remains separate; unresolved release-blocking findings prevent acceptance. |

## Historical source-specific evidence

The following dated records retain their original source/build and environment. Their counts, partial statuses and browser versions are historical observations, not new results for the current matrix. In particular, the 324-case CI baseline below must not be counted again as current-round execution.

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
