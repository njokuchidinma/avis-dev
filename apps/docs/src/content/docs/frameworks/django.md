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

## Supported Capabilities

- API tooling

## Current Integrations

- Django REST Framework

## Not Handled By Avis

Avis does not replace `django-admin startproject`, project layout decisions, database configuration, settings module design, authentication setup, or deployment configuration.

Framework scaffolders create the project. Avis equips it.
