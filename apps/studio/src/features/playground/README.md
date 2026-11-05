# Component workbench

The catalog and each preview continue to use the validated component contract and existing adapters. The same validated configuration produces the live core component and code snippet; no imported callbacks or arbitrary code can be entered.

The workbench places the live preview beside supported properties when its container has room for two readable columns, and stacks them otherwise. Code and Copy stay together. Usage/keyboard/state explanation and the API/default reference are separate native disclosures below the task controls.

At the source-defined tablet breakpoint the catalog becomes an explicitly labeled Choose component disclosure. Opening focuses search, Escape returns focus to its trigger, and selecting closes it and focuses the new component heading. Search is retained when reopened. Resizing retains a focused catalog and avoids leaving focus on a hidden trigger. Desktop keeps the catalog sticky beneath the existing 68px Studio header. Short viewports disable sticky positioning, and the navigation list retains a usable minimum height. The code sample and navigation list scroll independently; the workbench itself uses page scrolling.

Browser regression coverage lives in `tests/e2e/playground.spec.ts` and `tests/e2e/components-usability.spec.ts`. It covers source/code parity, isolated themes, keyboard catalog selection, picker close/resize focus, narrow/short layouts, page and catalog scrolling, dialogs and scoped axe checks. Automated checks do not establish manual screen-reader, physical-device or complete WCAG conformance.
