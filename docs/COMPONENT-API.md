# Component API

The canonical machine-readable registry is [component-contracts.json](../packages/agent-contract/component-contracts.json), and the typed package exports are defined in [core package.json](../packages/core/package.json). Studio's AI Agent Rules can export `COMPONENT-API.md` from that registry; the Components playground shows the same current contracts and generated examples.

The 21 current families are Button, Icon Button, Badge, Card, Separator, Tooltip, Input, Textarea, Checkbox, Radio Group, Switch, Select, Form Field, Tabs, Breadcrumb, Menu, Pagination, Dialog, Alert, Toast and Data Table. See the [core guide](../packages/core/README.md), [form API](../packages/core/src/forms/README.md), [navigation API](../packages/core/src/navigation/README.md), [feedback API](../packages/core/src/feedback/README.md) and [Data Table API](../packages/core/src/table/README.md) for defaults and lifecycle details. React adapters have separate [composition and SSR limits](../packages/react/README.md).

The five other proposed enterprise families are not yet implemented as core components. The layout playground demonstrates static HTML examples and must not be treated as a component API.
