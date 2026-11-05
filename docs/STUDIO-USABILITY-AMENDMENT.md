# Studio usability completion

User-authorized continuation on 5 November 2026; baseline `fe5b6f0`. Scope: Components workspace usability and remaining Token Editor improvements. All 21 component APIs, preview/code parity, JSON SSOT, 96-combination validation, transactional imports and PWA safeguards remain unchanged.

Manager real-Chrome baseline measurements placed Components controls at y=746 at 1920×1080, y=1047 at 768×1024, y=1132 at 390×844 and y=1222 at 320×844. No document overflow or page errors were observed in those views.

Properties now sits beside the preview where space permits. Code/Copy are grouped; usage/accessibility/API details remain expandable. The mobile component picker supports search, Escape, selection focus and resizing. Short wide viewports retain a usable catalog; the page remains the main content scroller.

Token rows retain explicit Default/Resolved/Override while secondary purpose/source information is disclosed on demand. Description IDs stay attached. The resolved swatch is next to Resolved and the native picker says Choose new color. Declaration inspection shows current-appearance alias chains, direct/indirect dependents and missing/circular references. It does not replace value resolution. Differential tests compare primitive-leaf chains to the established resolver across all 96 combinations, including project aliases.

Separate feature authors, cross-review and manager acceptance provide agent review. This is not independent human approval. Linux visual candidates require individual inspection; strict thresholds/environment checks remain intact. CI and hosted provenance are recorded in the delivery PR after verification.

See [release acceptance evidence](RELEASE-ACCEPTANCE.md) for T4–T8, actual browser limitations, Lighthouse lab measurements and human/device checklists. Manual screen-reader, physical-device/iOS installation, independent human visual approval and field Core Web Vitals require actual evidence; unknown is not failed.

Rollback uses a focused revert PR to preceding `fe5b6f0` behavior. Preserve shared history and browser-local token configurations; never reset or force-push main.
