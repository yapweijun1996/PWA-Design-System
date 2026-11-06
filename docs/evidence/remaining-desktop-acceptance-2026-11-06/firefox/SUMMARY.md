# Remaining Firefox desktop acceptance — 6 November 2026

**Bounded acceptance completed.** Stable Firefox import/export and native zoom supplements passed. Actual text-only enlargement exposed a real floating-control defect; the root-owned production candidate then passed the same14 primary-flow checks plus2 explicit occlusion/legibility regressions. No repository edits, commits or pushes were made by this agent. Deployment and final commit binding remain the root agent's responsibility.

## Source and browser identity

- Hosted baseline: source `48ec0d6cec1db78c86ec5e19d7f0d3412f69dc76`, runtime `1170b641fcdfe7977a19`, `https://yapweijun1996.github.io/PWA-Design-System/`.
- Fixed candidate: `http://127.0.0.1:4195/PWA-Design-System/`, observed runtime **`5e5a75b079fb8b2648f2`**, root-owned uncommitted patch over that baseline. Root supplied `main.ts` SHA256 `5eb8d8ce06ccce06acd71bbfe9a90a5ecfecef02592b9cd44565ee9bda7c157b` and token styles SHA256 `fab896b3b0780083fda76cff8811c50681c8289aa201e41d41f07e4dfb6afa9b`. This agent verified the served runtime and actual compiled CSS behavior, not an invented final commit. See `final-candidate/source-context.json`. Intermediate2ff/16em evidence remains in `candidate-context.json` and `SUMMARY-intermediate-2ff.md`; it is not the final artifact.
- Firefox **Stable159.0.1**, build `20261102144711`, macOS27.0.1 arm64, geckodriver0.37.1, Node24.21.0 native WebSocket. Fresh generated profiles; no owner profile import or Nightly replacement.
- [Official installer](https://archive.mozilla.org/pub/firefox/releases/159.0.1/mac/en-US/Firefox%20159.0.1.dmg) SHA256 `0c214da4439c1eb4cea28a3c141ff112d511aa32c67f9d12e91116569c8d8dda` matches [Mozilla checksums](https://archive.mozilla.org/pub/firefox/releases/159.0.1/SHA256SUMS). `codesign` verifies; Gatekeeper accepted a Notarized Developer ID. No security bypass or dependency added. Vendor evidence: `vendor.json`, `checksum.json`, `codesign.txt`, `gatekeeper.txt`.

## Exact results and boundaries

| Stage | Result | Scope |
| --- | --- | --- |
| Hosted functional import/export |16/16 PASS|Committed baseline preserved through prototype-key,65537-byte and invalid-schema rejection; valid staged import; actual JSON/CSS downloads agree; Cancel/Undo/reset transactions; Commit and reload persistence. Headless actual stable Firefox1440×915/DPR1.|
| Hosted native200% supplement |7/7 PASS|Menu Arrow/Escape, Dialog Tab/Escape/focus restoration, Token Cancel and page fit. Actual720×394/DPR4.|
| Hosted native400% supplement |7/7 PASS|Same missing overlay/Cancel cases. Actual384×210/DPR7.5; not relabeled320px.|
| Hosted text-only200% |14 mechanical assertions passed, but visual acceptance FAILED|Viewport-bounds checks missed floating Back to top over the active input. Contrary hit-test evidence is retained. These14 passes alone did not closeH6.|
| Final local5e5 candidate text-only200% |14/14 primary flows +2/2 targeted regressions PASS|Search/select/edit/Code, Menu/Dialog, invalid feedback/focus, Cancel, Commit/reload; explicit input occlusion and Default/Resolved legibility verification. Actual1440×787/DPR2, bodyfont32px.|

There are44 unique hosted mechanical pass IDs,16 intermediate2ff candidate pass IDs and16 final5e5 candidate pass IDs. They are different source/runtime stages; do not sum them as one current-version suite. The original confirmed product failure and three temporary harness interruptions remain separate evidence. The previous81-case packet is historical and is not re-counted here.

## Actual browser text enlargement

CUA selected native **View→Zoom→Zoom Text Only**, then native Command+plus. The actual browser AX reset-zoom control showed200%. Body computed font doubled16→32px, heading32→64px (height38→75.5px); actual CSS viewport remained1440×787 and DPR2. CSS zoom stayed1 and transformnone. Full page zoom at200% instead measured720×394/DPR4. No CSS font, CSS zoom, page scale or DPR injection was used.

CUA's native menu exposes the named command but omits its checkmark state; a menu screenshot was unavailable. Actual native command selection,200% indicator and font/geometry changes provide the evidence. Native controls were re-applied to the local candidate origin because Firefox stores site zoom separately.

## Confirmed defect and same-scenario retest

Hosted runtime1170 at actual text-only200%,1440×787/DPR2, body32px, scrollY868.45:

- Active override: x1141–1375, y699–787.
- Visible Back to top: x1172.40–1392, y651–739.
- Overlap202.60×40px (8104px²). `elementFromPoint(1273.70,719)` returned `#scroll-to-top` above the active input.

Original evidence: `text200-collision.json/.png`, `text200-invalid.png`. The old `invalid-focus-visible` assertion measured viewport/header bounds only; it did not establish lack of overlay occlusion. `SUMMARY-before-fix.md` preserves the pending-fix state.

Root's final candidate runtime5e5 was tested with the same native text-only200%, same viewport/font and actual invalid alias. Input remained x1141–1375,y699–787; Back to top was hidden/displaynone, its rectangle zero and overlap area zero. Input center hit testing returned the actual focused input. See `final-candidate/text200-fixed-collision.json/.png`, `final-candidate/candidate-regressions.json`. The complete14-flow text scenario was rerun on the candidate, not inferred from the original bounds-only pass.

The actual served named `@container token-inspector (width < 14em)` rule applied: `.token-editor__values` computed grid `234px` (one column), font28px. Default, its value, Resolved and its value each had234px available; scrollWidth did not exceed clientWidth. Their rectangles were all within the787px viewport. See `final-candidate/candidate-token-values.json` and the final fixed collision capture. The intermediate16em candidate was superseded; the final14em rule was independently observed during the fresh native retest. This is observed native text enlargement behavior, not a simulated font-size override.

## Bounded console/network observation

Native Node WebSocket connected using the supported classic `webSocketUrl:true` capability. Subscription acknowledgement for `log.entryAdded`, `network.responseCompleted` and `network.fetchError` preceded the first Studio navigation in each fresh profile. No artificial console events or error suppression were injected.

- Functional observation: `09:58:35.552Z`–`09:58:43.629Z`,38 responseCompleted events:36 HTTPS responses plus2 embedded data-font events. HTTP status200 throughout;0 log.entryAdded events;0 fetch errors.
- Headed native/candidate observation: `10:09:31.524Z`–`10:27:56.842Z`,72 responseCompleted events:41 hosted HTTPS,26 candidate HTTP,5 embedded data-font events. HTTP status200 throughout;0 log.entryAdded events;0 fetch errors.
- Final fresh-profile candidate observation: `10:32:31.288Z`–`10:34:20.338Z`,30 responseCompleted events:28 candidate HTTP and2 embedded data-font events. All HTTP200,0 log events,0 fetch errors; subscribed before first candidate navigation. Raw sources in `final-candidate/report.json` and `final-candidate/bidi-events.jsonl`.
- Exact raw sources: `functional/bidi-events.jsonl`, `functional/report.json`, root `bidi-events.jsonl`, root `report.json`. The headed report contains explicit hosted/candidate source segments. These are bounded completed-response observations, not proof about unfinished requests, post-window traffic, all browser internals or a full network/security audit.

Supported method: [MDN BiDi connection](https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection), [webSocketUrl](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/Capabilities/webSocketUrl), [W3C BiDi events](https://www.w3.org/TR/2026/WD-webdriver-bidi-20261103/). Native text mode: [Mozilla text and zoom help](https://support.mozilla.org/en-US/kb/font-size-and-zoom-increase-size-of-web-pages).

## Preserved unsuccessful attempts

1. Functional attempt1 searched all page text for “Loading”, wrongly matching the legitimate component Loading state. Heading readiness corrected; affected functional flow then16/16. `functional-attempt1/` retains original report/events.
2. Text attempt1 retained the “button” filter before selecting Menu, so Menu was correctly absent. Attempt2's WebDriver clear/empty-send did not emit the search input transition. Actual Space/Backspace keystrokes corrected the harness; same text flow reran. Both `text200-attempt1.json` and `text200-attempt2.json` and logs remain.
3. The product occlusion above was a separate real failure, not dismissed as a harness issue. Candidate retest includes explicit intersection/hit-test checks and screenshot evidence.

## Commands, restoration and recommended closures

```sh
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
FINAL_HEADLESS=1 node run.mjs
FINAL_NATIVE_ONLY=1 node run.mjs
python3 native.py zoom200
python3 native.py zoom400
python3 native.py baseline
python3 native.py text200
python3 repro-collision.py repro
FINAL_NATIVE_ONLY=1 FINAL_OUTPUT_DIR='/tmp/pwa-final-acceptance/firefox/final-candidate' FINAL_TARGET_URL='http://127.0.0.1:4195/PWA-Design-System/' FINAL_EXPECTED_RUNTIME='5e5a75b079fb8b2648f2' node run.mjs
PWA_EVIDENCE_DIR='/tmp/pwa-final-acceptance/firefox/final-candidate' PWA_TEST_URL='http://127.0.0.1:4195/PWA-Design-System/' PWA_EXPECTED_RUNTIME='5e5a75b079fb8b2648f2' python3 native.py text200-final
PWA_EVIDENCE_DIR='/tmp/pwa-final-acceptance/firefox/final-candidate' python3 repro-collision.py fixed
PWA_EVIDENCE_DIR='/tmp/pwa-final-acceptance/firefox/final-candidate' python3 probe-values.py values
PWA_EVIDENCE_DIR='/tmp/pwa-final-acceptance/firefox/final-candidate' python3 candidate-finalize.py finalize
```

Normal scroll-to-center precedes real WebDriver clicks; interactability checks were not bypassed. All scripts/evidence stay in this temporary task directory.

Native text-only mode was toggled off through the same menu. Local and hosted origins were restored to100%, body16px,1440×787/DPR2; reset-zoom indicator was absent. See `candidate-restored100.json`, `hosted-restored100.json`; earlier `restored-page-mode110.json` proves the normal page-zoom mode probe. All functional/native/final-candidate WebDriver sessions were explicitly closed and own geckodriver processes stopped. Final candidate restoration is also recorded in `final-candidate/restored100.json`. No owner profile or repository was changed by this agent.

B3 now has missing stable Firefox import/export and real bounded log/network evidence. H1/H2 now have missing representative native overlay/Cancel evidence, supplementing prior source-identical runtime primary flows. H6 has actual text-enlargement proof and a passing fixed production candidate retest; root must bind the final commit/artifact and perform normal release checks before calling it delivered. No exhaustive zoom×theme×density matrix is implied. Physical iPhone/iPad/Android, human VoiceOver/NVDA interpretation, independent human visual signoff, Firefox installation/offline/update and minimum supported browser versions remain outside this run or NOT VERIFIED.
