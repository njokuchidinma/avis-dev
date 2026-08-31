---
title: Avis React Icons Integration
description: Add React Icons to a supported Next.js project with Avis.
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

- `react-icons`

Command:

```sh
avis add react-icons
```

## What Avis Does

- installs React Icons when it is not already present
- verifies dependency presence

## Files Avis May Create

None.

## Files Avis May Modify

None.

## Dependencies Added

- `react-icons`

## Verification

`avis doctor` checks that `react-icons` is installed.

## Purpose-First Usage

`avis add icons` recommends Lucide React by default for Next.js. Use `avis show icons` to see React Icons as a compatible alternative.

## Links

- [React Icons documentation](https://react-icons.github.io/react-icons/)
