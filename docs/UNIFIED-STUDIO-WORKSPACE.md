# Unified Studio workspace

Design Tokens and Components share the private Studio workspace host in `apps/studio/src/components/workspace`. It owns responsive panels, resize controls, layout preferences and cleanup. Core DOM factories, React adapters and token resolution remain independent of this application shell.

## Layout and scroll ownership

A wide workspace starts with a 240px Explorer, flexible Canvas and 300px Inspector. Explorer is bounded to 220–260px and Inspector to 280–320px. Three columns appear only when the viewport and actual available workspace width can accommodate the maximum pane widths, 320px Canvas and divider hit areas. Compact layouts collapse Explorer; phones show one named panel at a time. Switching panels and resizing retain configuration and recover focus from hidden content.

Drag the dividers, use their Arrow Left/Right and Home/End keys, or open **Pane sizes** to use number inputs and Decrease/Increase buttons. The latter provides a single-pointer alternative to dragging. These bounded splitters do not implement Enter-to-collapse; they are not claimed to implement every behavior of the draft [APG Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/). See [WCAG dragging-movement guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

The document owns page scrolling. Component Explorer and the Token Table have bounded list/table scrolling. Long code and deliberately oversized canvases scroll horizontally inside their regions. Token columns retain readable minimum widths; a compact table intentionally requires horizontal scrolling rather than compressing color values into vertical text. There is no additional independently scrolling Inspector.

Pane widths are optional local preferences, not exported design tokens. Unavailable or malformed storage does not prevent editing. Responsive breakpoints derive from authoritative token sources; layout fit additionally depends on available container width.

## Design Tokens

Choose a category, search by token name/type/value/reference, or filter to saved overrides and pending removals. The table displays default and resolved values plus override status. Selecting a token opens its single editor in Details/Inspector. Other drafts remain in memory even when the selected token falls outside a filter.

The Inspector groups the override, inherited/resolved values, color picker where supported, and dependency chain. It calls the existing reference inspection and validation functions; it does not introduce a second resolver. Empty overrides inherit. An unresolvable draft retains the last valid preview. A resolvable draft with contrast failures remains visible with validation warnings; invalid drafts block saving and export under existing project-wide validation, including all 96 supported appearance combinations.

**Editing scope** controls the override destination; **Canvas theme** controls the isolated preview. **Studio theme** controls the application shell. A mismatch message explains when scope and preview differ. Commit, Cancel, Undo and unsaved count share the action area. Import/reset and change details remain available without occupying every token row.

Canvas has Tokens, Preview and Info tabs. Preview uses the real reusable components and preserves their nodes while token values update. Changes remain drafts until Commit; committed configuration is local browser data, not a repository edit. Preserve the existing transactional import, pending-read cancellation, cross-tab safeguards and bounded JSON validation.

## Components

Explorer uses registry-backed categories and search. The Inspector is the sole property editor. Canvas contains Preview, Code, Usage, API and Accessibility tabs. Preview and generated code derive from the same validated configuration. Button examples in Usage are explicitly independent demonstrations and do not mutate the active component.

Phone panels are Explorer, Canvas and Properties; the Canvas panel can contain Code or other content, distinct from its Preview tab. Code and copy feedback live in Code. Reset properties retains the selected content tab. Preview-width controls set actual CSS canvas widths and report measured width; they do not emulate browser media queries or relocate portaled overlays. Use real viewport testing for those behaviors.

## Verification boundaries

Automated checks cover semantic behavior, pointer/keyboard/non-drag resizing, responsive geometry, focus, import/draft workflows, component code parity and selected axe rules. Reviewed Linux screenshots require the locked environment and strict comparison gate. Automated axe and emulated widths do not establish complete WCAG conformance, physical touch behavior, actual iOS installation/safe-area/keyboard behavior or independent human visual approval.

For update policy, safe-area ownership and route-specific header defaults, see [PWA exceptions](PWA-STANDARD-EXCEPTIONS.md). Release evidence and remaining manual acceptance must identify the tested source/build rather than reuse historical pass counts.

## Reviewed visual baseline

The 19 scenarios cover light/dark, compact/comfortable, mobile/tablet/desktop, Token Details/Preview/draft, Components Explorer/Properties/Code and open menu/dialog states. Fresh candidates were captured by CI run `42176233841` from `67f0f53` on Ubuntu24.04/Playwright1.64.1/Chromium156.0.8078.4. The existing font digest and environment fingerprint are unchanged. All19 images were individually inspected; ten revised final images were re-inspected after the last polish, and nine were byte-identical to already reviewed captures. The temporary capture job was removed after acceptance. Strict `maxDiffPixelRatio: 0.001` and environment checking remain unchanged.

Screenshots represent the captured viewport and state, not full functional or accessibility acceptance. In particular, narrow Token tables intentionally scroll horizontally; a screenshot does not imply every column is simultaneously visible.
