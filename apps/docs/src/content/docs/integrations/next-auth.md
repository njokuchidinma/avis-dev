---
title: Auth.js / NextAuth
description: Configure-level Auth.js support for Next.js projects.
---

Status: experimental  
Setup maturity: configure  
Capability: authentication

## Use It

```sh
avis add auth
avis add next-auth
```

## Supported Projects

- Next.js
- Node package managers: npm, pnpm, yarn, bun
- App Router projects, including `app/` and `src/app/`

## What Avis Changes

Avis installs Auth.js/NextAuth dependencies and creates starter authentication route files for the detected App Router layout.

The V3.1 fixture gate verifies generated route imports for both root `app/` and `src/app/` style projects.

## Verification and Repair

`avis doctor` can detect dependency and generated-route health. Auth.js is configure-level, not managed, so `avis repair` is not treated as a fully supported repair flow yet.

If setup drifts, use `avis add next-auth --dry-run` to inspect the plan before applying again.

## Still Manual

- provider selection
- OAuth credentials
- session strategy
- production callback URLs
- application-specific authorization rules
