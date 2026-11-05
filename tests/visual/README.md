# Visual regression fixtures

Six Linux baseline images were inspected individually by the coding agent, including the corrected tablet layout, and are committed with their environment record. They came from [CI run 41968248720](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/41968248720) at source commit `1fc3d299425cdbf097ea59f63c4da19fc57437f3`. This is an agent visual review, not independent human design approval. The first strict comparison passed in [CI run 41968510093](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/41968510093), at commit `2ee2f8a50d57064e4bca17bda06e74d54e2f725b`.

The six fixtures exercise Theme Builder at 390, 768 and 1440 pixels in light/dark and comfortable/compact configurations, plus a disabled button, an open menu and an open dialog. They use the actual Studio routes and core controls. Screenshots use full-page Chromium output, disabled animations, hidden carets, reduced motion, device scale 1, `en-US` and UTC. They supplement, rather than replace, keyboard, accessibility, responsive and manual visual review. Local Chrome fixture smoke checks have been run without comparing screenshots.

## Token Editor amendment baselines

Five additional Linux candidates were captured at source `33c000ad3dff1e846b5d63e742f6fe0e36ff6396` by [CI run 41981032532](https://github.com/yapweijun1996/PWA-Design-System/actions/runs/41981032532). The primary coding agent inspected each image individually on 2026-11-05: desktop light editor, tablet dark/compact editor, mobile light editor, mobile preview and desktop draft with an open change diff. The environment JSON exactly matched the existing reviewed record. Only these five PNGs were added; the original six images, environment metadata and 0.1% comparison threshold were preserved. The temporary capture-only job was removed after review.

The suite now has eleven fixtures. The new five use bounded viewport screenshots so the 48-row editor does not produce unreviewably long images. They cover visible hierarchy, labels, responsive view controls and draft presentation. Scrolling, hidden errors, import transactions and focus are checked separately in behavior tests. Mobile editing remains vertically dense and is a documented P2 follow-up. This is agent visual review, not independent human design approval; only a subsequent strict comparison establishes regression-test success.

## One-time candidate capture on GitHub Actions

Use a capture-only, clearly labeled job on a fixed `ubuntu-24.04` runner. Install the lockfile and the version of Chromium specified by the locked Playwright package; do not use a local browser executable or `VISUAL_SMOKE` in CI. Suggested steps, after checkout and Node setup matching CI:

```sh
npm ci
npm run build:react
npx playwright install --with-deps --only-shell chromium
node tests/visual/environment.mjs --capture
VISUAL_CAPTURE=1 npx playwright test -c tests/visual/playwright.config.ts --update-snapshots
```

Upload `tests/visual/baselines/` as an artifact labeled **unreviewed visual candidates**, plus `test-results/` on failure. This job captures candidates and exercises the fixtures; its success is not a visual-regression pass. A reviewer must inspect each candidate image at its actual size, check clipping, alignment, contrast, states, modal layering and responsive content, then review and commit the intended PNGs and `environment.json`. Record who reviewed the candidates and the source commit in the pull request. If an image exposes a defect, fix it and recapture before approving.

The environment record includes Linux distribution/version, architecture, locked Playwright and Chromium versions, and a SHA-256 fingerprint of all installed font files and paths. It also records the fixed locale, timezone, scale and motion settings. Hosted runner images can change; if the fingerprint changes, strict comparison fails and requires a controlled recapture and review. For longer-lived stability, move both capture and comparison to the same pinned container image **digest** after verifying its Playwright/browser/font contents. Do not suppress mismatches or silently rewrite baselines.

## Strict comparison after review

On the same recorded Linux environment:

```sh
npx playwright test -c tests/visual/playwright.config.ts
```

Missing images or environment metadata and environment drift fail the run. The test threshold permits at most 0.1% differing pixels; investigate any failure rather than automatically accepting it. Screenshot updates require `VISUAL_CAPTURE=1` and the explicit review process above. The CI visual-regression job runs this strict command on pull requests and main.

For local fixture debugging only, a non-baseline smoke run can use an installed Chrome:

```sh
VISUAL_SMOKE=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE='/path/to/chrome' npx playwright test -c tests/visual/playwright.config.ts
```

Smoke mode checks that fixtures can be reached and states opened; it does not create or compare images and is never visual-regression evidence. The local machine used for implementation is macOS and its Docker daemon was unavailable, so it cannot establish the Linux baseline.
