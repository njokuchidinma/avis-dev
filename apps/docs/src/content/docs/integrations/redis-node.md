---
title: Redis for Node
description: Configure-level Redis client setup for Node projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: caching

## Use It

```sh
avis add caching
avis add redis-node
```

## Supported Projects

- Node projects
- npm, pnpm, yarn, or bun

## What Avis Changes

Avis installs the Redis client, creates a reusable Redis helper module, and adds an example `REDIS_URL`.

## Verification and Repair

This is configure-level support. Avis verifies dependency and helper presence, but framework-specific cache/session/job wiring remains manual.

## Still Manual

- connection pooling policy
- cache key design
- retry/backoff behavior
- framework-specific middleware
- production Redis credentials
