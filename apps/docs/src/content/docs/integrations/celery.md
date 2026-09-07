---
title: Celery
description: Configure-level Celery setup for Django background jobs.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: background-jobs

## Use It

```sh
avis add background-jobs
avis add celery
```

## Supported Projects

- Django
- pip, uv, or Poetry

## What Avis Changes

Avis installs Celery, detects the Django settings module where possible, creates `config/celery.py`, and adds an example `CELERY_BROKER_URL` value.

The generated starter follows the V3.1 configured-integration pattern: install the package, create a predictable helper file, add environment guidance, and verify the expected state.

## Verification and Repair

Celery is configure-level. Avis can detect dependency/helper/env-example presence and re-plan idempotently, but it is not marked managed yet.

## Still Manual

- choosing Redis, RabbitMQ, or another broker
- importing the Celery app from project startup files
- worker deployment
- retry policy and task routing
- production broker credentials
