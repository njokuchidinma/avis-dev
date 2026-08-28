---
title: Verification Model
description: How Avis models integration health.
---

Verification returns an integration health state and a list of checks.

Health states:

- `not-installed`
- `healthy`
- `partial`
- `broken`
- `unknown`

Check statuses:

- `pass`
- `warning`
- `fail`
- `skipped`

Doctor groups integrations by health state and prints check output for each compatible verifier.
