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

## Why It Matters

ChangePlan exists for:

- transparency
- safer project mutations
- predictable integration behavior
- easier debugging
- future automation support

Always review the ChangePlan before confirming.
