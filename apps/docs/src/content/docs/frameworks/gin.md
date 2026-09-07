---
title: Using Avis with Gin
description: Current Avis support for Gin projects.
---

Status: alpha

## Detected Through

Avis recognizes Gin through Go module metadata and Gin dependency signals.

## Supported Package Manager

- Go modules

## Supported Capabilities

- validation
- database clients
- ORM
- caching
- configuration
- monitoring

## Current Integrations

- Gin Validator
- pgx
- GORM
- Go Redis
- Viper
- Sentry Go

## Purpose-First Commands

```sh
avis add validation
avis add database
avis add orm
avis add caching
avis add configuration
avis add monitoring
```

## What Avis May Change

Current Gin support is primarily install-level. Avis can add compatible Go module dependencies and keep the ChangePlan explicit.

## Not Handled By Avis

Avis does not generate handlers, middleware, request DTOs, database migrations, Redis clients, or production configuration.
