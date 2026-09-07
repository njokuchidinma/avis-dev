---
title: Using Avis with FastAPI
description: Current Avis support for FastAPI projects.
---

Status: alpha

## Detected Through

Avis recognizes FastAPI through Python dependency metadata and framework signals.

## Supported Package Managers

- pip
- uv
- Poetry

## Supported Capabilities

- configuration
- ORM/database helper setup
- monitoring
- API documentation through FastAPI native OpenAPI support

## Current Integrations

- pydantic-settings
- SQLAlchemy
- Sentry Python SDK

## Purpose-First Commands

```sh
avis add configuration
avis add orm
avis add monitoring
avis add api-documentation
```

## What Avis May Change

Avis can add Python dependencies, create starter SQLAlchemy and Sentry helper modules, and document when FastAPI already provides native OpenAPI documentation.

## Not Handled By Avis

Avis does not create the FastAPI app, choose sync versus async database sessions, add Alembic migrations, mount routers, or define production settings.
