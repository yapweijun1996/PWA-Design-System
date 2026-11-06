# Components workspace

Components uses the shared Studio Workspace layout: Explorer selects one of the 21 registered families, Canvas owns Preview / Code / Usage / API / Accessibility, and Inspector owns the selected component's supported properties. There is one component property control center. Code/copy belongs to the Code tab; illustrative examples belong to Usage and do not edit the configured preview.

Desktop widths can be adjusted with pointer or keyboard resize handles within the shared limits. Responsive panels preserve configuration and focused controls. The catalog search/category header stays outside the bounded navigation list; documentation uses document scrolling. The shared layout is also used by Design Tokens.

Canvas theme changes only the preview environment. Fit and 390/768/1440px presets set real CSS canvas width, with contained horizontal scrolling and a measured width. Browser media queries and portaled overlays still follow the Studio viewport. These controls do not emulate an isolated device viewport.

The validated existing adapters generate both the actual core preview and code; core APIs and token resolution are unchanged. Unsupported properties are not fabricated. An invalid field retains the last valid output. Reset restores defaults, retains the active information tab and restores focus to Reset properties.

See the [implementation guide](../apps/studio/src/features/playground/README.md) and [shared Workspace guide](../apps/studio/src/components/workspace/README.md) for behavior and tests. The [6 November earlier verification report](COMPONENTS-WORKSPACE-VERIFICATION.md) records the preceding release and retains its original source identity; it is not evidence for this later refinement. Current task acceptance is tracked in [task.md](../task.md). Actual device, screen-reader, browser zoom and independent human acceptance need their own recorded evidence.
