---
title: Sentry Python SDK
description: Configure-level Sentry setup for Python projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: monitoring

## Use It

```sh
avis add monitoring
avis add sentry-python
```

## Supported Projects

- Python projects
- Django and FastAPI-compatible project contexts
- pip, uv, or Poetry

## What Avis Changes

Avis installs `sentry-sdk`, creates an `avis_sentry.py` starter module, and adds an example `SENTRY_DSN` entry to the environment example file.

## Verification and Repair

This is configure-level support. Avis can verify dependency and starter-file presence, but application-specific initialization remains manual.

## Still Manual

- creating the Sentry project
- importing the starter module from your app startup path
- selecting framework integrations
- production DSN handling
- release and environment naming
