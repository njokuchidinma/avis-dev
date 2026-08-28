---
title: Avis Zustand Integration
description: Add Zustand state management to a supported Next.js project with Avis.
---

Capability: state management

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

- `zustand`

Command:

```sh
avis add zustand
```

## What Avis Does

- installs `zustand` when it is not already present
- creates a starter store module when it does not already exist
- verifies dependency and starter store presence

## Files Avis May Create

- `src/stores/index.ts` or `src/stores/index.js` when the project has `src`
- `stores/index.ts` or `stores/index.js` when the project does not have `src`

## Files Avis May Modify

None.

## Dependencies Added

- `zustand`

## Verification

`avis doctor` checks:

- `zustand` dependency installed
- starter store module detected

If the dependency exists but the starter store file is missing, Avis reports the integration as partially configured.

## Idempotence

Avis skips dependency installation when `zustand` is already listed by the package manager adapter. It does not recreate the starter store when the expected file already exists.

## Manual Setup Differences

Avis creates a minimal counter-style `useAppStore` starter. You can replace or extend this store after reviewing it.

## Links

- [Zustand documentation](https://zustand-demo.pmnd.rs/)
