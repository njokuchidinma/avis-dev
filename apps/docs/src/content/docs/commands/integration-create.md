---
title: avis integration create
description: Scaffold a community integration authoring workspace.
---

```sh
avis integration create my-integration
```

`avis integration create` creates a local scaffold for a new integration:

- `manifest.ts`
- `plan.ts`
- `verify.ts`
- `fixtures/`
- `tests/`
- `README.md`

The scaffold is capability-first. Start by choosing the capability the integration fulfills, then implement compatibility checks, ChangePlan generation, verification, fixtures, and tests.
