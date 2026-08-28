---
title: avis doctor
description: Inspect project health for supported integrations.
---

```sh
avis doctor
```

`avis doctor` detects the current project and runs compatible verifiers.

It prints:

- detected project context
- a health summary
- grouped verification output by health state

Health groups are printed in this order:

- broken
- partial
- unknown
- healthy
- not installed

If no compatible verifiers exist for the detected project, Avis says so and prints the currently supported targets.
