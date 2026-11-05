# Component standards

The current 21 families and their exported factories, option types, states and keyboard notes are recorded in `packages/agent-contract/component-contracts.json`. Core components are framework-independent DOM factories; use the documented element and `destroy()` lifecycle, and keep application routing and persistence outside the reusable core. The caller owns root element removal. See `packages/core/README.md` and the family guides for limitations and working examples.

Use native semantics where appropriate, accessible names, keyboard interactions and visible focus. Validate behavior at actual viewport sizes and with assistive technology; scoped automated tests are not a WCAG certification. Tooltip and Menu require native Popover support. Some families currently offer a single size/style or narrow APIs; do not claim unimplemented states, callbacks or behaviors. Static brand assets are inventoried, but there is no approved general-purpose icon library.

`npm run contracts:check` checks family identities, source signatures, export paths and test-call references. Runtime tests cover representative defaults and controls, not every possible state or device.
