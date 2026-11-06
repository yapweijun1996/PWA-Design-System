# Unified Studio: independent 13-perspective review

Date: 6 November 2026. Baseline `4b1b745`; final product checkpoint `24e308a` (`67f0f53` changes temporary CI capture only). Three independent read-only review agents covered five architecture/developer perspectives, five design/interaction perspectives, and three accessibility/quality/enterprise perspectives. These are agent reviews, not thirteen human reviewers or a WCAG certification.

Reviewers inspected actual source, regression tests and final production screenshots. The parent independently ran Chrome157.0.8103.38 against build `5100ff209bb8678d4cd8`: 24 route/width/theme journeys across Design Tokens and Components, at 320/390/768/1280/1440/1920px in light/dark, with no document overflow, page/console errors or failed resources. Reviewer statements about those interactions are attributed to this run; reviewers separately inspected the resulting images. No heuristic scores were invented.

## Findings and recovery

| Finding | Severity | User impact | Fix | Verification |
| --- | --- | --- | --- | --- |
| Tablet token values broke into vertical character stacks | P1, resolved | Values were difficult to compare | Readable minimum table/value widths and deliberate table-local horizontal scrolling | Actual768px images; dedicated geometry test; final light/dark images |
| Update notice scrolled out of view | P1, resolved | A waiting update became visually undiscoverable during editing | Measured sticky system notice stack; reveal Documentation header while a notice is visible | Real waiting worker, deep-scroll bounds without locator auto-scroll; PWA suite |
| Newly entered pane width was ignored at the start of a drag | P2, resolved | Resize jumped to the previous width | Focus/commit the number input before recording drag origin | Actual230px input followed immediately by2px drag; regression expects232px |
| Token table header could paint over the app bar in a300px-high window | P2, resolved | Header controls could be obstructed | Isolate the table stacking context | Real overlapping geometry and elementFromPoint; Studio theme remains operable |
| Phone outer Preview panel also contained Code | P2, resolved | Panel and content-view naming was ambiguous | Name the outer panel Canvas; retain inner Preview tab | Actual390px Code image and panel tests |
| New readability test used an obsolete exact header name | P2, resolved, test-only | Regression gate would fail before validating layout | Match actual Override status heading | Focused9-case Token layout run, followed by full132-case Studio run |
| Categories wrapped its last letter at320px | P2, resolved | Small-screen panel navigation looked fragmented | Semantic small text token, no-wrap panel labels, retained44px comfortable targets | Actual320px image and panel-size/overflow assertions |

## Perspective results

| Perspective | Evidence and finding | Recommendation / verification |
| --- | --- | --- |
| Product Designer | Shared workspace and adjacent draft actions; tablet readability finding above | Fixed; preserve selection→edit→preview workflow |
| UX Researcher | Filters retain drafts; Code and examples have explicit ownership | Keep independent demonstrations distinct; final phone/desktop images reviewed |
| UI Designer | Shared pane surfaces and semantic selected/focus styles;320px label finding | Fixed; final light/dark images reviewed |
| Design System Architect | Both features use createWorkspace; core factories and token resolver unchanged | Preserve package boundaries; SSOT and contracts pass |
| Frontend Engineer | Single Inspector, responsive focus recovery and observer cleanup | Regression covers field identity/configuration across resizing |
| Accessibility Specialist | Native controls, tabs, named separators, non-drag sizing; notice/table stacking findings | Fixed with geometry/keyboard/axe checks; manual assistive technology remains NOT VERIFIED |
| Responsive Designer | Actual320–1920px images; intentional contained Token table scrolling | No claim that every column fits simultaneously; verify physical keyboard/safe areas separately |
| Developer Experience | Code has its own tab and comes from the same validated configuration | API contracts unchanged; preview/code parity and reset tests pass |
| QA Engineer | Strict visual gate retained; exact-header test issue and pane-drag regression | Fixed; full runs must remain release gates |
| Performance Engineer | One token override input replaces48; stable preview scene identity retained |24journeys show no errors; input count is not a latency claim; measure lab/field separately |
| Information Architect | Explorer/category selection, Canvas content and Inspector mutation have separate owners | Documentation records responsive naming and contained overflow |
| Interaction Designer | Draft count/Commit grouped; resizing and phone panels retain state | Fixed ambiguity and drag discontinuity; final responsive screenshots reviewed |
| Enterprise UX Reviewer | Compact table supports category/search/modified filters, visible inheritance and dependencies | No bulk-editing/virtualization capability is claimed; preserve transactional validation |

No unresolved evidence-supported P0/P1/P2 remained in these bounded final reviews. This does not close unperformed manual/device acceptance or replace CI/deployment checks.

## Evidence boundaries

Final source reports and24journey JSON/48PNGs are retained locally under `/tmp/pwa-studio-next/reviews/` and `/tmp/pwa-studio-next/combined/`; these are local evidence paths, not permanent hosted download URLs. The reviewed Linux visual scenarios are committed in `tests/visual/baselines`; environment and strict thresholds are unchanged. The central task/release record must separately report actual CI, Pages, hosted upgrade and offline results.

Physical iOS/Android installation, actual Safari status-bar/safe-area/virtual-keyboard behavior, manual VoiceOver/NVDA interpretation, actual200%/400% zoom, independent human visual approval and field Core Web Vitals are **NOT VERIFIED** by this review.
