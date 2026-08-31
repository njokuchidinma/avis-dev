---
title: avis add
description: Add a capability or integration to the detected project.
---

```sh
avis add
avis add state-management
avis add icons
avis add zustand
avis add icons --dry-run
avis add icons --yes
```

`avis add` without a subject behaves like `avis`: it detects the project and prints available capabilities.

`avis add <capability>` resolves compatible integrations for the detected project. If exactly one compatible integration exists, Avis uses it. If multiple compatible integrations exist, Avis recommends one, explains why, shows alternatives, and asks whether to use the recommendation.

`avis add <integration>` runs that integration when it is compatible with the detected project.

Use `--dry-run` to preview without changing files or installing dependencies. Use `--yes` to accept the recommended integration and apply the ChangePlan without confirmation.

The add flow:

1. detect project
2. resolve capability or integration
3. check compatibility
4. generate and validate a ChangePlan
5. print the ChangePlan
6. ask for confirmation
7. apply operations
8. run verification when available

After a successful apply, Avis records what it remembers doing in `.avis/state.json`. Doctor and verification still inspect the actual project as the source of truth.
