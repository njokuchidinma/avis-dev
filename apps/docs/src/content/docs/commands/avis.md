---
title: avis
description: Run Avis without a subcommand.
---

```sh
avis
```

Running Avis without a subcommand detects the current project and prints compatible capabilities.

For a detected project, Avis prints:

- framework
- language
- ecosystem
- package manager
- built-in capabilities
- how many compatible integrations exist for each capability
- example `avis add` commands

If Avis cannot detect a supported project, it prints detection diagnostics and the command help.
