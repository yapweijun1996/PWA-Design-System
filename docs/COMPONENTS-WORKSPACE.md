# Components workspace

The Components route uses the current registry of 21 implemented families. Search and category filters combine; category counts describe the registry, while the result count describes the current filter. The Explorer header stays outside its independently scrolling list. Supporting documentation uses normal page scrolling.

Above 1000px, Explorer, Preview and Properties appear together. At 700–1000px, Explorer can be opened while Preview and Properties remain available. Below 700px, Explorer, Preview and Properties switch between exclusive panels. Selecting a component closes the narrow Explorer and focuses its heading. Escape closes the Explorer and returns focus to its trigger. Changing panels or resizing preserves the selected component configuration; choosing another component resets to that component's defaults.

The Preview, Usage, API and Accessibility tabs support Arrow Left/Right, Home and End. Quick variant, size and state choices expose only the existing adapter capabilities. They use the same validated configuration as the Inspector and generated TypeScript example. The Inspector includes approved component-specific properties; Button has no icon property. Reset properties restores the selected component defaults and returns focus to Reset properties. Button examples demonstrate supported primary, secondary and loading configurations in the Studio theme.

Preview width defaults to Fit workspace. The 390px, 768px and 1440px choices set the actual CSS width of the preview canvas; wider canvases scroll within the preview region. The measured width appears alongside the control. These are canvas sizes: browser media queries and portaled overlays continue to follow the Studio viewport. Use the separate Layout Playground or browser device tools when viewport-level media-query testing is needed.

View code reveals the Inspector on phones and focuses the code region. Copy code reports success or a manual-copy fallback when clipboard access fails. Code output comes from the same adapter configuration as the live component. An invalid property preserves the last valid component and snippet and displays the existing validation message.

The isolated Preview theme affects the live preview without changing Studio theme or generated component code. Token values, density, palette and kit still come from the shared token engine; no component APIs or token sources change in this workspace redesign.

Verification: `tests/unit/playground.test.ts`, `tests/unit/breakpoints.test.mjs`, `tests/e2e/playground.spec.ts`, `tests/e2e/components-usability.spec.ts` and `tests/e2e/components-workspace.spec.ts`. Independent browser evidence and remaining manual checks are recorded in [the verification report](COMPONENTS-WORKSPACE-VERIFICATION.md).

The workspace information tabs use a small host-level native-button tab pattern. The approved core `createTabs` API accepts plain-text panel content only, so it cannot host the interactive canvas and Inspector. This Studio-only pattern does not create a second reusable component API; keyboard and ARIA behavior are verified by the workspace browser tests.
