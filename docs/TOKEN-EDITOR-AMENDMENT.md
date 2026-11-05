# Design Tokens amendment — 5 November 2026

This records the approved UI amendment to the user's 13-persona heuristic audit, tracked in [PR #4](https://github.com/yapweijun1996/PWA-Design-System/pull/4). It is not thirteen new independent human reviews or WCAG certification.

## Evidence and architecture

The primary agent inspected deployed baseline `5d2b53c48c946a0d236b82be9267aee18de731d0` in isolated real Chrome at desktop, tablet and mobile sizes. The rendered page had **48 editable semantic tokens**, rather than the audit's historical 47. Missing search, explicit resolved values and draft count were confirmed. No console errors or document overflow were observed in those baseline views; unmeasured contrast and interaction risks remained hypotheses.

Repository JSON remains authoritative. The existing resolver, theme precedence, 96-combination validation, transactional imports and committed storage are preserved. Changes live in the Studio token feature; reusable packages have no dependency on Studio state. The model's optional local preview-theme argument is backward compatible. Preview scenes reuse real core factories and retain stable DOM. No dependency was added.

| Finding | Implemented response | Evidence |
| --- | --- | --- |
| F-01 Color editing | Resolved swatches, native HEX picker, raw text/alias entry and selected contrast checks. Picking a color explicitly replaces an alias. | Alias/picker/export browser tests; invalid values still block saving. Selected pairs do not establish full contrast conformance. |
| F-02 Discovery | Search names/types/references/values, category and current-scope modified filters, result count and clear action. | Search/filter and hidden-invalid-draft browser tests. |
| F-03 Values | Separate Default/Resolved/Override, explicit inheritance, source declaration and direct semantic uses. Default is the preset before project overrides. | Value/alias tests and screenshots. |
| F-04 Draft | Cross-scope count/diff, bounded 50-step undo, explicit all-scope reset, pending-import/cancellation feedback and persistent validation separate from operation feedback. | No-op, undo, storage quota, stale-file, invalid draft/copy/import and navigation-guard tests. |
| F-05 Preview | Actual Button states, Input, Card, Alert, Dialog and sortable/paginated Data Table; optional light/dark comparison. | Stable DOM, sorting and dialog focus tests. |
| F-06 Scope | Independent Editing scope and local Preview theme, persistent context and mismatch action. | Scope tests confirm root appearance/storage stay unchanged by preview selection. |
| F-07 Responsive concepts | Source-defined read-only breakpoints explained separately from viewport examples. | Token/breakpoint consistency gate. |
| F-08 Primitives | Collapsed category groups, copy name/value and explicitly direct reference inspection. | Copy/diagnostic-retention tests. Full transitive dependency graphs remain future work. |

Desktop uses the existing 900px breakpoint for a bounded sticky preview. Narrow layouts use native Editor/Preview buttons with pressed state and retain the panel containing focus on resize. Search and edits survive view switching. Import/export/reset are disclosed near primary actions. Filtering never narrows project validation or exports.

## Actual independent model review

KB auto-manager delegated implementation and separate QA. The primary agent also invoked fresh local `pi` CLI reviewers with explicit available model IDs, no tools/extensions/MCP/skills/session/context files, bounded timeouts, and public source or actual screenshots. Runtime metadata confirmed the models. All used the `openai-codex` provider: model diversity, not provider or human independence. Findings were advice, independently checked.

| Review | Evidence and triage |
| --- | --- |
| Before: `gpt-6.1-terra` | Actual baseline desktop/mobile PNGs supported discovery, value identity, scope and preview improvements. No unobserved interaction failure asserted. |
| After: `gpt-6.1-terra` | Before/after screenshots exposed buried import/export and ambiguous empty placeholders; both corrected and confirmed in recheck. Remaining P2 advice concerns mobile vertical density and distinguishing the decorative swatch from native picker. No release blocker established from static images. |
| After: `gpt-6.1-sol` | Source/mobile screenshots led to pending-file feedback and failing-combination context. Recheck exposed transient feedback erasing validation and generic import contrast errors. Both received bounded fixes and regression tests. |
| After: `gpt-6-luna` | Two hypotheses rejected after source inspection and real-browser reproduction: contrast-invalid drafts already display current resolved values while blocking commit; slow imports followed by oversized files cannot apply late data because revision advances before size validation. Modified-filter scope wording clarified. |

The manager reproduced the shared-status defect before fixing it: copying a primitive erased the contrast explanation while Commit remained disabled. Final source `a423d86` retains a visible validation element associated with affected inputs while reporting operations separately. Import failures diagnose the imported combinations, preserving the unrelated active draft and committed values.

## Visual evidence and limits

The primary agent inspected local screenshots at 1440×900 light, 768×1024 dark, 390×844 light and 320×844 light, plus mobile Preview. No document overflow or runtime errors were observed. Vertical scrolling is required; at 320px the first override starts below the initial viewport. This remains a P2 density limitation, not a claim that controls fit above the fold.

Five Linux candidates at source `33c000a` were individually reviewed with an environment identical to the original six baselines. Only new PNGs were added; the temporary capture job was removed and strict comparison retained. See the [visual record](../tests/visual/README.md). Subsequent diagnostic changes are hidden in valid states; strict CI must verify screenshot consistency.

Another agent operated visible native Chrome at 200% and 400% zoom on `67d997a`: search, categories and keyboard view switching were usable, with visible focus. It observed substantial scrolling and some focused controls near the viewport bottom. This is evidence for that revision, not human assistive-technology verification or exhaustive zoom conformance.

Final CI, Pages provenance and hosted browser results are recorded in the PR and [deployment record](DEPLOYMENT-VERIFICATION.md). Independent human visual approval, manual screen-reader flows, physical-device/iOS standalone checks and Lighthouse/Core Web Vitals are **NOT VERIFIED**. Automated axe/keyboard tests cover selected workflows only. P2 follow-ups: mobile task-based density research, clearer swatch/picker distinction and transitive reference browsing.

If a verified regression requires rollback, use a focused revert PR. The preceding main source is `5d2b53c48c946a0d236b82be9267aee18de731d0`; do not reset or force-push shared history. Browser-local committed overrides retain the existing schema.
