---
title: Integrations
description: How Avis integrations describe compatibility, planning, and verification.
---

An integration is an implementation of a capability for a supported project type.

Each built-in integration includes:

- an ID, name, description, version, and status
- a capability
- supported ecosystems, frameworks, and package managers
- dependencies it may install
- project items it configures
- a compatibility check
- a planner that returns a ChangePlan
- optionally, a verifier used by `avis doctor`

Current built-in integrations:

- `zustand`
- `tanstack-query`
- `zod`
- `react-hook-form`
- `django-rest-framework`

Inspect integrations from the CLI:

```sh
avis list
avis show zustand
avis show django-rest-framework
```
