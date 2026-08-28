---
title: avis add
description: Add a capability or integration to the detected project.
---

```sh
avis add
avis add state-management
avis add zustand
```

`avis add` without a subject behaves like `avis`: it detects the project and prints available capabilities.

`avis add <capability>` resolves compatible integrations for the detected project. If exactly one compatible integration exists, Avis uses it. If multiple compatible integrations exist, Avis lists them and asks you to choose a concrete integration command.

`avis add <integration>` runs that integration when it is compatible with the detected project.

The add flow:

1. detect project
2. resolve capability or integration
3. check compatibility
4. generate and validate a ChangePlan
5. print the ChangePlan
6. ask for confirmation
7. apply operations
8. run verification when available
