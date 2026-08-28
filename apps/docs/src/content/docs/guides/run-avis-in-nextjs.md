---
title: Run Avis in a Next.js Project
description: Add a supported integration to an existing Next.js project.
---

Start from an existing Next.js project created with your normal scaffold command.

```sh
cd my-next-app
avis
```

Add a supported integration:

```sh
avis add state-management
```

Review the ChangePlan, confirm only if the changes are expected, then verify:

```sh
avis doctor
```

Current Next.js integrations:

- Zustand
- TanStack Query
- Zod
- React Hook Form
