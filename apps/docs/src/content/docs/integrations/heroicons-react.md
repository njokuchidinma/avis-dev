---
title: Avis Heroicons React Integration
description: Add Heroicons React to a supported Next.js project with Avis.
---

Capability: icons

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

- `@heroicons/react`

Command:

```sh
avis add heroicons-react
```

## What Avis Does

- installs Heroicons React when it is not already present
- verifies dependency presence

## Files Avis May Create

None.

## Files Avis May Modify

None.

## Dependencies Added

- `@heroicons/react`

## Verification

`avis doctor` checks that `@heroicons/react` is installed.

## Purpose-First Usage

`avis add icons` recommends Lucide React by default for Next.js. Use `avis show icons` to see Heroicons React as a compatible alternative.

## Links

- [Heroicons documentation](https://heroicons.com/)
