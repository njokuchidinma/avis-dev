---
title: Avis Redux Toolkit Integration
description: Add Redux Toolkit state management to a supported Next.js project with Avis.
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

Packages:

- `@reduxjs/toolkit`
- `react-redux`

Command:

```sh
avis add redux-toolkit
```

## What Avis Does

- installs Redux Toolkit and React Redux when they are not already present
- verifies dependency presence

## Files Avis May Create

None.

## Files Avis May Modify

None.

## Dependencies Added

- `@reduxjs/toolkit`
- `react-redux`

## Verification

`avis doctor` checks that both runtime dependencies are installed.

## Purpose-First Usage

`avis add state-management` recommends Zustand by default for Next.js. Use `avis show state-management` to see Redux Toolkit as a compatible alternative.

## Links

- [Redux Toolkit documentation](https://redux-toolkit.js.org/)
