---
title: Run Avis in a Next.js Project
description: Add a supported integration to an existing Next.js project.
---

Start from an existing Next.js project created with your normal scaffold command.

```sh
cd my-next-app
node path/to/avis-dev/packages/cli/dist/index.js
```

Add a supported integration:

```sh
node path/to/avis-dev/packages/cli/dist/index.js add zustand
```

Review the ChangePlan, confirm only if the changes are expected, then verify:

```sh
node path/to/avis-dev/packages/cli/dist/index.js doctor
```

Current Next.js integrations:

- Zustand
- TanStack Query
- Zod
- React Hook Form
