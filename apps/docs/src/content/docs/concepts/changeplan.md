---
title: ChangePlan
description: How Avis previews project changes before applying them.
---

A ChangePlan is the safety model Avis uses before mutating a project.

Before Avis changes a project, the selected integration generates a plan:

```txt
Avis will make these changes:

Dependencies
+ zustand
Files
+ src/stores/index.ts
```

ChangePlans can describe:

- dependencies to add
- files to create
- JSON configuration to merge
- text patches
- environment variables to ensure
- diagnostics

Avis validates plans before applying them. File and configuration operations must use safe relative paths so they stay inside the project root.

Avis applies file mutations transactionally. Before applying a plan, Avis
snapshots affected files. If a later operation fails, Avis rolls back files it
created or modified during that failed run. Rollback does not overwrite a file
that changed after Avis wrote it.

Dependency installs are rolled back only when Avis can prove the dependency was
absent before the failed apply and the package manager exposes a safe remove
command. Dependencies that already existed before the run are left in place.

## Why It Matters

ChangePlan exists for:

- transparency
- safer project mutations
- predictable integration behavior
- easier debugging
- future automation support

Always review the ChangePlan before confirming.
