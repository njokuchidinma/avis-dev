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
- TanStack Query
- Zod
- React Hook Form

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

Status: experimental

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

## Flutter

Status: experimental

Detected through:

- `pubspec.yaml`
- Flutter SDK dependency or Flutter configuration section

Supported language:

- Dart

Supported package manager:

- Dart pub

Current integration:

- Flutter Riverpod

## Rust

Status: experimental

Detected through:

- `Cargo.toml`

Supported language:

- Rust

Supported package manager:

- Cargo

Current integration:

- Rust tracing

## Roadmap Signals

The core type system includes identifiers for additional ecosystems and frameworks, but they should not be treated as supported until integrations and verification exist.
