---
title: avis repair
description: Generate a minimal repair ChangePlan for a supported integration.
---

```sh
avis repair tanstack-query
avis repair data-fetching
avis repair data-fetching --yes
avis repair data-fetching --dry-run
```

`avis repair` detects the project, verifies the selected integration, and reuses the integration planner to generate the smallest available ChangePlan for the current project state.

Repair does not blindly reinstall an integration. Project inspection still decides what is missing.

The first supported repair path is the existing idempotent integration planner model. For example, a Next.js project with `@tanstack/react-query` installed but no provider module can repair by creating the missing provider.
