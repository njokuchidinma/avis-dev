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

- Zustand
- Redux Toolkit
- TanStack Query
- Zod
- React Hook Form
- Lucide React
- React Icons
- Heroicons React

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

Current integration:

- Django REST Framework

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

- Laravel Sanctum

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

- Flutter Riverpod

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

- Rust tracing

Purpose-first commands:

```sh
avis add observability
avis add logging
avis add tracing
```

## Roadmap Signals

The core type system includes identifiers for additional ecosystems and frameworks, but they should not be treated as supported until integrations and verification exist.
