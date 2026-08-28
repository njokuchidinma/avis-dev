---
title: Using Avis with Next.js
description: Current Avis support for Next.js projects.
---

Status: alpha

## Detected Through

Avis recognizes a Next.js project through:

- `next` in package metadata
- `next.config.js`
- `next.config.mjs`
- `next.config.ts`

## Supported Package Managers

- npm
- pnpm
- yarn
- bun

Avis uses the detected Node package manager for Next.js project dependencies.

## Supported Capabilities

- state management
- data fetching
- forms
- validation

## Current Integrations

- Zustand
- TanStack Query
- React Hook Form
- Zod

## Not Handled By Avis

Avis does not duplicate `create-next-app` project choices such as:

- TypeScript
- Tailwind
- App Router
- ESLint
- `src` directory
- import aliases

Framework scaffolders create the project. Avis equips it.
