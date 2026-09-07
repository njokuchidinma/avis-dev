---
title: Sentry for Next.js
description: Configure-level Sentry setup for Next.js projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: monitoring

## Use It

```sh
avis add monitoring
avis add sentry-nextjs
```

## Supported Projects

- Next.js
- JavaScript or TypeScript
- npm, pnpm, yarn, or bun

## What Avis Changes

Avis installs the Sentry Next.js package and creates starter Sentry configuration files, including a client config and an environment example for `SENTRY_DSN`.

## Verification and Repair

Sentry for Next.js is configure-level. Avis can check for the expected dependency and generated starter files, but provider onboarding and production settings remain developer-owned.

## Still Manual

- creating the Sentry project
- choosing environment names
- source map upload policy
- release tracking
- production DSN and auth token management
