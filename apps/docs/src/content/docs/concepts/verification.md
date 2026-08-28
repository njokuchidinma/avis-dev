---
title: Verification
description: How Avis checks whether an integration is configured correctly.
---

Verification checks actual project state. A dependency being installed does not automatically mean the integration is healthy.

Each verifier returns:

- an integration ID
- a health state
- checks with pass, warning, fail, or skipped status
- diagnostics

Current health states:

| State | Meaning |
| --- | --- |
| `healthy` | Expected dependency and configuration signals are present. |
| `partial` | Some expected setup is present, but configuration is incomplete. |
| `broken` | A verifier can identify a broken setup. |
| `not-installed` | Required dependency signals are absent. |
| `unknown` | Avis cannot confidently classify the integration state. |

Current built-in verifiers mostly distinguish healthy, partial, and not installed states.
