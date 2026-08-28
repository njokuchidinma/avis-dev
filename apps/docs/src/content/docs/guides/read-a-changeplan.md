---
title: Read a ChangePlan
description: Understand the plan Avis prints before applying changes.
---

A ChangePlan is intentionally plain. Read it as the list of project mutations Avis intends to perform.

Example:

```txt
Avis will make these changes:

Dependencies
+ zustand
Files
+ src/stores/index.ts
```

Meaning:

- `Dependencies` lists packages Avis will add or remove.
- `Files` lists files Avis will create or patch.
- `Configuration` lists structured configuration updates.
- `Environment` lists environment files Avis may ensure.

If the plan is not what you expect, answer no at the confirmation prompt.
