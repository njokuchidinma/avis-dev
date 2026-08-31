---
title: avis stack
description: Compose multiple capabilities into one combined ChangePlan.
---

```sh
avis stack list
avis stack show next-standard
avis stack use next-standard
avis stack use next-standard --dry-run
```

Stacks compose capabilities and integrations.

The built-in `next-standard` stack currently resolves these capabilities for compatible Next.js projects:

- state management
- data fetching
- validation
- forms
- icons

`avis stack use` resolves each capability through the recommendation system, generates each integration ChangePlan, merges compatible dependency operations, checks for conflicts, and shows one combined preview before applying.
