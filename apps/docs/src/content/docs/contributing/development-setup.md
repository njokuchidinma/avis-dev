---
title: Development Setup
description: Prepare a local Avis development environment.
---

Install dependencies:

```sh
pnpm install
```

Build all packages:

```sh
pnpm build
```

Run type checks:

```sh
pnpm typecheck
```

Run tests:

```sh
pnpm test
```

Run the docs locally:

```sh
pnpm docs:dev
```

Avis is a pnpm workspace. The root workspace currently includes `packages/*` and `apps/*`.
