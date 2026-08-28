---
title: Avis Django REST Framework Integration
description: Add Django REST Framework to a supported Django project with Avis.
---

Capability: API

Status: stable integration manifest, alpha project support

Supported ecosystems:

- Python

Supported frameworks:

- Django

Supported package managers:

- pip
- uv
- Poetry

Package:

- `djangorestframework`

Command:

```sh
avis add django-rest-framework
```

## What Avis Does

- installs `djangorestframework` when it is not already present
- finds a Django `settings.py`
- adds `rest_framework` to `INSTALLED_APPS` when it is not already present
- verifies dependency and settings configuration

## Files Avis May Create

None.

## Files Avis May Modify

- the detected Django settings module, commonly `config/settings.py` or `<project>/settings.py`

Avis first tries to read `DJANGO_SETTINGS_MODULE` from `manage.py`. If that cannot be resolved, it searches top-level directories for `settings.py`.

## Dependencies Added

- `djangorestframework`

## Verification

`avis doctor` checks:

- `djangorestframework` dependency installed
- `rest_framework` included in the detected `INSTALLED_APPS`

If the dependency exists but `rest_framework` is missing from settings, Avis reports the integration as partially configured.

## Idempotence

Avis skips dependency installation when the package manager adapter detects `djangorestframework`. It does not patch settings when `rest_framework` is already present.

## Manual Setup Differences

Avis adds the package and the installed app entry. It does not design serializers, viewsets, routers, authentication, permissions, or API URLs for your application.

## Links

- [Django REST Framework documentation](https://www.django-rest-framework.org/)
