---
title: Quick Start
description: Use Avis in an existing project in a few minutes.
---

This quick start assumes the npm alpha package is installed.

## 1. Install Avis

```sh
npm install -g avis-dev@alpha
```

Avis is installed on your machine, not into the target application.

## 2. Enter an Existing Project

Use a project already created by its normal framework initializer:

```sh
cd my-next-app
```

## 3. Run Avis

```sh
avis
```

Avis detects the project and prints compatible capabilities.

## 4. Add a Capability

Search when you know the purpose but not the package:

```sh
avis search icons
avis show icons
```

Add a capability:

```sh
avis add icons
```

In the current Next.js alpha, icons resolves to Lucide React by default and shows React Icons and Heroicons React as alternatives.

If you already know the exact integration you want, concrete integration commands still work:

```sh
avis add lucide-react
```

## 5. Review the ChangePlan

Avis prints the changes before applying them:

```txt
Avis will make these changes:

Dependencies
+ lucide-react
```

## 6. Confirm

Avis asks before modifying the project:

```txt
Apply changes?
```

## 7. Verify

Run:

```sh
avis doctor
```

`avis doctor` checks project state and reports whether supported integrations are healthy, partially configured, not installed, broken, or unknown.

## Local Development Alternative

If you are working from source before using the npm package:

```sh
cd avis-dev
pnpm install
pnpm build
cd path/to/my-next-app
node path/to/avis-dev/packages/cli/dist/index.js doctor
```
