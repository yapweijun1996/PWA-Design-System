# Accessibility statement

The project targets WCAG 2.2 AA, but conformance is **NOT VERIFIED**. Automated contrast, axe and keyboard tests cover selected states; they do not prove accessibility. The Accessibility Lab compares opaque six-digit sRGB values using the WCAG relative-luminance calculation. It reports 4.5:1 for normal text, 3:1 for large text and 3:1 for applicable non-text visual information. It does not inspect transparency, gradients, images, actual font size or all component states. Compare unrounded ratios against thresholds. See W3C's [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) guidance for applicability and exceptions.

## Manual test record

The following checks are **NOT VERIFIED**. For every completed run record date, build commit, operating system, browser, assistive technology, versions, scenario, result and any issue link. Do not mark a check passed based solely on an automated test.

| Check | Evidence / status |
| --- | --- |
| Screen reader: names, roles, states, errors and live announcements on all interactive pages | NOT VERIFIED |
| Keyboard: logical order, visible focus, menus, tabs, dialog containment and focus restoration | NOT VERIFIED |
| Desktop and mobile screen reader workflows, including token import and update notices | NOT VERIFIED |
| 200% browser zoom, text resizing, mobile orientation, touch targets and no document overflow | NOT VERIFIED |
| Reduced motion, light/dark themes and contrast for relevant adjacent states | NOT VERIFIED |

The optional React adapters render empty hosts during server rendering until client hydration; they do not offer an accessible no-JavaScript fallback. Tooltip and Menu depend on native Popover support. Report accessibility defects with a reproducible scenario and environment in the project issue tracker.
