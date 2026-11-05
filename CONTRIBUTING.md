# Contributing

Discuss substantial changes in an issue before implementation. Work on a focused feature branch, preserve existing behavior and use pull requests; do not force-push shared branches. The packages are private and the Pages workflow is disabled pending release readiness.

Read [AGENTS.md](AGENTS.md), the [architecture](docs/ARCHITECTURE.md), [component standards](docs/COMPONENT-STANDARDS.md), and [token rules](docs/DESIGN-TOKEN-RULES.md). Change authoritative JSON token sources rather than generated files; regenerate artifacts and validate contracts. Reuse existing components and semantic tokens and document any deviation.

Run the relevant checks in [TESTING.md](docs/TESTING.md), add meaningful regression coverage for changed behavior and record unverified browser or accessibility states. Supply a clear problem statement, implementation summary, commands and results in the pull request. Do not commit secrets, private customer data or unrelated generated artifacts.
