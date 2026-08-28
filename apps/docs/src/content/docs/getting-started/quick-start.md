---
title: Quick Start
description: Use Avis in an existing project in a few minutes.
---

This quick start assumes you are using the local development build of Avis.

## 1. Build Avis

```sh
cd avis-dev
pnpm install
pnpm build
```

## 2. Enter an Existing Project

Use a project already created by its normal framework initializer:

```sh
cd my-next-app
```

## 3. Run Avis

```sh
node path/to/avis-dev/packages/cli/dist/index.js
```

Avis detects the project and prints compatible capabilities.

## 4. Add an Integration

Add a capability:

```sh
node path/to/avis-dev/packages/cli/dist/index.js add state-management
```

If more than one integration is compatible, Avis lists them and asks you to run a concrete integration command. Current Next.js state management support maps to:

```sh
node path/to/avis-dev/packages/cli/dist/index.js add zustand
```

## 5. Review the ChangePlan

Avis prints the changes before applying them:

```txt
Avis will make these changes:

Dependencies
+ zustand
Files
+ src/stores/index.ts
```

## 6. Confirm

Avis asks before modifying the project:

```txt
Apply changes?
```

## 7. Verify

Run:

```sh
node path/to/avis-dev/packages/cli/dist/index.js doctor
```

`avis doctor` checks project state and reports whether supported integrations are healthy, partially configured, not installed, broken, or unknown.
