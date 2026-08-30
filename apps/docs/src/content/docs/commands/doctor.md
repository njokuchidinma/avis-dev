---
title: avis doctor
description: Inspect project health for supported integrations.
---

```sh
avis doctor
avis doctor --json
avis doctor --strict
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

`--json` prints a machine-readable report with project context, integration health, checks, and diagnostics.

`--strict` exits non-zero when a compatible managed integration is broken, partial, or unknown. This allows CI to fail when supported setup drifts out of health.

When `.avis/state.json` exists, doctor includes what Avis remembers applying as separate state metadata. Actual project inspection remains the source of truth for health.
