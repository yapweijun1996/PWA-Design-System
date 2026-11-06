# Studio PWA Standard implementation and exceptions

Applies to KB `pwa:product-standard` v1.0.0 and the Studio's current editing/data model. This record describes intentional policy, not physical-device certification.

## Explicit preparation and reload

Studio keeps **Prepare update** and **Reload now** as separate user actions. An uncommitted token draft or pending import is held in memory, so an automatic page reload could lose editing work. A newly accepted activation request does not establish activation completion. Studio shows immediate reduced-motion-aware loading feedback, disables repeated preparation, locks the editing area while checking/preparing, and waits for the captured new worker's actual `activated` state with failure/timeout recovery before exposing Reload now. The explicit reload action checks for unsafe work again. Successful preparation never reloads spontaneously.

The worker deliberately does not add `clients.claim()`. An old document can keep its existing controller and lazy chunks until navigation; waiting only for controllerchange would not reliably detect completion in this architecture. Existing draft/import, other-tab, unknown-client cleanup and prior-version asset protections remain. This is the concrete editing-safety exception to the generic standard's one-confirmation activation/reload sequence.

## Top app bar and return to top

Editing workspaces, navigation, settings, theme tools and application previews retain an always-sticky top app bar: users need stable theme/navigation access, and hiding focused controls or moving editing chrome would damage task continuity. These are justified DEFAULT exceptions. The long-form Documentation route hides the bar after meaningful downward scrolling and reveals it on upward scrolling or keyboard focus, without reflow. An open navigation drawer, visible system notice or reduced-motion preference suppresses hiding. Returning to a route resets its scroll tools.

Back to top appears only after a meaningful document scroll. It operates on the document, leaves Explorer/code/canvas local scrolling independent, respects safe areas and reduced motion, and focuses the current route heading. Short routes do not display an unnecessary action.

## Chrome and safe areas

Update and offline notices remain sticky below the measured app bar and each other, including while reading long pages. Focused Token Inspector inputs use the measured visible chrome boundary when notices appear, expand or resize; notification updates never force a page-top jump.

The shell owns viewport-fit and top/left/right/bottom safe-area padding for the app bar, drawer, page and contextual actions. Features do not add duplicate shell insets. Resolved semantic surface tokens feed browser theme-color metadata in the blocking bootstrap, including validated saved overrides; root appearance/style changes synchronize supported runtime metadata. Light defaults remain unchanged. Apple status-bar metadata selects the supported opaque default/black modes instead of translucent mode.

The static manifest retains its intentional light fallback for initial OS launch presentation. Platform launch/splash behavior and whether iOS applies runtime metadata require actual device evidence; metadata alone is not proof. Browser UI, Safari, installed iOS launch, keyboard/safe-area rendering and theme coherence remain NOT VERIFIED until device testing is recorded.

Studio host inputs should retain at least 16px readable text on iOS. Core component previews intentionally demonstrate their approved typography/density tokens and are not globally restyled to hide a sizing issue; verify consuming-device behavior separately.

## Offline and evidence scope

Connectivity feedback says the browser appears offline, explains the cached local capability, and distinguishes registration failure from connectivity. `navigator.onLine` is only a hint; it does not prove network/service availability. No server transaction or background synchronization is invented. The previously installed shell, local tools and committed configuration keep their documented offline contract; a first uncached visit still needs a connection.

Automated browser checks and viewport emulation cannot close actual installation, safe-area/keyboard, manual screen-reader, independent human visual review or OS-level zoom acceptance. Record these as NOT VERIFIED in the release task/evidence record; do not mark the complete standard passed solely because CI or Lighthouse passes.
