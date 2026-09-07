---
title: django-cors-headers
description: Managed CORS header setup for Django projects.
---

Status: stable manifest, alpha project support  
Setup maturity: managed  
Capability: security

## Use It

```sh
avis add security
avis add django-cors-headers
```

## Supported Projects

- Django
- pip, uv, or Poetry

## What Avis Changes

Avis installs `django-cors-headers` and patches the detected Django settings module so the app and middleware entries are present.

## Verification and Repair

This integration is managed. `avis doctor` verifies the dependency, `INSTALLED_APPS`, and middleware configuration.

`avis repair django-cors-headers` can generate a supported repair plan. During repair, Avis checks recorded file hashes before mutating managed files and stops if user edits make the change ambiguous.

## Still Manual

- selecting allowed origins
- deciding credential policy
- matching CORS settings to environments
- reviewing security impact before production
