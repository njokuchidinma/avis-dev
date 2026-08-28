---
title: Avis Doctor
description: Use avis doctor to inspect supported integration health.
---

`avis doctor` inspects the current project and runs compatible integration verifiers.

```sh
avis doctor
```

Example output:

```txt
Avis Project Health

Detected:
Framework: nextjs
Language: typescript
Ecosystem: node
Package manager: pnpm

Summary: partial: 1, healthy: 1

PARTIAL

TanStack Query
Verification:
OK dependency installed
WARN provider detected - src/app/providers.tsx was not found. (Run avis add tanstack-query to create the provider module.)

HEALTHY

Zustand
Verification:
OK dependency installed
OK store detected
```

Doctor is one of Avis's strongest differentiators. It checks more than package presence. For example, a project with `@tanstack/react-query` installed but no Avis-recognized provider module is partially configured, not healthy.

## Current Checks

Next.js integrations verify dependency presence plus generated starter files:

- Zustand store module
- TanStack Query provider module
- Zod schema module
- React Hook Form example component

Django REST Framework verifies:

- `djangorestframework` dependency presence
- `rest_framework` in `INSTALLED_APPS`
