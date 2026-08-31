---
title: Avis Laravel Sanctum Integration
description: Add Laravel Sanctum authentication support to a supported Laravel project with Avis.
---

Capability: authentication

Status: stable integration manifest, alpha project support

Supported ecosystems:

- PHP

Supported frameworks:

- Laravel

Supported package managers:

- Composer

Package:

- `laravel/sanctum`

Command:

```sh
avis add auth
avis add laravel-sanctum
```

## What Avis Does

- installs Laravel Sanctum when it is not already present
- verifies dependency presence

## Files Avis May Create

None.

## Files Avis May Modify

None.

## Dependencies Added

- `laravel/sanctum`

## Verification

`avis doctor` checks that `laravel/sanctum` is installed.

## Purpose-First Usage

Laravel Sanctum is the default recommendation for `avis add auth`, `avis add authentication`, and `avis add api-auth` in a compatible Laravel project.

## Manual Setup Differences

Avis installs Sanctum. You still decide how to configure guards, middleware, migrations, token abilities, frontend session behavior, and route protection.

## Links

- [Laravel Sanctum documentation](https://laravel.com/docs/sanctum)
