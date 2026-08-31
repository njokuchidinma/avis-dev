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
- icons

## Current Integrations

- Zustand
- Redux Toolkit
- TanStack Query
- React Hook Form
- Zod
- Lucide React
- React Icons
- Heroicons React

## Purpose-First Commands

```sh
avis add state-management
avis add data-fetching
avis add forms
avis add validation
avis add icons
```

## What Avis May Change

Depending on the selected capability, Avis may install runtime dependencies, create starter modules or components, and verify that the generated files are still present.

Examples:

- `state-management` installs Zustand by default and creates a starter store module.
- `data-fetching` installs TanStack Query and creates a QueryClient provider module.
- `forms` installs React Hook Form and creates a starter form component.
- `validation` installs Zod and creates a starter schema module.
- `icons` installs Lucide React by default and can also offer React Icons or Heroicons React.

## Not Handled By Avis

Avis does not duplicate `create-next-app` project choices such as:

- TypeScript
- Tailwind
- App Router
- ESLint
- `src` directory
- import aliases

Framework scaffolders create the project. Avis equips it.
