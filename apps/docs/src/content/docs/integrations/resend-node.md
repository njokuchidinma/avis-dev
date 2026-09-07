---
title: Resend for Node
description: Configure-level transactional email setup for Node projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: email

## Use It

```sh
avis add email
avis add resend-node
```

## Supported Projects

- Node projects
- npm, pnpm, yarn, or bun

## What Avis Changes

Avis installs Resend, creates a small email helper module, and adds an example `RESEND_API_KEY`.

## Verification and Repair

This is configure-level support. Avis verifies the dependency and helper file, while sender identity and production secrets stay outside source control.

## Still Manual

- domain verification
- sender identity
- template design
- real API key injection
- retry and queue policy for email sends
