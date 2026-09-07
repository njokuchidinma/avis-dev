---
title: Using Avis with Django
description: Current Avis support for Django projects.
---

Status: alpha

## Detected Through

Avis recognizes a Django project through:

- `manage.py`
- Django dependency metadata in `pyproject.toml`
- Django dependency metadata in `requirements.txt`

## Supported Package Managers

- pip
- uv
- Poetry

Avis uses the detected Python package manager for Django project dependencies. Avis itself should not be added to `requirements.txt`, `pyproject.toml`, or the Django virtual environment.

## Supported Capabilities

- API tooling
- security
- background jobs
- caching
- email
- storage
- API documentation
- monitoring

## Current Integrations

- Django REST Framework
- django-cors-headers
- Celery
- django-redis
- django-anymail
- django-storages
- DRF Spectacular
- Sentry Python SDK

## Purpose-First Commands

```sh
avis add api
avis add rest-api
avis add security
avis add background-jobs
avis add caching
avis add email
avis add storage
avis add api-documentation
avis add monitoring
```

## What Avis May Change

Avis installs Django REST Framework and patches the detected Django settings module so `rest_framework` is present in `INSTALLED_APPS`.

`avis doctor` verifies both the Python dependency and settings configuration. If the package is installed but settings are missing `rest_framework`, Avis reports the integration as partially configured.

V3.1 adds managed support for Django REST Framework and django-cors-headers. Configure-level Django integrations such as Celery, django-redis, django-anymail, django-storages, DRF Spectacular, and Sentry create helper files or settings snippets that can be reviewed and imported by the developer.

## Not Handled By Avis

Avis does not replace `django-admin startproject`, project layout decisions, database configuration, settings module design, authentication setup, or deployment configuration.

Framework scaffolders create the project. Avis equips it.
