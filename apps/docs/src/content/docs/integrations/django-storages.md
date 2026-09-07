---
title: django-storages
description: Configure-level object storage setup for Django projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: storage

## Use It

```sh
avis add storage
avis add django-storages
```

## Supported Projects

- Django
- pip, uv, or Poetry

## What Avis Changes

Avis installs django-storages with S3-compatible support, creates a storage settings helper, and adds example bucket/region environment entries.

## Verification and Repair

This is configure-level support. Avis verifies generated scaffolding, but production storage policy remains project-specific.

## Still Manual

- importing the helper into Django settings
- choosing public/private media policy
- configuring IAM permissions
- configuring bucket CORS
- handling signed URLs and CDN behavior
