# Changelog

## Unreleased

- Unified Design Tokens and Components in a resizable Explorer / Canvas / Inspector shell, replaced the long token form with a compact table and selected-token editor, separated Code/Usage/API/Accessibility, and added non-drag pane controls.
- Added safe-area/system-chrome integration, concise offline feedback, sticky update notices, activation-aware loading and an explicit guarded Reload now action; preserved draft/import/other-tab and prior-asset protections.

- Rebuilt Components as a responsive Explorer / Preview / Properties workspace, added honest canvas widths and keyboard information tabs, corrected resize focus and dark active-state contrast, focused route headings and compacted protected update notices. See the [workspace guide](docs/COMPONENTS-WORKSPACE.md).

- Improved the Components workbench/mobile picker, compacted token rows, added transitive reference inspection and preserved native accessibility descriptions.

- Improved Token Editor discovery, value identity, local theme comparison, draft diff/undo, responsive previews and persistent validation diagnostics. Preserved the existing token engine and transactional import/commit contracts.

- Introduced JSON token sources, deterministic generated artifacts and independent appearance axes.
- Added 21 private framework-independent component families and optional React adapters.
- Added a Studio with component and layout playgrounds, token editing, theme selection, AI contract export, accessibility tools and local documentation.
- Added scoped PWA precaching, update safeguards and targeted offline browser tests. OS installation, iOS standalone and production release readiness remain **NOT VERIFIED**.
- Added quality checks and documentation. This is an in-development release and does not claim WCAG conformance.
