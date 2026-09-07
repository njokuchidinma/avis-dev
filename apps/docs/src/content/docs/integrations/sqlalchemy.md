---
title: SQLAlchemy
description: Configure-level SQLAlchemy setup for Python projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: orm

## Use It

```sh
avis add orm
avis add sqlalchemy
```

## Supported Projects

- Python projects
- FastAPI-compatible project contexts
- pip, uv, or Poetry

## What Avis Changes

Avis installs SQLAlchemy, creates a starter database session helper, and adds an example `DATABASE_URL`.

## Verification and Repair

This is configure-level support. Avis verifies the dependency and starter helper, but database lifecycle choices stay with the project.

## Still Manual

- selecting the database driver
- adding Alembic migrations
- wiring sessions into request lifecycles
- transaction boundaries
- production database credentials
