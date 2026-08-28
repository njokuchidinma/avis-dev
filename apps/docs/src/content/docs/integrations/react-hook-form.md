---
title: Avis React Hook Form Integration
description: Add React Hook Form to a supported Next.js project with Avis.
---

Capability: forms

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

- `react-hook-form`

Command:

```sh
avis add react-hook-form
```

## What Avis Does

- installs `react-hook-form` when it is not already present
- creates a starter form component when it does not already exist
- verifies dependency and example component presence

## Files Avis May Create

- `src/components/example-form.tsx` or `src/components/example-form.jsx` when the project has `src`
- `components/example-form.tsx` or `components/example-form.jsx` when the project does not have `src`

## Files Avis May Modify

None.

## Dependencies Added

- `react-hook-form`

## Verification

`avis doctor` checks:

- `react-hook-form` dependency installed
- example form component detected

If the dependency exists but the component file is missing, Avis reports the integration as partially configured.

## Idempotence

Avis skips dependency installation when `react-hook-form` is already listed and skips component creation when the expected file exists.

## Manual Setup Differences

Avis creates a minimal email form example. You should replace the example handler and fields with your application-specific form logic.

## Links

- [React Hook Form documentation](https://react-hook-form.com/)
