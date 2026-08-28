---
title: Testing
description: How Avis tests detection, planning, and integrations.
---

Run all package tests:

```sh
pnpm test
```

Run type checks:

```sh
pnpm typecheck
```

Current automated tests live primarily in `packages/core` and `packages/registry`.

Important test areas:

- project detection
- ChangePlan validation
- ChangePlan application
- integration planning
- integration verification
- fixture flows

Manual scripts currently exist for selected integration flows:

- `scripts/manual-drf-test.sh`
- `scripts/manual-next-addon-test.sh`
- `scripts/manual-query-test.sh`
- `scripts/manual-zustand-test.sh`
