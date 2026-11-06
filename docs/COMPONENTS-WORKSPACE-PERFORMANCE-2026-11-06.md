# Components workspace — hosted performance measurement

One bounded hosted Lighthouse lab sample was collected on 6 November 2026 after deployment. No application source, repository dependencies, lockfile, permissions or production data were changed by this measurement.

## Identity and conditions

- Target and final displayed URL: <https://yapweijun1996.github.io/PWA-Design-System/#components>.
- Source: merged PR [#7](https://github.com/yapweijun1996/PWA-Design-System/pull/7), main commit `6edf800`. The release manager verified the deployed source/artifact mapping.
- Independently fetched hosted HTML identified Studio build `652cf8a00c538fb7b036`. The final Lighthouse screenshot visibly showed the Components workspace, compact panel controls and centered Button preview. The report's document `finalUrl` omits the hash, while `requestedUrl` and `finalDisplayedUrl` retain `#components`.
- Pages run: [42166381156](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42166381156). Main CI: [42165434139](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/42165434139). Successful statuses were provided by the release manager before authorizing the sample.
- Lighthouse **13.6.0**, installed headless **Chrome 157**, axe-core **4.14.0**; report fetch time **2026-11-06T05:09:23.935Z**.
- Mobile emulation **412 × 823**, scale **1.75**. Simulated throttling: **150ms RTT**, **1638.4Kbps**, **4× CPU slowdown**. Default storage reset enabled.
- The complete report `configSettings` object exactly matched the retained 5 November hosted Components sample. The browser changed from Chrome 156 to 157. The benchmark index changed from 2208 to **1584**; host and network conditions remain variable.
- The release manager closed the separate hosted UI/service-worker-upgrade browser contexts before this run. Only one Lighthouse sample was requested and collected.

## Measured result

| Performance | Automated accessibility | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| **97/100** | **100/100** | **1274.37ms** | **1274.37ms** | **2ms** | **0** | **4697.25ms** |

Values use the raw audit `numericValue`, including TBT 2ms although the formatted report rounds it to 0ms. Full-precision Speed Index is retained in the JSON report.

There were **zero run warnings**, **zero audit execution errors**, **no runtime error**, and **zero scored accessibility failures**. Advisory performance diagnostics included cache lifetimes (estimated 47KiB savings) and render-blocking requests (estimated 10ms savings); they are separate from audit execution errors. Speed Index contributed to the score below 100.

The `errors-in-console` best-practices audit was **not run** because the selected categories were performance and accessibility. This measurement does not claim a zero-console-error result. The release manager's separate hosted UI journey records console, page, HTTP and external-request checks.

## Interpretation and limits

This is a single lab sample. The older Chrome 156 measurement is historical context rather than a strict before/after comparison or a causal improvement claim. No release performance budget was invented after observing the result. The changed browser and benchmark index prevent attributing score or Speed Index differences solely to the UI amendment.

**Field Core Web Vitals, field INP, full interaction performance and WCAG conformance are NOT VERIFIED by Lighthouse.** The accessibility score covers automated checks during this navigation; manual screen-reader interpretation and device acceptance are recorded separately. No telemetry backend was added.

## Reproduction and retained evidence

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npx --yes lighthouse@13.6.0 \
  'https://yapweijun1996.github.io/PWA-Design-System/#components' \
  --only-categories=performance,accessibility \
  --chrome-flags='--headless=new' \
  --output=json --output=html \
  --output-path=/tmp/components-v2-performance/hosted-components
```

Evidence retained outside the repository under `/tmp/components-v2-performance/`:

- `hosted-components.report.json` and `.report.html`: raw metrics, environment, settings and audits.
- `hosted-components.png`: extracted actual final browser screenshot, visually inspected.
- `hosted-index.html`: independently fetched build identity.
- `summary.json`: exact metrics, setting comparison, warnings and audit scope.
- `lighthouse.log`: CLI execution record.

These are local evidence paths, not permanent hosted download links. The Lighthouse process and its isolated browser exited successfully before handoff; no performance test browser was left open.
