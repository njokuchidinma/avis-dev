---
title: Using Avis with Laravel
description: Current Avis support for Laravel projects.
---

Status: alpha

## Detected Through

Avis recognizes a Laravel project through:

- `composer.json`
- `laravel/framework` in Composer dependency metadata
- `artisan`

## Supported Package Managers

- Composer

Avis uses Composer for Laravel project dependencies. Avis itself should not be added to `composer.json`.

## Supported Capabilities

- authentication
- API authentication

## Current Integrations

- Laravel Sanctum

## Purpose-First Commands

```sh
avis add auth
avis add authentication
avis add api-auth
```

## What Avis May Change

Avis installs Laravel Sanctum when it is not already present.

`avis doctor` verifies that `laravel/sanctum` is installed. Application-specific guard configuration, migrations, middleware choices, token abilities, and frontend session flows remain explicit Laravel application decisions.

## Not Handled By Avis

Avis does not replace `laravel new`, database setup, authentication product decisions, route design, policies, guards, or deployment configuration.

Framework scaffolders create the project. Avis equips it.
