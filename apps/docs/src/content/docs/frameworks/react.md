---
title: Using Avis with React
description: Current Avis support for React projects.
---

Status: alpha

## Detected Through

Avis recognizes React projects through Node package metadata that includes React dependencies.

## Supported Package Managers

- npm
- pnpm
- yarn
- bun

## Supported Capabilities

- routing
- icons
- state management and validation may apply through Node/React-compatible integrations where project context supports them

## Current Integrations

- React Router DOM
- Lucide React
- React Icons
- Heroicons React

## Purpose-First Commands

```sh
avis add routing
avis add icons
```

## What Avis May Change

Current React support is mostly install-level. Avis can add compatible dependencies and show ChangePlans before applying them.

## Not Handled By Avis

Avis does not scaffold the React app, choose Vite/Next/Remix, create routes, or design client architecture.
