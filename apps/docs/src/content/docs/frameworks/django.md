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

## Current Integrations

- Django REST Framework

## Purpose-First Commands

```sh
avis add api
avis add rest-api
```

## What Avis May Change

Avis installs Django REST Framework and patches the detected Django settings module so `rest_framework` is present in `INSTALLED_APPS`.

`avis doctor` verifies both the Python dependency and settings configuration. If the package is installed but settings are missing `rest_framework`, Avis reports the integration as partially configured.

## Not Handled By Avis

Avis does not replace `django-admin startproject`, project layout decisions, database configuration, settings module design, authentication setup, or deployment configuration.

Framework scaffolders create the project. Avis equips it.
