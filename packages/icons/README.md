# Static asset inventory

`static-assets.json` records the existing Studio favicon and installation icons by path, SHA-256 and purpose. The SSOT check fails for missing, changed or newly added image files in its documented scan roots until this inventory is reviewed and updated. These entries are application branding assets, not an approved reusable UI icon library.

The core Icon Button accepts a caller-provided plain-text glyph, and Studio currently contains text glyphs. Runtime strings, external content and icons outside the scanned roots cannot be validated by this static inventory. A future approved component icon system needs its own API and contract; do not assume these branding assets supply one.

The SSOT script scans core component CSS for common literal colors, color functions and named colors. It permits `transparent` and `currentColor` as composition keywords. Print-specific or external content outside core component CSS is out of scope. If an in-scope exception is necessary, add an exact path and declaration plus a reason to the script's `cssExceptions` after review; broad per-file exemptions are not supported. Static scans are not a substitute for rendered UI review.
