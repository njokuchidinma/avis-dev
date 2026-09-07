---
title: Using Avis with Express
description: Current Avis support for Express projects.
---

Status: alpha

## Detected Through

Avis recognizes Express through Node package metadata that includes Express dependencies.

## Supported Package Managers

- npm
- pnpm
- yarn
- bun

## Supported Capabilities

- API documentation
- security
- caching
- email
- storage

## Current Integrations

- Swagger UI Express
- Helmet
- Redis for Node
- Resend for Node
- AWS S3 SDK

## Purpose-First Commands

```sh
avis add api-documentation
avis add security
avis add caching
avis add email
avis add storage
```

## What Avis May Change

Express support includes install-level security dependencies and configure-level service helpers for API docs, Redis, email, and storage. Avis creates starter modules that you can mount or import in the application.

## Not Handled By Avis

Avis does not restructure Express routers, mount middleware automatically in every app shape, design OpenAPI schemas, or configure production secrets.
