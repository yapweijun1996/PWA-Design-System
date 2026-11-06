# Component workspace

The Components route reuses the Studio Workspace shell for Explorer / Canvas / Inspector layout, responsive panels and accessible pane resizing. Explorer starts at 240px and Inspector at 300px in a sufficiently wide container; shared documented bounds protect readable content. Keyboard and pointer resizing are covered by the shared workspace tests. Layout preferences contain only bounded pane widths, never component configuration.

Explorer provides one search field and one category selector with real counts from the 21-family registry. Its search/category header remains outside the bounded vertical navigation list. The selected component's heading appears in Canvas; choosing a different family restores that family's defaults. Component configuration survives panel switching, information-tab changes and workspace resizing.

The Inspector is the only component property control center. Its supported fields reuse the current contract and adapters; the same validated configuration produces the actual core component and TypeScript snippet. Invalid properties retain the last valid component and code. Reset properties restores defaults, retains the current information tab and returns focus to Reset properties. No additional core options or callbacks are invented.

Canvas separates Preview, Code, Usage, API and Accessibility. Tabs use native buttons with Arrow Left/Right, Home/End and roving focus; the active tab scrolls into view. This small Studio host pattern is required because core createTabs accepts plain-text panels rather than an interactive component canvas. Code/copy feedback lives only in Code, not below Inspector fields. Usage's Button examples are explicitly independent demonstrations and do not change the configured live preview. No duplicate variant/size/state shortcuts appear in Canvas.

The toolbar's Canvas theme is isolated from Studio appearance and is not emitted in the component snippet. Preview width supports Fit workspace and actual CSS canvas widths of 390/768/1440px. The measured visible width is reported; an oversized canvas scrolls inside its own region. These dimensions do not emulate browser media queries or move portaled overlays into a separate viewport. Use Layout Playground or browser device tools for viewport-level testing.

Normal document scrolling owns the workspace and documentation. Explorer has the only bounded vertical list; Code and deliberately oversized canvas content support horizontal scrolling. A phone uses Explorer / Canvas / Properties panels, while shared responsive behavior preserves focused descendants across resizing and supports Escape from Explorer.

Verification is provided by `tests/unit/playground.test.ts`, the shared Workspace tests, and the `playground`, `components-usability` and `components-workspace` browser suites. Automated checks do not establish manual screen-reader, physical-device, actual browser zoom or complete WCAG conformance.
