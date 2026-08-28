---
title: Use Avis Doctor
description: Check whether supported Avis integrations are healthy.
---

Run doctor from the root of an existing project:

```sh
avis doctor
```

Doctor detects the project and runs compatible verifiers.

Use it after:

- adding an integration
- manually editing generated files
- pulling changes from another branch
- debugging an incomplete setup

Healthy means Avis found the expected dependency and setup signals. Partial means some setup is present but incomplete. Not installed means the expected dependency is missing.
