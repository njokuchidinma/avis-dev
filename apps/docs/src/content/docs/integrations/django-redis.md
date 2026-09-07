---
title: django-redis
description: Configure-level Redis cache setup for Django projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: caching

## Use It

```sh
avis add caching
avis add django-redis
```

## Supported Projects

- Django
- pip, uv, or Poetry

## What Avis Changes

Avis installs `django-redis`, creates a cache configuration helper, and adds an example `REDIS_URL` entry for local development.

## Verification and Repair

This is configure-level support. Avis can verify the package and generated helper file, but final settings import and production cache policy remain developer-owned.

## Still Manual

- importing the helper into Django settings
- choosing cache key prefixes
- selecting Redis database numbers
- production Redis credentials
- timeout and eviction behavior
