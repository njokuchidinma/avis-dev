---
title: Repository Architecture
description: The current Avis monorepo layout.
---

Current high-level layout:

```txt
avis-dev/
  apps/
    docs/
  packages/
    cli/
    core/
    registry/
  scripts/
  tests/
```

## `packages/cli`

The command-line entry point. It parses commands, detects the current project, resolves capabilities and integrations, prints ChangePlans, asks for confirmation, applies changes, and runs verification.

## `packages/core`

The core engine for detection, package managers, planning, applying operations, built-in integrations, and verification types.

## `packages/registry`

Registry primitives for capabilities and integrations. The CLI uses this package to find compatible integrations and display support groups.

## `apps/docs`

The Astro + Starlight documentation site.
