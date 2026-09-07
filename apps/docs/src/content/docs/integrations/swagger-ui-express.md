---
title: Swagger UI Express
description: Configure-level API documentation setup for Express projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: api-documentation

## Use It

```sh
avis add api-documentation
avis add swagger
avis add swagger-ui-express
```

## Supported Projects

- Express
- Node package managers: npm, pnpm, yarn, bun

## What Avis Changes

Avis installs Swagger UI Express and creates a starter OpenAPI module that can be mounted by an Express application.

## Verification and Repair

This is configure-level support. Avis verifies dependency and starter module presence, but the route mount and schema design remain project-specific.

## Still Manual

- mounting the docs route in the app
- writing or generating the OpenAPI schema
- protecting internal docs in production
- documenting authentication and error responses
