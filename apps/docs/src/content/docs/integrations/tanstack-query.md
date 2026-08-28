---
title: Avis TanStack Query Integration
description: Add TanStack Query to a supported Next.js project with Avis.
---

Capability: data fetching

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

- `@tanstack/react-query`

Command:

```sh
avis add tanstack-query
```

## What Avis Does

- installs `@tanstack/react-query` when it is not already present
- creates a QueryClient provider module when it does not already exist
- verifies dependency and provider module presence

## Files Avis May Create

For projects with an app directory:

- `src/app/providers.tsx` or `src/app/providers.jsx`
- `app/providers.tsx` or `app/providers.jsx`

For projects without an app directory:

- `src/providers/query-provider.tsx` or `src/providers/query-provider.jsx`
- `providers/query-provider.tsx` or `providers/query-provider.jsx`

## Files Avis May Modify

None.

Avis creates the provider module, but it currently does not patch your root layout to connect it.

## Dependencies Added

- `@tanstack/react-query`

## Verification

`avis doctor` checks:

- `@tanstack/react-query` dependency installed
- provider module detected

If the dependency exists but the provider module is missing, Avis reports the integration as partially configured.

## Idempotence

Avis skips dependency installation when the package is already listed and skips provider creation when the expected provider file exists.

## Manual Setup Differences

Avis creates a small client component wrapping children in `QueryClientProvider`. You still need to import and mount it where appropriate for your Next.js app.

## Links

- [TanStack Query documentation](https://tanstack.com/query/latest)
