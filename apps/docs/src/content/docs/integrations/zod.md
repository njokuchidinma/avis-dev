---
title: Avis Zod Integration
description: Add Zod validation to a supported Next.js project with Avis.
---

Capability: validation

Status: stable integration manifest, alpha project support

Supported ecosystems:

- Node

Supported frameworks:

- Next.js

Supported package managers:

- npm
- pnpm
- yarn
- bun

Package:

- `zod`

Command:

```sh
avis add zod
```

## What Avis Does

- installs `zod` when it is not already present
- creates a starter schema module when it does not already exist
- verifies dependency and schema module presence

## Files Avis May Create

- `src/schemas/index.ts` or `src/schemas/index.js` when the project has `src`
- `schemas/index.ts` or `schemas/index.js` when the project does not have `src`

## Files Avis May Modify

None.

## Dependencies Added

- `zod`

## Verification

`avis doctor` checks:

- `zod` dependency installed
- starter schema module detected

If the dependency exists but the starter schema file is missing, Avis reports the integration as partially configured.

## Idempotence

Avis skips dependency installation when `zod` is already listed and skips schema creation when the expected schema file exists.

## Manual Setup Differences

Avis creates a minimal `userSchema` starter. Adapt it to your domain before using it as production validation.

## Links

- [Zod documentation](https://zod.dev/)
