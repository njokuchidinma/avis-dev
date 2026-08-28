---
title: avis show
description: Show details for one integration or capability.
---

```sh
avis show zustand
avis show state-management
```

`avis show <integration>` prints integration details:

- ID
- capability
- version
- status
- supported ecosystems
- supported frameworks
- supported package managers
- dependencies
- configured items
- documentation links when present

`avis show <capability>` prints the capability description and all integrations in that capability.
