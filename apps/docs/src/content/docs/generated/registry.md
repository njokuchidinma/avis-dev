---
title: Generated Registry
description: Capability and integration metadata generated from Avis manifests.
---

This page is generated from Avis capability and integration manifests.

## Capabilities

| Capability | Description | Aliases | Ecosystem Defaults | Framework Defaults | Project Type Defaults | Native Framework Support | Exclusive |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state-management` | Client-side application state. | `state`, `store`, `stores` | `node`: `zustand`, `dart`: `flutter-riverpod` | none | none | none | yes |
| `data-fetching` | Client-side server-state and API fetching. | any | `node`: `tanstack-query` | none | none | none | no |
| `api` | API framework extensions and tooling. | `api-tooling`, `rest-api` | `python`: `django-rest-framework`, `rust`: `axum-tower-http` | `django`: `django-rest-framework`, `axum`: `axum-tower-http` | none | none | no |
| `forms` | Form state and submission helpers. | `form`, `form-state` | `node`: `react-hook-form` | none | none | none | no |
| `validation` | Runtime schema validation. | `schemas`, `schema-validation` | `node`: `zod`, `go`: `gin-validator` | none | none | none | no |
| `auth` | Authentication and API access control. | `authentication`, `api-auth`, `access-control` | `node`: `next-auth`, `python`: `django-simple-jwt`, `php`: `laravel-sanctum` | `nextjs`: `next-auth`, `django`: `django-simple-jwt`, `laravel`: `laravel-sanctum` | none | none | no |
| `observability` | Logging, tracing, and error visibility. | `logging`, `tracing` | `rust`: `rust-tracing` | none | none | none | no |
| `icons` | Icon libraries and icon systems for application interfaces. | `icon`, `icon-pack`, `icon-system` | `node`: `lucide-react` | none | none | none | no |
| `authorization` | Role, permission, and access-policy support. | any | none | none | none | none | no |
| `api-documentation` | OpenAPI, schema, and API reference tooling. | `openapi`, `swagger` | `node`: `swagger-ui-express`, `python`: `drf-spectacular` | `django`: `drf-spectacular` | none | `fastapi`: `FastAPI exposes OpenAPI and Swagger UI natively.` | no |
| `routing` | Application navigation and request routing. | any | `node`: `react-router-dom`, `dart`: `flutter-go-router` | `flutter`: `flutter-go-router` | none | none | no |
| `networking` | HTTP clients and network request helpers. | any | none | none | none | none | no |
| `database` | Database clients and persistence setup. | any | `node`: `node-postgres`, `python`: `psycopg`, `rust`: `rust-sqlx`, `go`: `go-pgx` | none | none | none | no |
| `orm` | Object-relational mapping and query builders. | any | `python`: `sqlalchemy`, `go`: `gorm` | none | none | none | no |
| `migrations` | Database schema migration tooling. | any | none | none | none | none | no |
| `caching` | Application cache clients and cache configuration. | any | `node`: `redis-node`, `python`: `django-redis`, `php`: `predis`, `go`: `go-redis` | none | none | none | no |
| `background-jobs` | Asynchronous work processing. | `jobs`, `workers` | `node`: `bullmq`, `python`: `celery`, `php`: `laravel-horizon` | `django`: `celery` | none | none | no |
| `queues` | Queue-backed task processing. | any | none | none | none | none | no |
| `messaging` | Message broker and event-stream integrations. | any | none | none | none | none | no |
| `logging` | Structured application logging. | any | none | none | none | none | no |
| `monitoring` | Runtime health, metrics, and error monitoring. | any | `node`: `sentry-nextjs`, `python`: `sentry-python`, `php`: `sentry-laravel`, `dart`: `sentry-flutter`, `rust`: `sentry-rust`, `go`: `sentry-go` | none | none | none | no |
| `storage` | Object, file, and media storage integrations. | any | `node`: `aws-sdk-s3`, `python`: `django-storages`, `php`: `flysystem-s3` | none | none | none | no |
| `local-storage` | Device-local persistence. | any | none | none | none | none | no |
| `secure-storage` | Encrypted or platform-secure local persistence. | any | `node`: `expo-secure-store` | `expo`: `expo-secure-store` | none | none | no |
| `email` | Transactional email delivery. | any | `node`: `resend-node`, `python`: `django-anymail` | none | none | none | no |
| `payments` | Payment provider and checkout integrations. | any | none | none | none | none | no |
| `internationalization` | Localization and translation tooling. | `i18n`, `localization` | none | none | none | none | no |
| `analytics` | Product and usage analytics. | any | none | none | none | none | no |
| `notifications` | Push, local, and user notification support. | any | none | none | none | none | no |
| `configuration` | Application settings and environment configuration. | any | `node`: `dotenv`, `python`: `fastapi-pydantic-settings`, `php`: `phpdotenv`, `rust`: `rust-config`, `go`: `viper` | none | none | none | no |
| `security` | Security hardening and guardrail tooling. | any | `node`: `helmet`, `python`: `django-cors-headers` | none | none | none | no |
| `testing` | Project-native test framework setup and starter tests. | any | `node`: `vitest`, `python`: `pytest-django`, `php`: `laravel-pest` | `django`: `pytest-django`, `laravel`: `laravel-pest` | none | none | no |
| `serialization` | Data serialization and DTO generation. | any | none | none | none | none | no |
| `code-generation` | Project-native generated code workflows. | any | none | none | none | none | no |
| `cli` | Command-line application tooling. | any | none | none | none | none | no |
| `error-handling` | Error modeling and propagation utilities. | any | none | none | none | none | no |
| `crash-reporting` | Mobile and client crash visibility. | any | none | none | none | none | no |

## Integrations

| Integration | Capability | Status | Trust | Setup Maturity | Ecosystems | Frameworks | Package Managers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `zustand` | `state-management` | stable | official | configure | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `redux-toolkit` | `state-management` | stable | official | configure | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `tanstack-query` | `data-fetching` | stable | official | configure | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `django-rest-framework` | `api` | stable | official | managed | `python` | `django` | `pip`, `uv`, `poetry` |
| `react-hook-form` | `forms` | stable | official | configure | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `zod` | `validation` | stable | official | configure | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `laravel-sanctum` | `auth` | stable | official | install | `php` | `laravel` | `composer` |
| `flutter-riverpod` | `state-management` | stable | official | configure | `dart` | `flutter` | `pub` |
| `rust-tracing` | `observability` | stable | official | install | `rust` | any | `cargo` |
| `next-auth` | `auth` | experimental | official | configure | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `django-cors-headers` | `security` | stable | official | managed | `python` | `django` | `pip`, `uv`, `poetry` |
| `laravel-pest` | `testing` | stable | community | configure | `php` | `laravel` | `composer` |
| `flutter-go-router` | `routing` | stable | official | configure | `dart` | `flutter` | `pub` |
| `lucide-react` | `icons` | stable | official | install | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `react-icons` | `icons` | stable | official | install | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `heroicons-react` | `icons` | stable | official | install | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `react-router-dom` | `routing` | stable | official | install | `node` | `react` | `npm`, `pnpm`, `yarn`, `bun` |
| `fastapi-pydantic-settings` | `configuration` | stable | official | install | `python` | `fastapi` | `pip`, `uv`, `poetry` |
| `expo-secure-store` | `secure-storage` | stable | official | install | `node` | `expo` | `npm`, `pnpm`, `yarn`, `bun` |
| `axum-tower-http` | `api` | stable | official | install | `rust` | `axum` | `cargo` |
| `gin-validator` | `validation` | stable | official | install | `go` | `gin` | `go` |
| `django-simple-jwt` | `auth` | stable | verified | install | `python` | `django` | `pip`, `uv`, `poetry` |
| `sentry-nextjs` | `monitoring` | stable | official | install | `node` | `nextjs` | `npm`, `pnpm`, `yarn`, `bun` |
| `sentry-python` | `monitoring` | stable | official | install | `python` | any | `pip`, `uv`, `poetry` |
| `sentry-laravel` | `monitoring` | stable | official | install | `php` | `laravel` | `composer` |
| `sentry-flutter` | `monitoring` | stable | official | install | `dart` | `flutter` | `pub` |
| `sentry-rust` | `monitoring` | stable | official | install | `rust` | any | `cargo` |
| `sentry-go` | `monitoring` | stable | official | install | `go` | any | `go` |
| `vitest` | `testing` | stable | official | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `pytest-django` | `testing` | stable | verified | install | `python` | `django` | `pip`, `uv`, `poetry` |
| `node-postgres` | `database` | stable | verified | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `psycopg` | `database` | stable | official | install | `python` | any | `pip`, `uv`, `poetry` |
| `rust-sqlx` | `database` | stable | verified | install | `rust` | any | `cargo` |
| `go-pgx` | `database` | stable | verified | install | `go` | any | `go` |
| `sqlalchemy` | `orm` | stable | official | install | `python` | any | `pip`, `uv`, `poetry` |
| `gorm` | `orm` | stable | verified | install | `go` | any | `go` |
| `redis-node` | `caching` | stable | official | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `django-redis` | `caching` | stable | verified | install | `python` | `django` | `pip`, `uv`, `poetry` |
| `predis` | `caching` | stable | verified | install | `php` | any | `composer` |
| `go-redis` | `caching` | stable | official | install | `go` | any | `go` |
| `bullmq` | `background-jobs` | stable | verified | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `celery` | `background-jobs` | stable | official | configure | `python` | `django` | `pip`, `uv`, `poetry` |
| `laravel-horizon` | `background-jobs` | stable | official | install | `php` | `laravel` | `composer` |
| `resend-node` | `email` | stable | official | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `django-anymail` | `email` | stable | verified | install | `python` | `django` | `pip`, `uv`, `poetry` |
| `aws-sdk-s3` | `storage` | stable | official | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `django-storages` | `storage` | stable | verified | install | `python` | `django` | `pip`, `uv`, `poetry` |
| `flysystem-s3` | `storage` | stable | verified | install | `php` | any | `composer` |
| `drf-spectacular` | `api-documentation` | stable | verified | install | `python` | `django` | `pip`, `uv`, `poetry` |
| `swagger-ui-express` | `api-documentation` | stable | verified | install | `node` | `express` | `npm`, `pnpm`, `yarn`, `bun` |
| `dotenv` | `configuration` | stable | verified | install | `node` | any | `npm`, `pnpm`, `yarn`, `bun` |
| `phpdotenv` | `configuration` | stable | verified | install | `php` | any | `composer` |
| `rust-config` | `configuration` | stable | verified | install | `rust` | any | `cargo` |
| `viper` | `configuration` | stable | verified | install | `go` | any | `go` |
| `helmet` | `security` | stable | verified | install | `node` | `express` | `npm`, `pnpm`, `yarn`, `bun` |
