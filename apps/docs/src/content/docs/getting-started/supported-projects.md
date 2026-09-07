---
title: Supported Projects
description: Frameworks, ecosystems, and integrations currently supported by Avis.
---

Avis should only document support that exists in the current implementation.

## Next.js

Status: alpha

Detected through:

- `package.json`
- `next` dependency
- `next.config.js`, `next.config.mjs`, or `next.config.ts`

Supported languages:

- JavaScript
- TypeScript

Supported package managers:

- npm
- pnpm
- yarn
- bun

Current integrations:

- Configure: Auth.js, Zustand, Redux Toolkit, TanStack Query, Zod, React Hook Form, Sentry for Next.js
- Install: Lucide React, React Icons, Heroicons React
- Known limitation: Auth.js setup is configure-level and fixture-tested for `app/`
  and `src/app/` route imports, but it is not marked managed yet.

## Django

Status: alpha

Detected through:

- `manage.py`
- Django dependency metadata in `pyproject.toml` or `requirements.txt`

Supported language:

- Python

Supported package managers:

- pip
- uv
- Poetry

Current integrations:

- Managed: Django REST Framework, django-cors-headers
- Configure: Celery, django-redis, django-storages, django-anymail, drf-spectacular, Sentry Python SDK
- Install: Simple JWT for Django REST Framework, pytest-django, psycopg
- Known limitation: some configure-level integrations generate opt-in snippets
  instead of automatically importing them into `settings.py`.

## Laravel

Status: alpha

Detected through:

- `composer.json`
- `laravel/framework` dependency
- `artisan`

Supported language:

- PHP

Supported package manager:

- Composer

Current integration:

- Install: Laravel Sanctum, Sentry for Laravel, Predis, Laravel Horizon, Flysystem AWS S3 Adapter, phpdotenv
- Configure: Laravel Pest

Purpose-first commands:

```sh
avis add auth
avis add authentication
avis add api-auth
```

## Flutter

Status: alpha

Detected through:

- `pubspec.yaml`
- Flutter SDK dependency or Flutter configuration section

Supported language:

- Dart

Supported package manager:

- Dart pub

Current integration:

- Configure: Flutter Riverpod, Flutter GoRouter
- Install: Sentry for Flutter

Purpose-first commands:

```sh
avis add state-management
avis add state
avis add stores
```

## Rust

Status: alpha

Detected through:

- `Cargo.toml`

Supported language:

- Rust

Supported package manager:

- Cargo

Current integration:

- Install: Rust tracing, Sentry Rust SDK, SQLx, config-rs, Axum tower-http

## Additional Detected Frameworks

Avis can detect additional frameworks with smaller alpha support surfaces:

| Framework | Ecosystem | Current depth |
| --- | --- | --- |
| React | Node | React Router install support |
| Expo | Node | SecureStore install support |
| Express | Node | Helmet and Swagger UI Express configure/install support |
| Fastify | Node | Detection/catalog support; no first-class integration default yet |
| NestJS | Node | Detection/catalog support; no first-class integration default yet |
| FastAPI | Python | Native OpenAPI documentation detection plus pydantic-settings install support |
| Flask | Python | Detection/catalog support; no first-class integration default yet |
| Symfony | PHP | Detection/catalog support; no first-class integration default yet |
| Axum | Rust | tower-http install support |
| Actix Web | Rust | Detection/catalog support; no first-class integration default yet |
| Gin | Go | validator, pgx, GORM, Redis, Viper, and Sentry install support |
| Fiber | Go | Detection/catalog support; Go ecosystem integrations may still apply where compatible |
| Echo | Go | Detection/catalog support; Go ecosystem integrations may still apply where compatible |

Purpose-first commands:

```sh
avis add observability
avis add logging
avis add tracing
```

## Roadmap Signals

The core type system includes identifiers for additional ecosystems and frameworks, but they should not be treated as supported until integrations and verification exist.
