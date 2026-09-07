---
title: DRF Spectacular
description: Configure-level OpenAPI documentation setup for Django REST Framework.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: api-documentation

## Use It

```sh
avis add api-documentation
avis add openapi
avis add drf-spectacular
```

## Supported Projects

- Django
- Django REST Framework projects
- pip, uv, or Poetry

## What Avis Changes

Avis installs `drf-spectacular` and creates a starter OpenAPI settings helper for Django REST Framework projects.

## Verification and Repair

This is configure-level support. Avis can verify dependency/helper presence, but URL routing and schema policy are still application decisions.

## Still Manual

- adding schema and Swagger routes to `urls.py`
- setting API title/version metadata
- documenting authentication behavior
- reviewing public schema exposure
