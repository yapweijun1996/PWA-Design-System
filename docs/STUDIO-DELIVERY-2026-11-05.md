# Studio usability delivery — 5 November 2026

The software amendment is deployed and verified. Human/device acceptance is incomplete; this does not certify production readiness or WCAG conformance.

## Repository, source and deployment

- [Repository](https://github.com/yapweijun1996/PWA-Design-System); live [Components](https://yapweijun1996.github.io/PWA-Design-System/#components) and [Design Tokens](https://yapweijun1996.github.io/PWA-Design-System/#design-tokens).
- Feature [PR #5](https://github.com/yapweijun1996/PWA-Design-System/pull/5), merge `22e52c9efe83d68edef5bf6fdc45817b067e1c07`.
- [Main CI 42012835319](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42012835319) and [Pages 42013148639](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42013148639) succeeded for that source.
- Artifact `13408116933` matched the source repository, main run and merge SHA. Hosted build `2770362a08cd6927577f`: root/index HTML and Service Worker matched artifact bytes; all 29 precache responses returned 200 and matched SHA-256 digests.

## Architecture and behavior

The TypeScript/Vite monorepo and 21 framework-independent core families remain. Changes are confined to Studio presentation, declaration inspection, tests and documentation. JSON SSOT, the resolver, 96 appearance combinations, component APIs, preview/code parity, transactional imports/commit/storage and PWA safeguards are preserved; no runtime dependency was added.

Components places Properties beside preview, groups Code/Copy, discloses supporting notes and provides a searchable mobile picker with Escape, selection focus and resize handling. Tokens retains explicit Default/Resolved/Override while disclosing secondary details, separates current swatches from new-color pickers and displays current-appearance chains/direct/transitive dependents. Missing/circular references remain diagnosable. Chrome's native accessibility tree retains purpose/inheritance descriptions when details are closed.

## Tests, review and browser evidence

| Main CI check | Passed |
| --- | --- |
| Vitest | 148/148, 21 files |
| Studio Chromium | 107/107 |
| React integration browser tests | 6/6 |
| PWA offline/update/cache/integrity | 4/4 |
| Strict Linux visual comparison | 16/16 |
| TypeScript, lint, tokens/contracts/agent generation/SSOT | All |
| Production build/bootstrap/subpath/CSP/artifact | All |

Separate feature authors cross-reviewed changes; the manager inspected diffs and independently checked behavior. Findings corrected media-query fixtures, a resize focus race, native name/description gaps and Linux-font narrow wrapping. Existing assertions and lint/visual thresholds were retained. Candidates were individually reviewed; original Theme Builder PNGs remain byte-identical. See [visual history](../tests/visual/README.md).

Independent WebKit 27.2 checks passed 46/46 at `175c2d2`; the later strengthened narrow CSS case passed 1/1. Actual hosted Firefox Nightly passed 10/10 on the released build; its headless narrow window was clamped to inner 500×759, so 390px Firefox, stable Firefox and physical phones are not claimed.

Real Chrome 156 upgraded an isolated controlled client from `34d9c458c7422cf21e2a`: unsaved drafts blocked update, cancel allowed activation and committed tokens survived reload. Native descriptions, transitive references, preview/code parity, mobile picker/Dialog focus and offline editing/commit/reload passed. An uncached fetch failed, confirming offline mode. Observed 1440×900, 390×844 and 320×844 views had no document overflow; the first 320px token input ended at y=822. Online recheck errors and failed HTTP responses were empty; intentional offline-probe errors were separate. Current plus immediately preceding caches match the retention policy. These are agent-operated browser observations, not human/physical-device checks.

## Security, performance and remaining work

Dependency audit: zero known vulnerabilities. New UI uses safe text/DOM APIs and preserves bounded imports; no arbitrary imported execution, secrets or telemetry were added. This is scoped evidence, not comprehensive security certification.

Hosted Lighthouse 13.6.0 / Chrome 156 mobile lab samples: Components Performance100/automated accessibility100, FCP1267ms/LCP1417ms/TBT0ms/CLS0.01551; Tokens98/100, FCP1003ms/LCP1264ms/TBT171ms/CLS0. No audit errors or run warnings. These single samples do not prove causal improvement, field Core Web Vitals or WCAG conformance. [Full independent hosted QA](HOSTED-QA-2026-11-05.md) records conditions, timestamps and limitations.

T1–T3 software work and T7 lab measurement are complete. T4 manual screen readers, T5 physical-device/iOS installation and T6 independent human visual approval remain **NOT VERIFIED**. T8 has Firefox/WebKit evidence; real Safari requires owner-enabled Remote Automation and remains **NOT VERIFIED**. Field Core Web Vitals are **NOT VERIFIED**. Follow the [owner acceptance checklists](RELEASE-ACCEPTANCE.md).

Rollback uses a focused revert PR against feature PR #5, with preceding main `fe5b6f049a67d9285a5a63fb26149b9f9b9eed70` as reference. Preserve shared history and saved-token schema; no reset, force-push or rollback was performed.
