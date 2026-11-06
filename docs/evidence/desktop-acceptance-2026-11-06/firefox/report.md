# Stable Firefox acceptance — 6 November 2026

Result: **81 unique atomic checks passed** in this bounded hosted acceptance. Across the retained attempts there were **91 successful check executions and 5 failed/interrupted assertions**. These are distinct counts; retries are not added to the unique pass count. No product source was changed and no product defect was confirmed by this run. This does not close every desktop, zoom, PWA or accessibility acceptance requirement.

## Browser and provenance

- Application: official **Firefox Stable 159.0.1**, build **20261102144711**, vendor source stamp `7b34a03a910d0385299f4a9f27aa585a786862d8`.
- Host: macOS 27.0.1, Apple Silicon arm64. Automation: installed geckodriver 0.37.1, classic W3C WebDriver, fresh generated test profiles.
- Project source baseline: `40459855467830a988cb6bcf148e7ae4af21c8ce`.
- Actual hosted page runtime: **`1170b641fcdfe7977a19`** from `meta[name="studio-version"]`.
- Tested public URL: `https://yapweijun1996.github.io/PWA-Design-System/`.
- Independent app copy under temporary acceptance directory. Existing Firefox Nightly was not overwritten or used. No personal profile was imported.
- Official installer: `https://download-installer.cdn.mozilla.net/pub/firefox/releases/159.0.1/mac/en-US/Firefox%20159.0.1.dmg`.
- DMG SHA-256: `0c214da4439c1eb4cea28a3c141ff112d511aa32c67f9d12e91116569c8d8dda`; matches Mozilla `https://archive.mozilla.org/pub/firefox/releases/159.0.1/SHA256SUMS`.
- `codesign --verify --deep --strict` passed. Gatekeeper read-only assessment: **accepted / Notarized Developer ID**. No quarantine removal or security bypass.

## Verified scope

1. Forty route/appearance/width checks: all 10 routes in desktop light/comfortable, desktop dark/compact, narrow light/compact and narrow dark/comfortable. Correct heading, runtime, theme/density and no document horizontal overflow.
2. Component search/category filter, label/size/state changes, preview/code agreement, Code tab, local Canvas/Studio theme separation, Menu Arrow/Escape focus, Dialog open/Tab/Escape restoration.
3. Forty-eight Token table entries with one active Inspector, missing alias blocks Commit, valid draft, Cancel, Commit/storage/reload, editing scope/Canvas/Studio independence, narrow panel/dialog/edit access. Undo was explicitly checked as one native typed-character edit at 400%.
4. Native browser zoom was set with **CUA operating the Firefox app using Command + plus/minus**. Actual browser AX output showed **“200%, Reset zoom level”** and **“400%, Reset zoom level”**. Page CSS zoom, page scale, device emulation and DPR injection were not used.
5. Final focused native zoom runs: **6/6 at 200% light/comfortable** and **6/6 at 400% dark/compact**: document fit, component search/select, Properties→Code synchronization with code confined to local horizontal scrolling, valid token editing, Commit, and persistence after a real reload.
6. Additional native 400% dark/comfortable checks: invalid token feedback/disabled Commit, input focus remains below sticky header and within viewport, Undo, Cancel, Dialog Tab trap and Escape restoration.

| Requested / native state | Actual content viewport | Actual outer size returned by Firefox | DPR | Scope |
| --- | --- | --- | --- | --- |
| Desktop 1440×1000 at100% |1440×787|1440×872|2|40-route matrix desktop rows|
| Narrow requested390×1000 at100% |500×787|500×872|2|40-route matrix narrow rows; OS width clamp|
| Narrow requested390×844 at100% |500×759|500×844|2|Dialog and Token Details flows|
| Native200% |720×394|720×436|4|Light/comfortable focused6/6|
| Native400% |384×210|360×218|7.5|Dark/compact focused6/6; report actual dimensions|

Firefox's scaled outer metrics and DPR are preserved exactly as returned. The 400% UI indicator does not justify relabeling the measured 384px viewport as 320px. A requested390px window clamped to500px does not prove390px or physical mobile acceptance.

## Retained errors and recovery

- Initial Token section: temporary harness had improperly escaped a JavaScript selector. Corrected selector and reran only affected Token flows; not an app defect.
- First focused Undo assertion expected the whole typed string to disappear. W3C WebDriver typed characters individually, generating individual edit history. Corrected expectation verified Undo removing the final character at native400%; Cancel independently restores the committed baseline.
- Initial native400 Code sequence: HTTP400 was retained without a response body; exact original cause remains unknown. Final Code sequence passed at both native200/400.
- Focused200 attempt1: exact HTTP400 `element click intercepted`; WebDriver had aligned Commit at `(260,0)` beneath the sticky `studio-topbar`. Harness now performs ordinary `scrollIntoView({block:"center",inline:"nearest"})` before a real WebDriver click. No click/interactability checks were disabled or bypassed.
- Focused200 attempt2: a fixed700ms delay queried the workspace before it rendered after reload; captured page text was `Loading Design Tokens…`. Replaced this premature assumption with a12s rendered-workspace condition, then affected200/400 cases passed. No repository test threshold was changed.
- Separate W3C Meta+plus experiment did not change zoom; it is not counted as native zoom evidence. Native CUA provided the actual browser zoom evidence.

## Limits / NOT VERIFIED

- Import/export in stable Firefox, full HTTP status/network validation and complete browser console collection are **NOT VERIFIED** by this bounded harness. Error listeners only cover errors occurring after their injection on the tested page.
- Native200% overlay interaction was not separately retested at200%. Native400% Dialog passed. Full all-route × all-theme × all-density native zoom cross-product remains **NOT VERIFIED**.
- Full Firefox PWA installation, offline reload and service-worker update acceptance were not executed here.
- Physical mobile devices, actual screen-reader usage, human visual sign-off and full WCAG conformance remain **NOT VERIFIED**.
- `native400-token-error.png` was captured after Cancel, despite its filename; it is not visual proof of the earlier invalid-input state. The invalid-input focused-field geometry is recorded in `zoom-flow-report.json`.
- Firefox emitted macOS sandbox/Crash Reporter diagnostic warnings in the geckodriver log. The app started and tested without security changes; these vendor-process diagnostics are not reported as product console errors.

## Evidence map

- `summary.json`: deduplicated IDs, all attempt counts/errors, exact environment and limits.
- `report.json`: initial40-route matrix and component flows.
- `focused-report.json`: remaining token flows and initial incorrect Undo assertion.
- `zoom-flow-report.json`: first native400 invalid-input/focus/Undo/Cancel/Dialog cases and interrupted Code sequence.
- `remaining-200-attempt1.json`, `remaining-200-attempt2.json`: precise retained recovery evidence.
- `remaining-200.json`, `remaining-400.json`: final6/6 focused runs with viewport/code overflow measurements.
- `native-zoom-provenance.json`: observed native200/400 AX indicators, mechanism, restore and paired measurement sources.
- `native200-components.json`, `native400-components.json`, `native400-tokens.json`: first native zoom measurements.
- `native200-code.png`, `native400-code.png`: actual final Code views.
- `codesign.txt`, `gatekeeper.txt`, `dmg-sha256.txt`, `SHA256SUMS`, `download-source.txt`: vendor/signature/checksum evidence.

Cleanup: restored native100% through CUA Command+0 (reset-zoom indicator disappeared), then explicitly deleted the WebDriver session and terminated geckodriver. Test browser processes are closed. A prior expired test session was followed by a Welcome window in the independent app; that task-created app process was terminated and no personal data was read. No repository-tracked edits, dependency/lockfile changes, commits, merges or pushes were performed by this agent.
